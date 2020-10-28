import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats, SuggestionAPI, SuggestionResponse, SuggestionRequest, Suggestion} from "../elem";
import firebase from "../../node_modules/firebase";

export class NV7ElementalAPI extends ElementalBaseAPI implements SuggestionAPI<'dynamic-elemental4'> {  
	private db
	private uid: string

  async open(ui?: ElementalLoadingUi): Promise<boolean> {
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

		while (true) {
			var uid = this.saveFile.get("user", "default")
			if (uid == "default") {
				let creds = await this.ui.prompt({
						title: 'Nv7 Elemental Login',
						text: 'Put in your password and email somehow',
						defaultText: '',
						confirmButton: 'Log In',
					});
					
					var err: string
					var code = -1

					if (creds) {
						var result = await new Promise((resolve, reject) => {
							var count = 0;
							firebase.auth().createUserWithEmailAndPassword(creds, "Reee12345_12365").catch(function(error) {
								resolve(error.message);
							});
							firebase.auth().onAuthStateChanged((user) => {
								if (user) {;
									this.uid = user.uid;
									this.saveFile.set("user", this.uid);
									count++;
									if (count == 2) {
										resolve(true);
									}
								}
							});
						});

						if (result == true) {
							return true;
						} else {
							await this.ui.alert({
								"text": result as string,
								"title": "Error",
								"button": "Ok",
							});
						}
					}
				} else {
					this.uid = uid;
					return true;
				}
		} 
  }
  async close(): Promise<void> {

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

  async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<'dynamic-elemental4'>): Promise<void> {

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
}
