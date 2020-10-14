export type E4ColorPalette
  = 'white'
  | 'black'
  | 'grey'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'yellow-green'
  | 'green'
  | 'aqua'
  | 'blue'
  | 'dark-blue'
  | 'purple'
  | 'magenta'
  | 'hot-pink'

export interface DynamicColor {
  base: E4ColorPalette;
  saturation: number;
  lightness: number;
}

export interface ElementEntry {
  entry: number;
  createdOn: number;
  id: string;
  type: 'element';
  text: string;
  color: DynamicColor;
  creators: string[];
}
export interface ComboEntry {
  entry: number;
  type: 'combo';
  recipe: string;
  result: string;
}
export interface CommentEntry {
  entry: number;
  type: 'comment';
  id: string;
  user: string;
  comment: string;
}
export type Entry = ElementEntry | ComboEntry | CommentEntry;
export type EntryNoNumber = Omit<ElementEntry, 'entry'> | Omit<ComboEntry, 'entry'> | Omit<CommentEntry, 'entry'>;;

export interface E4SuggestionRequest {
  text: string;
  color: DynamicColor;
}

export interface E4Suggestion {
  text: string;
  color: DynamicColor;
}

export interface E4SuggestionResponse {
  result: 'voted' | 'suggested' | 'already-added' | 'vote-fraud-detect-down' | 'vote-fraud-detected' | 'element-added' | 'internal-error';
  /** If set then it the new element got added successfully to the server. */
  newElement?: string;
  doCreatorMark?: boolean;
}
