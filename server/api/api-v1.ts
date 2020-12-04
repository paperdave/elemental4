// handles application program interface v1
import e, { Router } from 'express';
import { logicSuggestElement } from '../logic';
import { DEV_VOTE_NO_CHECK, GAME_DATA_FOLDER, IP_FORWARDING } from '../constants';
import { getPublicId, storageAddElementComment, storageDumpNames, storageGetEntriesAfter, storageGetEntryCount, storageGetSuggestion, storageSetUserName, storageVerifyProfile } from '../storage';
import path from 'path'
import { pathExists, readFile } from 'fs-extra';

function formatDate(x: Date) {
    return `${x.getUTCFullYear()}-${(x.getUTCMonth()+1).toString().padStart(2,'0')}-${x.getUTCDate().toString().padStart(2, '0')}`;
}

/** API Router v1 */
export default function() {
    const router = Router();

    router.post("/api/v1/update-profile", async (req, res, next) => {
        const authorization = decodeURIComponent(req.headers.authorization);
        const userMatch = authorization.match(/^Elemental4User "([a-zA-Z0-9]{32})" (?:"(.{1,32})")?$/);
        if(!userMatch) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }
        const userId = userMatch[1];
        const userName = userMatch[2];
        if (userId.length !== 32) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }
        const publicId = await storageSetUserName(userId, userName);
        res.send({ updated: true, publicId });
    });
    router.post("/api/v1/verify-profile", async (req, res, next) => {
        const authorization = decodeURIComponent(req.headers.authorization);
        const userMatch = authorization.match(/^Elemental4User "([a-zA-Z0-9]{32})" (?:"(.{1,32})")?$/);
        if(!userMatch) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }
        const userId = userMatch[1];
        const userName = userMatch[2];
        if (userId.length !== 32) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }
        const data = await storageVerifyProfile(userId);
        res.send(data);
    });
    router.get("/api/v1/profiles", async (req, res, next) => {
        const x = await storageDumpNames()
        res.send(x);
    });
    router.get('/api/v1/ip', (req,res) => {
        const voterId = DEV_VOTE_NO_CHECK ? Math.random().toString() : ((IP_FORWARDING && req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].toString().split(',')[0].trim()) || req.connection.remoteAddress).toString();
        res.send(voterId)
    })
    router.post("/api/v1/suggestion/:query", async (req, res, next) => {
        const authorization = decodeURIComponent(req.headers.authorization);
        const userMatch = authorization.match(/^Elemental4User "([a-zA-Z0-9]{32})" (?:"(.{1,32})")?$/);
        if(!userMatch) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }
        const creator = userMatch[1];
        const userName = userMatch[2];
        if (creator.length !== 32) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }

        let e1 = req.params.query.split("+")[0];
        let e2 = req.params.query.split("+")[1];

        if (e1.includes("..")) return next();
        if (e2.includes("..")) return next();
        if (e2 < e1) {
            let c = e2;
            e2 = e1;
            e1 = c;
        }

        // get and verify post request
        // writeSuggestion it
        let data = "";
        let tooLong = false;
        req.on("data", (chunk) => {
            if (data.length>1000) {
                tooLong = true;
                res.status(400);
                res.send({ error: 'Input too long' });
            } else {
                data += chunk;
            }
        });
        req.on("end", async () => {
            if(tooLong) return
            try {
                const parse = JSON.parse(data);
                if ((parse === null) || (parse === undefined)
                    || ((typeof parse) !== "object")
                    || ((typeof parse.text) !== "string")
                    || ((typeof parse.color) !== "object")
                    || ((typeof parse.color) === null)
                    || ((typeof parse.color.base) !== "string")
                    || ((typeof parse.color.saturation) !== "number")
                    || ((typeof parse.color.lightness) !== "number")
                    || ((typeof parse.vote) !== 'boolean')
                ) {
                    res.statusCode = 400;
                    res.send({ error: 'Invalid Object' })
                    return;
                }

                parse.text = parse.text.replace(/^ | $|( ) +/, '$1').slice(0, 50)

                if(parse.text === '') {
                    res.statusCode = 400;
                    res.send({ error: 'Invalid Object' })
                    return;
                }

                const voterId = DEV_VOTE_NO_CHECK ? Math.random().toString() : ((IP_FORWARDING && req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].toString().split(',')[0].trim()) || req.connection.remoteAddress).toString();

                try {
                    const result = await logicSuggestElement({
                        recipe: e1 + '+' + e2,
                        suggest: { color: parse.color, text: parse.text },
                        ip: voterId,
                        userId: creator,
                        userName: userName,
                        isUpvote: parse.vote,
                    });
                    const publicId = await storageSetUserName(creator, userName);
                    res.send({ ...result, publicId });
                } catch (error) {
                    console.log(error);
                    res.statusCode = 500;
                    res.send('500');
                }
            } catch (error) {
                res.statusCode = 400;
                res.end("400");
            }
        });
    });
    router.post("/api/v1/comment/:query", async (req, res, next) => {
        const authorization = decodeURIComponent(req.headers.authorization);
        const userMatch = authorization.match(/^Elemental4User "([a-zA-Z0-9]{32})" (?:"(.{1,32})")?$/);
        if(!userMatch) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }
        const creator = userMatch[1];
        if (creator.length !== 32) {
            res.setHeader('WWW-Authenticate', 'Elemental4User realm="Elemental 4 User"')
            res.status(401);
            res.send({ error: "unauthorized" });
            return;
        }

        // get and verify post request
        // writeSuggestion it
        let data = "";
        let tooLong = false;
        req.on("data", (chunk) => {
            if (data.length>1000) {
                tooLong = true;
                res.status(400);
                res.send({ error: 'Input too long' });
            } else {
                data += chunk;
            }
        });
        req.on("end", async () => {
            if(tooLong) return
            try {
                const parse = JSON.parse(data);
                if ((parse === null) || (parse === undefined)
                    || ((typeof parse) !== "object")
                    || ((typeof parse.comment) !== "string")
                ) {
                    res.statusCode = 400;
                    res.send({ error: 'Invalid Object' })
                    return;
                }

                parse.comment = parse.comment.replace(/^ | $|( ) +/, '$1').slice(0, 140)

                try {
                    storageAddElementComment(req.params.query, creator, parse.comment);
                    res.send('Applied')
                } catch (error) {
                    console.log(error);
                    res.statusCode = 500;
                    res.send('500');
                }
            } catch (error) {
                res.statusCode = 400;
                res.end("400");
            }
        });
    });
    // Get Suggestions for a combo
    router.get("/api/v1/suggestion/:query", async (req, res, next) => {
        let [e1, e2] = req.params.query.split("+");

        if (e2 < e1) {
            let c = e2;
            e2 = e1;
            e1 = c;
        }

        const dbData = await storageGetSuggestion(e1 + '+' + e2);
        if (dbData) {
            if(dbData.finished) {
                res.send([]);
            } else if (dbData.finished === false) {
                const r = dbData.results.map(r => r.variants.map(v => ({color:v.color, text: v.text}))).flat();
                res.send(r);
            }
        } else {
            res.send([]);
        }
    });
    router.get('/api/v1/db/all', (req, res, next) => {
        if(Object.keys(req.query).length !== 0) next();
        res.setHeader('Elem4-Entry-Length', storageGetEntryCount());
        res.sendFile(path.join(GAME_DATA_FOLDER, 'db', 'all.e4db'), { headers: { 'content-type': 'text/elemental4-data' } })
    });
    router.get('/api/v1/db/after-entry/:entry', (req, res, next) => {
        if(Object.keys(req.query).length !== 0) next();
        const entry = req.params.entry;
        const num = parseInt(entry);
        if(num >= 0) {
            const entries = storageGetEntriesAfter(num);
            
            res.contentType('text/elemental4-data')
            res.setHeader('Elem4-Entry-Length', entries.length);
            res.send(entries.map(x => JSON.stringify(x)).join('\n') + (entries.length === 0 ? '' : '\n'));
        } else {
            next();
        }
    });
    router.get('/api/v1/db/from-date/:date', async(req, res, next) => {
        if(Object.keys(req.query).length !== 0) next();
        let date = req.params.date;
        const d = new Date(date);

        if (isNaN(d.getTime())) {
            next();
        } else {
            const today = formatDate(new Date())
            if (await pathExists(path.join(GAME_DATA_FOLDER, 'db', date + '.e4db'))) {
                const files = [];
                while (date !== today) {
                    files.push(date);
                    date = formatDate(new Date(new Date(date).getTime() + 1*24*60*60*1000 + 500));
                }
                const newEntries = storageGetEntriesAfter(0);
                let data = ((await Promise.all(files.map(x => readFile(path.join(GAME_DATA_FOLDER, 'db', x + '.e4db'))))).join('') + newEntries.map(x => JSON.stringify(x)).join('\n') + '\n').replace(/\n\n+/g, '\n');
                let length = data.split('\n').length - 1;

                if (data.trim() === '') {
                    res.contentType('text/elemental4-data')
                    res.setHeader('Elem4-Entry-Length', 0);
                    res.send('');
                    return;
                }
                res.contentType('text/elemental4-data')
                res.setHeader('Elem4-Entry-Length', length);
                res.send(data);
            } else {
                if(today === date) {
                    res.contentType('text/elemental4-data')
                    res.setHeader('Elem4-Entry-Length', 0);
                    res.send('');
                } else {
                    next();
                }
            }
        }
    });

    return router;
}
