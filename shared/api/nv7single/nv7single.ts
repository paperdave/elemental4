import { Elem, ElementalBaseAPI, ElementalLoadingUi, ServerStats, Suggestion, SuggestionAPI, SuggestionColorInformation, SuggestionRequest, SuggestionResponse, ElementalColorPalette, ThemedPaletteEntry, applyColorTransform, OptionsMenuAPI, OptionsSection } from "../../elem";
import { Cache } from "./cache";
import { getElem, getCombination } from "./elements";
import Color from 'color';
import { createElem } from './suggestions';

export class Nv7SingleAPI extends ElementalBaseAPI implements SuggestionAPI<'dynamic-elemental4'>, OptionsMenuAPI {
  public pack: string;
  public cache: Cache;
  public ui;

  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    ui.status("Loading pack", 0);
    if (this.saveFile.get("packs", "default") == "default") {
      this.saveFile.set("packs", ["default"]);
      this.saveFile.set("pack", "default");
    }
    this.pack = this.saveFile.get("pack", "default");
    ui.status("Initializing cache", 0);
    this.cache = new Cache();
    ui.status("Initializing cache", 0.1);
    await this.cache.init();
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
    return [];
  }
}
