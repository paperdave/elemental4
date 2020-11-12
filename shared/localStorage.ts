declare global {
  interface Window {
    localStorage_: Storage;
  }
}

let v = window.localStorage_ || window.localStorage;

delete (window as any).localStorage;
delete window.localStorage_;

export default v;