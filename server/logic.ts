// Handles raw elements, getting, setting
// with the database
import { elementNameToStorageID, sortCombo } from '../shared/shared';
import { VOTE_SCORES_EQUATION, VOTE_THRESHOLD_EQUATION } from './constants';
import { createQueueExec } from '../shared/async-queue-exec';
import { Parser } from 'expr-eval';
import { storageAddCombo, storageAddElement, getPublicId, storageIncElementCount, storageSetSuggestion, storageGetSuggestion, DbVariant, DbSuggestionEntry, storageCheckIP, storageGetElementNumberFromName, storageIncSuggestCount, storageDecSuggestCount } from './storage';
import { E4SuggestionRequest, E4SuggestionResponse } from '../shared/elemental4-types';
import sha256 from 'sha256';
import { getCurrentTime, logCombo, logSuggestion } from './data-logging';

const voteThresholdEq = new Parser().parse(VOTE_THRESHOLD_EQUATION);
const voteScoringEq = new Parser().parse(VOTE_SCORES_EQUATION);
const DEFAULT_THRESHOLD = voteThresholdEq.evaluate({
  voters: 1,
  hours: 0,
});


export async function logicAddCombo(a: string, b: string, result: string) {
  [a, b] = sortCombo(a, b);

  await storageAddCombo(a, b, result);
}

interface SuggestOptions {
  recipe: string;
  suggest: E4SuggestionRequest;
  ip: string;
  userId: string;
  userName: string;
  isUpvote: boolean
}

