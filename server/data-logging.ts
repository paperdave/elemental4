import { DATALOG_SHEET_ID, GCLOUD_AUTH } from './constants';
import { GoogleSpreadsheet } from 'google-spreadsheet';

type DataLogElement = [
  Time: string,
  ElementNo: number,
  ElementName: string,
  StorageID: string,
  BaseColor: string,
  Saturation: number,
  Lightness: number,
  Voter1: string,
  Voter2: string,
];
type DataLogCombo = [
  Time: string,
  DurationInDays: number,
  Ingredient1ID: string,
  Ingredient2ID: string,
  ResultID: string,
  FinalScore: number,
  FinalThreshold: number,
  TotalVotes: number,
  VotesOnThis: number,
  Competitors: number,
];
type DataLogSuggestion = [
  Time: string,
  Recipe: string,
  ElementText: string,
  BaseColor: string,
  Saturation: number,
  Lightness: number,
  Score: number,
  ResultScore: number,
  ScoreRequired: number,
  TriggeredAdd: boolean,
  AddedElement: string,
];
type DataLogComment = [
  Time: string,
  ElementID: string,
  Comment: string,
];

let doc: GoogleSpreadsheet;
export async function logOpenSheet() {
  if(!DATALOG_SHEET_ID)return;
  doc = new GoogleSpreadsheet(DATALOG_SHEET_ID);
  await doc.useServiceAccountAuth(GCLOUD_AUTH);
  await doc.loadInfo();
}

export async function logElement(...row: DataLogElement) {
  if(!DATALOG_SHEET_ID)return;
  await doc.sheetsByTitle['Elements'].addRow(row);
}
export async function logCombo(...row: DataLogCombo) {
  if(!DATALOG_SHEET_ID)return;
  await doc.sheetsByTitle['Combinations'].addRow(row);
}
export async function logSuggestion(...row: DataLogSuggestion) {
  if(!DATALOG_SHEET_ID)return;
  await doc.sheetsByTitle['Suggestions'].addRow(row);
}
export async function logComment(...row: DataLogComment) {
  if(!DATALOG_SHEET_ID)return;
  await doc.sheetsByTitle['Comments'].addRow(row);
}

export function getCurrentTime() {
  const x = new Date();
  return `${x.getFullYear()}-${(x.getMonth()+1).toString().padStart(2,'0')}-${x.getDate().toString().padStart(2, '0')} ${x.toTimeString().split(' ')[0]}`;
}
