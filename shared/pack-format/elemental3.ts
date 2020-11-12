import { Elem } from "../elem";
import { ElementalPackParser } from "../elem-pack";

export class Elemental3Parser extends ElementalPackParser {
  async parse(contents: string): Promise<void> {
    const json = JSON.parse(contents);
    
  }
}
