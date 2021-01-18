import { Elem, ElementalBaseAPI, ElementalLoadingUi, ServerStats, Suggestion, SuggestionAPI, SuggestionColorInformation, SuggestionRequest, SuggestionResponse, ElementalColorPalette, ThemedPaletteEntry, applyColorTransform, OptionsMenuAPI, OptionsSection, ElementalRuntimeUI, SaveFileAPI, ServerSavefileAPI, ServerSavefileEntry } from "../../elem";
import { Cache } from "./cache";
import { getElem, getCombination } from "./elements";
import Color from 'color';
import { createElem } from './suggestions';
import { createOptions } from './ui';
import { login } from './login';
import { initListUI } from "./listui";
import { PackItem } from "./types";

export class Nv7SingleAPI extends ElementalBaseAPI implements SuggestionAPI<'dynamic-elemental4'>, OptionsMenuAPI, ServerSavefileAPI {
  public pack: string;
  public cache: Cache;
  public ui: ElementalRuntimeUI;
  public saveFile: SaveFileAPI;
  public uid: string;
  public prefix: string;
  public items: PackItem[];
  public hasWifi: boolean = true;

  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    try {
      this.prefix = this.config.prefix;
      await login(this, ui);
      await initListUI(this, ui);
    } catch(e) {
      this.hasWifi = false;
    }
    ui.status("Loading packs", 0);
    if (this.saveFile.get("packs", "default") == "default") {
      this.saveFile.set("packs", [{title: "Default", description: "The default pack.", id: "default"}]);
      this.saveFile.set("pack", "default");
      this.saveFile.set("dbVers", 1);
      this.saveFile.set("found", {"default": ["Air", "Earth", "Water", "Fire"]});
      this.saveFile.set("kind", "likes");
      this.saveFile.set("search", "");
    }
    this.pack = this.saveFile.get("pack", "default");
    ui.status("Initializing cache", 0);
    this.cache = new Cache();
    ui.status("Initializing cache", 0.1);
    await this.cache.init(this);
    ui.status("Loading Elements", 0)
    return true;
  }
  async close(): Promise<void> {

  }
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: 0
    }
  }
  async getElement(id: string): Promise<Elem> {
    return getElem(this, id);
  }
  async getCombo(ids: string[]): Promise<string[]> {
    ids.sort();
    return getCombination(this, ids[0], ids[1]);
  }
  async getStartingInventory(): Promise<string[]> {
    return ["Air", "Earth", "Fire", "Water"];
  }
  lookupCustomPaletteColor(basePalette: Record<ElementalColorPalette, ThemedPaletteEntry>, string: string): Color {
    const [base, ...x] = string.split('_') 
		const [saturation, lightness] = x.map(y => parseFloat(y));

    return applyColorTransform(basePalette[base], saturation, lightness);
	}

  getSuggestionColorInformation(): SuggestionColorInformation<'dynamic-elemental4'> {
    return {
      type: 'dynamic-elemental4'
    };
  }

  async getSuggestions(ids: string[]): Promise<Suggestion<"dynamic-elemental4">[]> {return [];}
  async createSuggestion(ids: string[], suggestion: SuggestionRequest<"dynamic-elemental4">): Promise<SuggestionResponse> {
    ids.sort();
    return createElem(this, suggestion, ids[0], ids[1]);
  };
  async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<"dynamic-elemental4">): Promise<void> { return; };  
  getOptionsMenu(): OptionsSection[] {
    return createOptions(this);
  }

  readSaveFileElements(id: string): Promise<string[]> {
    return this.saveFile.get("found", {"default": ["Air", "Earth", "Water", "Fire"]})[this.pack];
  }
	writeNewElementToSaveFile(id: string, elementId: string): Promise<void> {
    let found = this.saveFile.get("found", {"default": ["Air", "Earth", "Water", "Fire"]});
    found[this.pack].push(elementId);
    this.saveFile.set("found", found);
    return;
  }
	canCreateSaveFile(name: string): boolean {return false;}
	createNewSaveFile(name: string): Promise<string> {throw new Error("Method not implemented.");}
	canDeleteSaveFile(id: string): boolean {return false;}
	deleteSaveFile(id: string): Promise<boolean> {throw new Error("Method not implemented.");}
	canRenameSaveFile(id: string, name: string): boolean {return false;}
  renameSaveFile(id: string, name: string): Promise<boolean> {throw new Error("Method not implemented.");}
  getSaveFiles(): ServerSavefileEntry[] {
    return [
      {
        id: "main",
        name: "Main Save",
      }
    ]
	}
}
