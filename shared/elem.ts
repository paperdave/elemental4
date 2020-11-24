import Color from "color";
import { DynamicColor } from "./elemental4-types";
import { IStore } from "./store";

export type ElementalColorPalette
  = 'white'
  | 'black'
  | 'light-grey'
  | 'grey'
  | 'dark-grey'
  | 'brown'
  | 'dark-brown'
  | 'red'
  | 'dark-red'
  | 'orange'
  | 'dark-orange'
  | 'yellow'
  | 'dark-yellow'
  | 'yellow-green'
  | 'dark-yellow-green'
  | 'green'
  | 'dark-green'
  | 'aqua'
  | 'dark-aqua'
  | 'blue'
  | 'dark-blue'
  | 'navy-blue'
  | 'purple'
  | 'dark-purple'
  | 'magenta'
  | 'dark-magenta'
  | 'pink'
  | 'hot-pink'
  | 'dark-hot-pink';
 
export const ElemColor = {
  White: 'white',
  Black: 'black',
  LightGrey: 'light-grey',
  Grey: 'grey',
  DarkGrey: 'dark-grey',
  Brown: 'brown',
  DarkBrown: 'dark-brown',
  Red: 'red',
  DarkRed: 'dark-red',
  Orange: 'orange',
  DarkOrange: 'dark-orange',
  Yellow: 'yellow',
  DarkYellow: 'dark-yellow',
  YellowGreen: 'yellow-green',
  DarkYellowGreen: 'dark-yellow-green',
  Green: 'green',
  DarkGreen: 'dark-green',
  Aqua: 'aqua',
  DarkAqua: 'dark-aqua',
  Blue: 'blue',
  DarkBlue: 'dark-blue',
  NavyBlue: 'navy-blue',
  Purple: 'purple',
  DarkPurple: 'dark-purple',
  Magenta: 'magenta',
  DarkMagenta: 'dark-magenta',
  Pink: 'pink',
  HotPink: 'hot-pink',
  DarkHotPink: 'dark-hot-pink',
};

/** Manifest required for Elemental server hosts. Can contain anything you want, and
 * that will be passed to the API handler. */
export interface ElementalConfig {
  /** The type of server, selects which API Interface to use. */
  type: string;
  /** Display name of server. */
  name: string;

  /** Specify an alternate base url for the api, if
   *  you are hosting the actual server somewhere else. */
  baseUrl?: string;
  /** Short description of the server. */
  description?: string;
  /** Icon to be displayed next to the server's name. */
  icon?: string;
  /** Version of the server. */
  version?: string;
  /** Name of who is hosting the server */
  host?: string;

  /** Any specific configuration can be stored in your elemental.json,
   *  it will be passed to the API Interface. */
  [key: string]: any;
}
export interface Elem {
  /** ID of element. Either an incrementing number or a uuid, or anything else. */
  id: string;
  /** Display Information. */
  display: {
    /** Text to go on the element. Not displayed if an image is set. It is required, since it's name can be displayed on the stats page or something. */
    text: string;
    /** Image URL to use as the background of the element. Can use a data url instead of an http one. Image should be square. Overrides `color` */
    image?: string;
    /**
     * Color to use as the background of the element. You should always specify a color in case the client doesn't support images.
     * Color must be either a HEX String starting with #, or a color name from the palette.
     */
    color?: string;
    /** Elemental 4 sorts elements into categories, if this isn't specified it goes off the color's name. */
    categoryName?: string;
  };
  /** Timestamp of when the element was created. */
  createdOn?: number;
  /** Timestamp of when the element was last modified (stat or comment changes). */
  modifiedOn?: number;
  /** Element Metadata and Statistics. You can include any or even more things. */
  stats?: {
    /** Creator display names. */
    creators?: string[];
    /** Comments to be displayed on the info panel. This is where pioneer marks would go. */
    comments?: ({ author?: string, comment: string })[];
    /** Fundamental counts */
    fundamentals?: {
      /** How many waters went into this */
      water?: number;
      /** How many airs went into this */
      air?: number;
      /** How many fires went into this */
      fire?: number;
      /** How many earths went into this */
      earth?: number;
      /** How much of this named element went into it */
      [name: string]: number;
    },
    /** simplest recipe, list of ids. if present, the client can calculate a tree. */
    simplestRecipe?: string[];
    /** amount of elements this element plays a part in */
    usageCount?: number;
    /** list of each recipe */
    usageList?: ({ recipe: string[], result: string[] })[];
    /** amount of recipes this element can be made by */
    recipeCount?: number;
    /** list of each recipe */
    recipeList?: string[][];
    /** Size of the shortest tree this has */
    treeComplexity?: number;
    /** Number of people who found the elements. */
    discoveries?: number;

    [stat: string]: any;
  }
}

