import { ElementalPackParser } from "../elem-pack";

export class BlankPackParser extends ElementalPackParser {
  parse(contents: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
