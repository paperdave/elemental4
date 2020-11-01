import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats, SuggestionAPI, SuggestionResponse, SuggestionRequest, Suggestion, ElementalRuntimeUI, RecentCombinationsAPI, RecentCombination, ServerSavefileAPI, ServerSavefileEntry} from "../../elem";
import firebase from "firebase/app";
import "firebase/analytics";
import {login} from "./login";
import {foundElement, getFound} from "./savefile";

export class NV7ElementalAPI extends ElementalBaseAPI implements /*SuggestionAPI<'dynamic-elemental4'>, RecentCombinationsAPI,*/  ServerSavefileAPI {
	public uid: string
	public saveFile
	public ui

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
		}

		return await login(this, ui);
  }
  async close(): Promise<void> {
	this.saveFile.set("open", false);
  }
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: 0
    }
  }
  async getElement(id: string): Promise<Elem> {
    return null;
  }
  async getCombo(ids: string[]): Promise<string[]> {
    return [];
  }
  async getStartingInventory(): Promise<string[]> {
    return ['1','2','3','4'];
  }

  getSaveFiles(): ServerSavefileEntry[] {
    return [
      {
        id: "main",
        name: "Main Save",
      }
    ]
	}
	readSaveFileElements(id: string): Promise<string[]> {
		return getFound(this);
	}
	writeNewElementToSaveFile(id: string, elementId: string): Promise<void> {
		return foundElement(this, elementId);
	}
	canCreateSaveFile(name: string): boolean {
		return false;
	}
	createNewSaveFile(name: string): Promise<string> {
		throw new Error("Method not implemented.");
	}
	canDeleteSaveFile(id: string): boolean {
		return false;
	}
	deleteSaveFile(id: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	canRenameSaveFile(id: string, name: string): boolean {
		return false;
	}
	renameSaveFile(id: string, name: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
}