export type SuggestionColorType = 'dynamic-elemental4' | 'freehand' | 'palette';

export interface SuggestionRequest<Type extends SuggestionColorType> {
  text: string;
  color: DynamicColor;
}

export interface Suggestion<Type extends SuggestionColorType> {
  text: string;
  color: DynamicColor;
}

export interface SuggestionResponse {
  suggestType: 'vote' | 'suggest' | 'failed' | 'already-added';
  /** If set then it the new element got added successfully to the server. */
  newElements?: string[];
}

export interface ServerStats {
  totalElements?: number;
}

export interface ElementalLoadingUi {
  status: (text: string, progress?: number) => void;
}

type ElementalPopupBackendAddHandler =
  ((event: 'close', handler: () => void) => ElementalPopupBackend)
  | ((event: 'load', handler: () => void) => ElementalPopupBackend)
  | ((event: 'message', handler: (data: any) => void) => ElementalPopupBackend)

export interface ElementalPopupBackend {
  postMessage: (message: any) => void;
  addMessageListener: ElementalPopupBackendAddHandler;
  removeMessageListener: ElementalPopupBackendAddHandler;
  close: () => void;
}

export interface SaveFileAPI {
  get<T>(k: string, def?: T): T;
  set(k: string, v: any): void;
  close: () => void;
}

interface ElementalBaseAPIParams<Config extends ElementalConfig = ElementalConfig> {
  baseUrl: string;
  saveFile: SaveFileAPI;
  config: Config;
  ui: ElementalRuntimeUI;
  store: IStore;
}

export interface ElementalRules {
  /** Can Elements combine with themselves? DEFAULT = true */
  selfCombine: boolean;
  /** Minimum elements required to form a combination. DEFAULT = 2 */
  minElementsToCombine: number;
  /** Maximum elements required to form a combination. DEFAULT = 2 */
  maxElementsToCombine: number;
}

export interface DialogButton {
  label: string;
  id: any;
}

export interface DialogInput {
  id: string;
  placeholder?: string;
  default?: string;
  type?: "text" | "password" | "email";
  disabled?: boolean;
}

export interface CustomDialogOptions {
  title: string,
  parts: DialogPart[],
  buttons?: DialogButton[],
}

export type DialogPart = DialogInput | string;

export interface AlertDialogOptions {
  title: string;
  text: string;
}
export interface ConfirmDialogOptions {
  title: string;
  text: string;
  trueButton?: string;
  falseButton?: string;
}
export interface PromptDialogOptions {
  title: string,
  text: string,
  defaultInput?: string,
  confirmButton?: string,
  cancelButton?: string,
}

export interface ElementalRuntimeUI {
  /** Wrapper around alert(), but async. Client will provide a user interface. */
  alert(opt: AlertDialogOptions ): Promise<void>;
  /** Wrapper around confirm(), but async. Client will provide a user interface. */
  confirm(opt: ConfirmDialogOptions): Promise<boolean>;
  /** Wrapper around prompt(), but async. Client will provide a user interface. */
  prompt(opt: PromptDialogOptions): Promise<string|undefined>;
  /** Opens an iframe to the specified url or a blank page if none.
   * The client will display this in a styled dialog. Null if client refuses. */
  popup: (frameUrl?: string) => Promise<ElementalPopupBackend | null>
  /** Creates a highly customizable dialog with markdown, inputs, and buttons. Client will provide a user interface. */
  dialog(opt: CustomDialogOptions): Promise<Record<string, string>>
  /** Shows a loading UI while an action takes place. */
  loading<X>(job: (ui: ElementalLoadingUi) => Promise<X>): Promise<X>
  /** Reloads UI */
  reloadSelf: () => Promise<void>;
}

