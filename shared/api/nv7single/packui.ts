import { ElementalLoadingUi, OptionsItem } from "../../elem";
import { Nv7SingleAPI } from "./nv7single";
import { PackData, PackInfo } from "./types";

export function  packUI(api: Nv7SingleAPI): OptionsItem[] {
  let packs = api.saveFile.get("packs", []) as PackInfo[]
  let items: OptionsItem[] = [
    {
      type: "button",
      label: "New Pack",
      onChange: async () => {
        let title = await api.ui.prompt({
          title: "Pack Name",
          text: "Enter the name of the pack below!"
        });
        let desc = await api.ui.prompt({
          title: "Pack Description",
          text: "Enter the description of the pack below!"
        });
        if (title == "" || desc == "") {
          return;
        }
        let info: PackInfo = {
          title: title,
          description: desc,
          id: encodeURIComponent(title.toLowerCase()),
        }
        if (packs.includes(info)) {
          await api.ui.alert({
            title: "Pack Already Exists",
            text: "That pack already exists!",
          })
          return;
        }
        api.pack = info.id;
        await api.cache.newPack(api.pack);
        packs.push(info);
        api.saveFile.set("pack", api.pack);
        api.saveFile.set("packs", packs);
        await api.cache.add(api.pack, "Air", {
          name: "Air",
          color: "blue_0_0",
          comment: "The first element!",
          parents: [],
        });
        await api.cache.add(api.pack, "Earth", {
          name: "Earth",
          color: "brown_0_-1",
          comment: "The second element!",
          parents: [],
        });
        await api.cache.add(api.pack, "Fire", {
          name: "Fire",
          color: "orange_0_0",
          comment: "The third element!",
          parents: [],
        });
        await api.cache.add(api.pack, "Water", {
          name: "Water",
          color: "dark-blue_0_0",
          comment: "The third element!",
          parents: [],
        });
        let found = api.saveFile.get("found", {"default": ["Air", "Earth", "Water", "Fire"]});
        found[api.pack] = ["Air", "Earth", "Fire", "Water"];
        api.saveFile.set("found", found);
        await api.ui.reloadSelf();
      }
    },
    {
      type: "button",
      label: "Upload Pack",
      onChange: async () => {
        const upload = document.createElement('input');
        upload.type = "file";
        upload.accept = ".pack";
        upload.value = null;
        document.body.appendChild(upload)
        upload.click();
        upload.onchange = (e) => {
          const reader = new FileReader();
          reader.onerror = (ev) => {console.error(ev.target)};
          reader.onload = async (ev) => {
            const res: PackData = JSON.parse(ev.target.result as string);
            let dat = JSON.parse(res.data);
            await api.ui.loading(async (ui: ElementalLoadingUi) => {
              ui.status("Creating Pack", 0)
              try {
                await api.cache.newPack(res.id);
              } catch (a) {
                await api.cache.init(api);
              }
              ui.status("Installing Pack", 0)
              let keys = Object.keys(dat);
              for (let j = 0; j < keys.length; j++) {
                await api.cache.add(res.id, keys[j], dat[keys[j]]);
                ui.status("Installing Pack", j/keys.length);
              }
              ui.status("Setting Up Pack", 0);
              packs = api.saveFile.get("packs", []) as PackInfo[]
              let isIn = false;
              for (let j = 0; j < packs.length; j++) {
                if (packs[j].id == res.id) {
                  isIn = true;
                }
              }
              if (!isIn) {
                packs.push({
                  title: res.title,
                  description: res.description,
                  id: res.id,
                });
              }
              ui.status("Setting Up Pack", 0.1);
              api.pack = res.id;
              ui.status("Setting Up Pack", 0.2);
              api.saveFile.set("packs", packs);
              ui.status("Setting Up Pack", 0.4);
              api.saveFile.set("pack", api.pack);
              ui.status("Setting Up Pack", 0.8);
              let found = api.saveFile.get("found", {"default": ["Air", "Earth", "Water", "Fire"]});
              found[api.pack] = ["Air", "Earth", "Fire", "Water"];
              api.saveFile.set("found", found);
              ui.status("Setting Up Pack", 1);
            })
            await api.ui.reloadSelf();
          }
          reader.readAsText(upload.files[0])
        }
        document.body.removeChild(upload);
      }
    }
  ];
  let choices = [
    {
      label: "Edit",
      id: "edit",
    },
    {
      label: "Export",
      id: "export",
    },
    {
      label: "Select",
      id: "select",
    }
  ];
  if (api.hasWifi) {
    choices.splice(0, 0, {
      label: "Upload",
      id: "upload",
    })
  }
  for (let i = 0; i < packs.length; i++) {
    items.push({
      type: "listItem",
      label: packs[i].description,
      title: packs[i].title,
      choices: choices,
      onChange: async (id: string) => {
        if (id == "select") {
          api.saveFile.set("pack", packs[i].id);
          api.pack = packs[i].id;
          await api.ui.reloadSelf();
        } else if (id == "upload") {
          api.ui.loading(async (ui: ElementalLoadingUi) => {
            ui.status("Converting Data", 0);
            let output = JSON.stringify(await api.cache.getAll(packs[i].id));
            ui.status("Converting Data", 0.5);
            let packdat: PackData = {
              id: packs[i].id,
              title: packs[i].title,
              description: packs[i].description,
              data: output,
              uid: api.uid,
            }
            let dat = JSON.stringify(packdat);

            ui.status("Initializing Request", 0);
            let xhr = new XMLHttpRequest();
            xhr.open("POST", api.prefix + "single_upload", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            ui.status("Uploading", 0);
            await new Promise<void>(async (res, rej) => {
              xhr.onreadystatechange = async () => { 
                if (xhr.readyState === 4) {
                  if (xhr.status == 500) {
                    ui.status("Showing Error", 0)
                    await api.ui.alert({
                      title: "Error",
                      text: xhr.responseText,
                    })
                  }
                  res();
                }
              };
              xhr.send(dat);
            })
            await api.ui.reloadSelf();
          });
        } else if (id == "export") {
          api.ui.loading(async (ui: ElementalLoadingUi) => {
            ui.status("Converting Data", 0);
            let output = JSON.stringify(await api.cache.getAll(packs[i].id));
            ui.status("Converting Data", 0.5);
            let packdat: PackData = {
              id: packs[i].id,
              title: packs[i].title,
              description: packs[i].description,
              data: output,
              uid: api.uid,
            }
            let dat = JSON.stringify(packdat);
            
            ui.status("Downloading Pack", 0);
            var element = document.createElement('a'); 
            ui.status("Downloading Pack", 0.2);
            element.setAttribute('href',  
            'data:text/plain;charset=utf-8, ' 
            + encodeURIComponent(dat));
            ui.status("Downloading Pack", 0.4);
            element.setAttribute('download', packdat.id + ".pack"); 
            ui.status("Downloading Pack", 0.6);
            document.body.appendChild(element); 
            ui.status("Downloading Pack", 0.8);
            element.click();
            ui.status("Downloading Pack", 1);
            document.body.removeChild(element); 
          });
        } else if (id == "edit") {
          let title = await api.ui.prompt({
            title: "Pack Name",
            text: "Enter the name of the pack below!"
          });
          let desc = await api.ui.prompt({
            title: "Pack Description",
            text: "Enter the description of the pack below!"
          });
          if (title == "" || desc == "") {
            return;
          }
          let info: PackInfo = {
            title: title,
            description: desc,
            id: encodeURIComponent(title.toLowerCase()),
          }
          if (packs.includes(info)) {
            await api.ui.alert({
              title: "Pack Already Exists",
              text: "That pack already exists!",
            })
            return;
          }
          packs[i].title = info.title;
          packs[i].description = info.description;
          api.saveFile.set("packs", packs);
          await api.ui.reloadSelf();
        }
      }
    })
  }
  return items;
}
