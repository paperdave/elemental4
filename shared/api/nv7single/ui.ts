import { OptionsSection } from '../../elem';
import { listUI } from './listui';
import { Nv7SingleAPI } from './nv7single';
import { packUI } from './packui';

export function createOptions(api: Nv7SingleAPI): OptionsSection[] {
  let items: OptionsSection[] = [];
  let packitems = packUI(api);
  items.push({ 
    title: "Your Packs",
    desc: "These are the installed packs on your computer:",
    items: packitems,
  });
  if (api.hasWifi) {
    try {
      let listitems = listUI(api);
      items.push({ 
        title: "Available Packs",
        desc: "A list of packs that people have uploaded!",
        items: listitems,
      }); 
    } catch (e) {
      api.hasWifi = false;
    }
  }
  return items;
}
