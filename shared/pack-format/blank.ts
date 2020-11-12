import { ElemColor } from "../elem";
import { ElementalPackParser } from "../elem-pack";

export class BlankPackParser extends ElementalPackParser {
  async parse(contents: string) {
    this.insertElement({
      id: 'air',
      display: { text: 'Air', color: ElemColor.Blue }
    });
    this.insertElement({
      id: 'earth',
      display: { text: 'Earth', color: ElemColor.Brown }
    });
    this.insertElement({
      id: 'water',
      display: { text: 'Water', color: ElemColor.NavyBlue }
    });
    this.insertElement({
      id: 'fire',
      display: { text: 'Fire', color: ElemColor.Orange }
    });
    
    // throw new Error("Method not implemented.");
  }
}