async function logicSuggestElement2({ recipe, suggest, userId, userName, ip, isUpvote }: SuggestOptions): Promise<E4SuggestionResponse> {  
  try {
    const x = await storageCheckIP(ip);
    if (!x) {
      return {
        result: 'vote-fraud-detected'
      }
    }
  } catch (error) {
    return {
      result: 'vote-fraud-detect-down'
    }
  }

  try {
    const voterHash = sha256(ip);

    const res = await storageGetSuggestion(recipe);
    
    if (!res) {
      if(!isUpvote) {
        return { result: 'voted' };
      }
      if (DEFAULT_THRESHOLD < 1) {
        let id = storageGetElementNumberFromName(suggest.text);
        let doCreatorMark = false;
        if (!id) {
          doCreatorMark = true;
          id = await storageAddElement({
            color: suggest.color,
            text: suggest.text,
            createdOn: Date.now(),
            creator1: await getPublicId(userId),
            creator2: null,
            creator1p: userId,
            creator2p: null,
          });
        }
        
        storageIncElementCount(userId);

        const x = recipe.split('+');
        await logicAddCombo(x[0], x[1], id);

        await storageSetSuggestion(recipe, { finished: true, result: id });

        return {
          result: 'element-added',
          newElement: id,
          doCreatorMark
        }
      }
      // Add a complete new suggestion.
      await storageSetSuggestion(recipe, {
        recipe,
        created: Date.now(),
        lastVote: Date.now(),
        finished: false,
        votes: [userId],
        ips: [voterHash],
        results: [
          {
            name: elementNameToStorageID(suggest.text),
            score: 1,
            voteCount: 1,
            downvoteIps: [],
            downvoteUsers: [],
            lastDownvote: Date.now(),
            variants: [
              {
                color: suggest.color,
                text: suggest.text,
                score: 1,
                creator: userId,
              }
            ],
            created: Date.now()
          }
        ]
      });
      await storageIncSuggestCount(userId, userName);
      await logSuggestion(
        getCurrentTime(),
        recipe,
        suggest.text.replace(/\s+/g, ' '),
        suggest.color.base,
        suggest.color.saturation,
        suggest.color.lightness,
        1,
        1,
        DEFAULT_THRESHOLD,
        false,
        ''
      )
      return {
        result: 'suggested',
      }
      
    } else {
      if (res.finished) {
        return {
          result: 'already-added',
          newElement: res.result
        }
      }
      if (res.finished === false) {
        if (isUpvote && res.ips.includes(voterHash) || res.votes.includes(userId)) {
          return {
            result: 'voted'
          };
        }
        
        if(isUpvote) {
          await storageIncSuggestCount(userId, userName);
          res.ips.push(voterHash)
          res.votes.push(userId)
        }
        
        const storageName = elementNameToStorageID(suggest.text);
        const findResult = res.results.find(x => x.name === storageName);
        
        const voteValue = (isUpvote) && voteScoringEq.evaluate({
          hours: (Date.now() - res.lastVote) / (1000*60*60)
        })
        const threshold = voteThresholdEq.evaluate({
          hours: (Date.now() - res.created) / (1000*60*60),
          voters: res.votes.length
        });

        if (!findResult) {
          if (!isUpvote) {
            return { result: 'voted' };
          }
          res.results.push({
            name: storageName,
            score: voteValue,
            created: Date.now(),
            voteCount: 1,
            downvoteIps: [],
            downvoteUsers: [],
            lastDownvote: Date.now(),
            variants: [
              {
                color: suggest.color,
                text: suggest.text,
                score: voteValue,
                creator: userId,
              }
            ]
          });
          await storageSetSuggestion(recipe, res);
          await logSuggestion(
            getCurrentTime(),
            recipe,
            suggest.text.replace(/\s+/g, ' '),
            suggest.color.base,
            suggest.color.saturation,
            suggest.color.lightness,
            voteValue,
            voteValue,
            threshold,
            false,
            ''
          );
          return {
            result: 'suggested'
          }
        } else {
          const downvoteValue = (!isUpvote) && voteScoringEq.evaluate({
            hours: (Date.now() - findResult.lastDownvote) / (1000*60*60)
          }) * 1.18
          if(isUpvote) {
            findResult.score += voteValue;
            findResult.voteCount ++;1
            res.lastVote = Date.now();
          } else {
            if(findResult.downvoteIps.includes(voterHash) || findResult.downvoteUsers.includes(userId)) {
              return { result: 'voted' };
            }
            findResult.score -= downvoteValue;
            findResult.downvoteIps.push(voterHash);
            findResult.downvoteUsers.push(userId);
          }

          const findVariant = findResult.variants.find(x =>
            x.text === suggest.text
            && x.color.base === suggest.color.base
            && x.color.saturation === suggest.color.saturation
            && x.color.lightness === suggest.color.lightness
          );
          if (findVariant) {
            if(isUpvote) {
              findVariant.score += voteValue;
            } else {
              findResult.score -= downvoteValue;
            }
          } else {
            if(isUpvote) {
              findResult.variants.push({
                color: suggest.color,
                text: suggest.text,
                score: voteValue,
                creator: userId,
              });
            }
          }

          if(!isUpvote) {
            await storageSetSuggestion(recipe, res);
            return {
              result: 'voted',
            }
          }
          let winner: DbSuggestionEntry;
          res.results.filter((x) => {
            if (x.score >= threshold && (!winner || (x.score > winner.score))) {
              winner = x;
            }
          });

          if (winner) {
            const mostVotedVariant = winner.variants.reduce(
              ((a, b) => (a.score > b.score) ? a : b)
              , { score: -1, text: "Nonexisty", color: { base: 'white', lightness: 0, saturation: 0 }}) as DbVariant;
            
            let id = storageGetElementNumberFromName(winner.name);
            let doCreatorMark = false;
            if (!id) {
              doCreatorMark = true;
              id = await storageAddElement({
                color: mostVotedVariant.color,
                text: mostVotedVariant.text,
                createdOn: Date.now(),
                creator1: await getPublicId(mostVotedVariant.creator),
                creator2: await getPublicId(userId),
                creator1p: mostVotedVariant.creator,
                creator2p: userId,
              });
            }
            
            storageIncElementCount(mostVotedVariant.creator);
            storageIncElementCount(userId);

            const x = recipe.split('+');
            await logicAddCombo(x[0], x[1], id);
            
            await logCombo(
              getCurrentTime(),
              (res.created - Date.now()) / (24*60*60*1000),
              x[0],
              x[1],
              id,
              findResult.score,
              threshold,
              res.votes.length,
              findResult.voteCount,
              res.results.length - 1,
            );

            await Promise.all(res.votes.map((x) => storageDecSuggestCount(x)));
            await storageSetSuggestion(recipe, { finished: true, result: id });

            await logSuggestion(
              getCurrentTime(),
              recipe,
              suggest.text.replace(/\s+/g, ' '),
              suggest.color.base,
              suggest.color.saturation,
              suggest.color.lightness,
              voteValue,
              findResult.score,
              threshold,
              true,
              id
            );

            return {
              result: 'element-added',
              newElement: id,
              doCreatorMark
            }
          } else {

            await logSuggestion(
              getCurrentTime(),
              recipe,
              suggest.text.replace(/\s+/g, ' '),
              suggest.color.base,
              suggest.color.saturation,
              suggest.color.lightness,
              voteValue,
              findResult.score,
              threshold,
              false,
              ''
            );

            await storageSetSuggestion(recipe, res);
            return {
              result: findVariant ? 'voted' : 'suggested',
            }
          }
        }
      }
    }
  } catch (error) {
    return {
      result: 'internal-error',
    }
  }
}

export const logicSuggestElement = createQueueExec(logicSuggestElement2);
