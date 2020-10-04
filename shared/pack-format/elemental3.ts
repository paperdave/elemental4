import { Elem } from "../elem";
import { ElementalPackParser } from "../elem-pack";

export class Elemental3Parser extends ElementalPackParser {
  async parse(contents: string[]): Promise<void> {
    const jsonList = contents.map(x => JSON.parse(x));
    jsonList.forEach((x) => {
      
    });
  }
}
