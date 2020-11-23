import { Elem, ElementalBaseAPI, ElementalLoadingUi, ServerStats, SuggestionAPI, SuggestionResponse, SuggestionRequest, Suggestion, ServerSavefileAPI, ServerSavefileEntry, SuggestionColorInformation, ElementalColorPalette, ThemedPaletteEntry, applyColorTransform, RecentCombinationsAPI, RecentCombination} from "../../elem";
import Color from 'color';
import {login} from "./login";
import {foundElement, getFound} from "./savefile";
import {getElem, getCombination} from "./elements";
import {getSuggests, downSuggestion, newSuggestion} from "./suggestions";
import {getRecents, waitForNew} from "./recents";
import { IStore } from "../../store";

declare const $production: string;

export class NV7ElementalAPI extends ElementalBaseAPI implements SuggestionAPI<'dynamic-elemental4'>, RecentCombinationsAPI,  ServerSavefileAPI {
	public uid: string
	public saveFile;
	public ui;
	public votesRequired: number = 3;
	public ref;
	public store: IStore;
	public prefix: string;

  async open(ui?: ElementalLoadingUi): Promise<boolean> {
		if ($production) {
			this.prefix = "https://api.nv7haven.tk/"
		} else {
			this.prefix = "http://0.0.0.0:8080/"
		}
		return login(this, ui);
  }
  async close(): Promise<void> {
		this.ref.close();
		return;
	}
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: 0
    }
  }
  async getElement(id: string): Promise<Elem> {return getElem(this, id);}
  async getCombo(ids: string[]): Promise<string[]> {
		ids.sort();
		return getCombination(this, ids[0], ids[1]);
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
    return {
      type: 'dynamic-elemental4'
    };
  }
	async getSuggestions(ids: string[]): Promise<Suggestion<"dynamic-elemental4">[]> {
		ids.sort();
		return getSuggests(this, ids[0], ids[1]);
	}
	async createSuggestion(ids: string[], suggestion: SuggestionRequest<"dynamic-elemental4">): Promise<SuggestionResponse> {
		ids.sort();
		return newSuggestion(ids[0], ids[1], suggestion, this);
	}

	async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<"dynamic-elemental4">): Promise<void> {
		ids.sort();
		return downSuggestion(suggestion, this);
	}

	async getRecentCombinations(limit: number): Promise<RecentCombination[]> {
		return getRecents(this);
	}

	async waitForNewRecent(): Promise<void> {
		return waitForNew(this);
	}

	lookupCustomPaletteColor(basePalette: Record<ElementalColorPalette, ThemedPaletteEntry>, string: string): Color {
    const [base, ...x] = string.split('_') 
		const [saturation, lightness] = x.map(y => parseFloat(y));

    return applyColorTransform(basePalette[base], saturation, lightness);
  }
}
