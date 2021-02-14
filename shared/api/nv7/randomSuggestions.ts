import { NV7ElementalAPI } from "./nv7";

export async function randomLonelySugg(api: NV7ElementalAPI): Promise<string[]> {
  let res = await fetch(api.prefix + "random_lonely");
  let resp = await res.json();
  if (resp.length == 0) {
    api.ui.alert({
      title: "Error!",
      text: "No random lonely suggestions!",
    });
  }
  return resp;
}

export async function upAndComingSugg(api: NV7ElementalAPI): Promise<string[]> {
  let res = await fetch(api.prefix + "up_and_coming");
  let resp = await res.json();
  if (resp.length == 0) {
    api.ui.alert({
      title: "Error!",
      text: "No up and coming suggestions!",
    });
  }
  return resp;
}