import { Elem, ElementalBaseAPI, ElementalLoadingUi, ServerStats, SuggestionAPI, SuggestionResponse, SuggestionRequest, Suggestion, ServerSavefileAPI, ServerSavefileEntry, SuggestionColorInformation, ElementalColorPalette, ThemedPaletteEntry, applyColorTransform, RecentCombinationsAPI, RecentCombination} from "../../elem";
import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/firestore";
import Color from 'color';
import {login} from "./login";
import {foundElement, getFound} from "./savefile";
import {getElem, getCombination} from "./elements";
import {getSuggests, downSuggestion, newSuggestion} from "./suggestions";
import {getRecents} from "./recents";

export class NV7ElementalAPI extends ElementalBaseAPI implements SuggestionAPI<'dynamic-elemental4'>, RecentCombinationsAPI,  ServerSavefileAPI {
	public uid: string
	public saveFile;
	public ui;
	public votesRequired: number = 3;

  async open(ui?: ElementalLoadingUi): Promise<boolean> {
		if (firebase.apps.length != 1) {
			var firebaseConfig = {
				apiKey: "AIzaSyCsqvV3clnwDTTgPHDVO2Yatv5JImSUJvU",
				authDomain: "elementalserver-8c6d0.firebaseapp.com",
				databaseURL: "https://elementalserver-8c6d0.firebaseio.com",
				projectId: "elementalserver-8c6d0",
				storageBucket: "elementalserver-8c6d0.appspot.com",
				messagingSenderId: "603503529201",
				appId: "1:603503529201:web:5cd30f72bb4971bdc0ed50",
				measurementId: "G-K8QX9GEW6V"
			};
			// Initialize Firebase
			firebase.initializeApp(firebaseConfig);
			firebase.analytics();
			firebase.firestore().enablePersistence().catch(async function(error) {
				ui.status("Showing Error", 0);
				await this.ui.alert({
					"text": error.message,
					"title": "Error",
					"button": "Ok",
				});
			});
		}

		return await login(this, ui);
  }
  async close(): Promise<void> {return;}
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: 0
    }
  }
  async getElement(id: string): Promise<Elem> {return getElem(id);}
  async getCombo(ids: string[]): Promise<string[]> {
		ids.sort();
		return getCombination(ids[0], ids[1]);
	}
  async getStartingInventory(): Promise<string[]> {
		return ['Air','Earth','Fire','Water'];
	}

  getSaveFiles(): ServerSavefileEntry[] {
    return [
      {
        id: "main",
        name: "Main Save",
      }
    ]
	}
	readSaveFileElements(id: string): Promise<string[]> {return getFound(this);}
	writeNewElementToSaveFile(id: string, elementId: string): Promise<void> {return foundElement(this, elementId);}
	canCreateSaveFile(name: string): boolean {return false;}
	createNewSaveFile(name: string): Promise<string> {throw new Error("Method not implemented.");}
	canDeleteSaveFile(id: string): boolean {return false;}
	deleteSaveFile(id: string): Promise<boolean> {throw new Error("Method not implemented.");}
	canRenameSaveFile(id: string, name: string): boolean {return false;}
	renameSaveFile(id: string, name: string): Promise<boolean> {throw new Error("Method not implemented.");}

	getSuggestionColorInformation(): SuggestionColorInformation<'dynamic-elemental4'> {
		console.log("ree");
    return {
      type: 'dynamic-elemental4'
    };
  }
	async getSuggestions(ids: string[]): Promise<Suggestion<"dynamic-elemental4">[]> {
		ids.sort();
		return getSuggests(ids[0], ids[1]);
	}
	async createSuggestion(ids: string[], suggestion: SuggestionRequest<"dynamic-elemental4">): Promise<SuggestionResponse> {
		ids.sort();
		return newSuggestion(ids[0], ids[1], suggestion, this);
	}

	async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<"dynamic-elemental4">): Promise<void> {
		ids.sort();
		return downSuggestion(ids[0], ids[1], suggestion, this);
	}

	async getRecentCombinations(limit: number): Promise<RecentCombination[]> {
		return getRecents(limit);
	}

	async waitForNewRecent(): Promise<void> {
		throw new Error("Method not implemented");
	}

	lookupCustomPaletteColor(basePalette: Record<ElementalColorPalette, ThemedPaletteEntry>, string: string): Color {
    const [base, ...x] = string.split('_') 
		const [saturation, lightness] = x.map(y => parseFloat(y));

    return applyColorTransform(basePalette[base], saturation, lightness);
  }
}
