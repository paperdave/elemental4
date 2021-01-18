import { OptionsSection } from '../../elem';
import { listUI } from './listui';
import { Nv7SingleAPI } from './nv7single';
import { packUI } from './packui';

export function createOptions(api: Nv7SingleAPI): OptionsSection[] {
  let packitems = packUI(api);
  let listitems = listUI(api);
  return [
    { 
      title: "Your Packs",
      desc: "These are the installed packs on your computer:",
      items: packitems,
    },
    { 
      title: "Available Packs",
      desc: "A list of packs that people have uploaded!",
      items: listitems,
    }
  ];
}