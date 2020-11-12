// Shared library functions
/** Returns a random element in the array. */
export function arrayGetRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
/** Returns three random values from an array, unique */
export function arrayGet3Random<T>(arr: T[]): T[] {
    if(arr.length < 4) return arr;

    const a = Math.floor(Math.random() * arr.length);
    let b = a;
    while(b === a) {
        b = Math.floor(Math.random() * arr.length);
    }
    let c = a;
    while(c === b || c === a) {
        c = Math.floor(Math.random() * arr.length);
    }

    return [
        arr[a],
        arr[b],
        arr[c]
    ]
}
/** Converts element name to an ID */
export function elementNameToStorageID(elemName: string): string {
    return elemName.trim().replace(/\n/g, ' ').replace(/ +/g, " ").trim().toLowerCase();
}
/** Returns a promise that resolves after a timeout */
export function delay(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}
export function delayFrame() {
    return new Promise(r => requestAnimationFrame(r));
}
export function formatDate(date: Date) {
    const month = date.getUTCMonth().toString().padStart(2, '0');
    const day = date.getUTCDate();
    const daysuffix = day === 1 ? "st" : (day === 2 ? "nd" : "th");
    let year = date.getUTCFullYear();
    let hour = date.getUTCHours();
    let ampm = "AM";
    if(hour > 12) {
        hour -= 12;
        ampm = "PM";
    }
    let minute:string|number = date.getUTCMinutes();
    if (minute < 10) {
        minute = "0" + minute;
    }

    return `${year}-${month}-${day} ${hour}:${minute}${ampm} UTC`;
}
export function escapeHTML(html: string): string {
    return html.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
export function sortCombo(...x: string[]) {
    return x.map((y) => parseInt(y) || y).sort().map(x => x.toString());
}
export function randomString(length: number, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