/** Base API */
export abstract class ElementalBaseAPI<Config extends ElementalConfig = ElementalConfig> {
  static type: string = 'unknown';
  
  public baseUrl: string;
  public config: Config;
  protected store: IStore;
  protected saveFile: SaveFileAPI;
  protected ui: ElementalRuntimeUI;

  protected rules?: Partial<ElementalRules>;

  public getRules(): ElementalRules {
    return {
      maxElementsToCombine: 2,
      minElementsToCombine: 2,
      selfCombine: true,
      ...this.rules,
    };
  }

  constructor({baseUrl, saveFile, config, ui, store}: ElementalBaseAPIParams<Config>) {
    this.baseUrl = baseUrl
    this.saveFile = saveFile;
    this.config = config;
    this.ui = ui;
    this.store = store;
  }
  
  /** Called to setup everything. */
  abstract async open(ui?: ElementalLoadingUi): Promise<boolean>;

  /** Called to stop everything. Most cases you probably wont have anything to stop. */
  abstract async close(): Promise<void>;

  /** Get list of elements you start with. */
  abstract async getStartingInventory(): Promise<string[]>;

  /** Get various stats. */
  abstract async getStats(): Promise<ServerStats>;

  /** Fetch element data. */
  abstract async getElement(id: string): Promise<Elem>;

  /** Fetch combination data. */
  abstract async getCombo(ids: string[]): Promise<string[]>;
}

export interface SuggestionColorInformation<Type extends SuggestionColorType> {
  type: Type;
}

/** Suggestion API. Implement it if your API supports suggestions */
export interface SuggestionAPI<Type extends SuggestionColorType> {
  getSuggestionColorInformation: () => SuggestionColorInformation<Type>;

  /** Fetch suggestions. */
  getSuggestions: (ids: string[]) => Promise<Suggestion<Type>[]>;
  
  /** Create or Upvote a suggestion. */
  createSuggestion: (ids: string[], suggestion: SuggestionRequest<Type>) => Promise<SuggestionResponse>;

  /** Down Vote a suggestion. */
  downvoteSuggestion: (ids: string[], suggestion: SuggestionRequest<Type>) => Promise<void>;
}

export interface RecentCombination {
  recipe: [string, string],
  result: string;
}

/** Recent Additions API, implement if your API supports getting a list of recent elements. */
export interface RecentCombinationsAPI {
  getRecentCombinations(limit: number): Promise<RecentCombination[]>;

  waitForNewRecent(): Promise<void>
}

/** This object is highly specific to elemental 4. */
export interface ThemedPaletteEntry {
  color: Color;
  saturationMultiplier: number;
  lightnessMultiplier: number;
}

/** Custom Palette API. Implement it you have colors outside the built-in color palette. */
export interface CustomPaletteAPI {
  /** You are given Color objects for each color, which are from the current game theme. Map them to your own colors, however that may work. */
  lookupCustomPaletteColor: (basePalette: Record<ElementalColorPalette, ThemedPaletteEntry>, string: string) => Color;
}

export interface OptionTypes {
  string: string;
  number: number;
  checkbox: boolean;
  switch: boolean;
  select: string;
  checkboxGroup: string[];
  button: undefined;
  label: undefined;
}
export interface OptionChoice {
  label: string;
  id: string;
}
export interface OptionsItem<Type extends keyof OptionTypes = keyof OptionTypes> {
  /** Type of UI to go along with the ui. */
  type: Type;

  label: string;

  /** If your api needs to restart when changing this option, set to true. Restart happens after
   * closing the options menu or pressing Apply. Not immediately.
   */
  requiresRestart?: boolean;
  /** Default value, if value or the save file has nothing. */
  defaultValue?: OptionTypes[Type];

