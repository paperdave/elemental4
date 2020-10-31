import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats, SuggestionAPI, SuggestionResponse, SuggestionRequest, Suggestion, ElementalRuntimeUI, RecentCombinationsAPI, RecentCombination} from "../../elem";
import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/database";
import {login} from "./login";

export class NV7ElementalAPI extends ElementalBaseAPI /*implements SuggestionAPI<'dynamic-elemental4'>, RecentCombinationsAPI*/ {  
	private db
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
			this.db = firebase.database();
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

  /*async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<'dynamic-elemental4'>): Promise<void> {

	}
  async createSuggestion(ids: string[], suggestion: SuggestionRequest<'dynamic-elemental4'>): Promise<SuggestionResponse> {
	 	return;
	}
	
	 async getSuggestions(ids: string[]): Promise<Suggestion<'dynamic-elemental4'>[]> {
	 	return;
	}

	getSuggestionType() {
	  return 'dynamic-elemental4' as const;
	}
  
  async waitForNewRecent(): Promise<void> {
    return;
  }

  async getRecentCombinations(): Promise<RecentCombination[]> {
    return;
  }*/
}