  /** For selects and checkboxGroups, the list of options */
  choices?: OptionChoice[];

  /** Validate stuff. */
  validator?: (v: OptionTypes[Type]) => void;
  
  // option 1
    /** Automatically sync with the savefile. */
    saveFileProp?: string;
  // option 2
    /** Manually provide a value and callback, react style. This is the value. */
    value?: OptionTypes[Type];
    /** Called when the value is saved. */
    onChange?: (v: OptionTypes[Type]) => void;
}
export interface OptionsSection {
  title: string;
  desc?: string;
  items: OptionsItem[];
}

/** Options Menu API. Implement if you want configurable options.  */
export interface OptionsMenuAPI {
  getOptionsMenu: () => OptionsSection[];
}

export interface Hint {
  recipePart: string;
  result: string;
}

/** Hint API, used to get hints duh. */
export interface HintAPI {
  getHint: (inventory: string[]) => Promise<Hint>;
}

export interface ServerSavefileEntry {
  id: string;
  name: string;
}

/** Server Savefile API. Implement it if your server handles savefile storage. If not implemented
 *  the client may or may not provide it's own method of multiple savefile.
 * 
 *  DO NOT implement to restrict the multiple savefile feature of elemental 4.
 */
export interface ServerSavefileAPI {
  getSaveFiles(): ServerSavefileEntry[];
  readSaveFileElements(id: string): Promise<string[]>;
  writeNewElementToSaveFile(id: string, elementId: string): Promise<void>;
  canCreateSaveFile(name: string): boolean;
  createNewSaveFile(name: string): Promise<string>;
  canDeleteSaveFile(id: string): boolean;
  deleteSaveFile(id: string): Promise<boolean>;
  canRenameSaveFile(id: string, name: string): boolean;
  renameSaveFile(id: string, name: string): Promise<boolean>;
}

export interface ElementalSubAPIs {
  suggestion: SuggestionAPI<any>;
  customPalette: CustomPaletteAPI;
  optionsMenu: OptionsMenuAPI;
  serverSaveFile: ServerSavefileAPI;
  recentCombinations: RecentCombinationsAPI;
  hint: HintAPI;
}

const subAPIChecks: Record<keyof ElementalSubAPIs, string[]> = {
  suggestion: ['getSuggestions', 'createSuggestion'],
  customPalette: ['lookupCustomPaletteColor'],
  optionsMenu: ['getOptionsMenu'],
  serverSaveFile: ['getSaveFiles'],
  recentCombinations: ['getRecentCombinations'],
  hint: ['getHint'],
}

export function getSubAPI(api: ElementalBaseAPI): ElementalBaseAPI
export function getSubAPI<SubAPIName extends keyof ElementalSubAPIs>(api: ElementalBaseAPI, type: SubAPIName): null | (ElementalBaseAPI & ElementalSubAPIs[SubAPIName])
export function getSubAPI(api: any, type?: any) {
  if(!type) return api;
  return subAPIChecks[type].every(prop => prop in api) ? api : null;
}

export function applyColorTransform(paletteEntry: ThemedPaletteEntry, saturation: number, lightness: number) {
  const baseColor = Color(paletteEntry.color);

  const baseSaturation = baseColor.saturationl() / 100;
  const baseLightness = baseColor.lightness() / 100;

  const lightnessMultiplier = lightness === 0 ? 0
    : lightness > 0
      ? (0.9-baseLightness) * paletteEntry.lightnessMultiplier
      : (baseLightness-0.1) * paletteEntry.lightnessMultiplier;
  const saturationMultiplier = saturation === 0 ? 0
    : saturation > 0
      ? (0.9-baseSaturation) * paletteEntry.saturationMultiplier * 2.5
      : (baseSaturation-0.1) * paletteEntry.saturationMultiplier;

  let modifiedColor = baseColor;
  if(saturation !== 0 && baseSaturation !== 0) modifiedColor = modifiedColor.saturate((saturation * saturationMultiplier)/baseSaturation);
  if(lightness !== 0) modifiedColor = modifiedColor.lighten(lightness * lightnessMultiplier);
  return modifiedColor;
}
