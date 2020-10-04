// Handles outputting the log,
// and maybe in the future storing to file
import {default as chalk} from 'chalk';

function genericlog(pref: string, text: any, optionalParams: any[]) {
    optionalParams.unshift(pref + text);
    console.log.apply(this, optionalParams);
}
export function debug(data: any, ...optionalParams: any[]) {
    const pref = chalk.greenBright("Debug") + ": ";
    genericlog(pref, data, optionalParams);
}
export function info(data: any, ...optionalParams: any[]) {
    const pref = chalk.blueBright("Info") + ": ";
    genericlog(pref, data, optionalParams);
}
export function db(data: any, ...optionalParams: any[]) {
    const pref = chalk.magentaBright("Database") + ": ";
    genericlog(pref, data, optionalParams);
}
export function warn(data: any, ...optionalParams: any[]) {
    const pref = chalk.yellowBright("Warn") + ": ";
    genericlog(pref, data, optionalParams);
}
export function error(data: any, ...optionalParams: any[]) {
    const pref = chalk.redBright("Error") + ": ";
    genericlog(pref, data, optionalParams);
}
export function fatal(data: any, ...optionalParams: any[]) {
    const pref = chalk.redBright("Fatal Error") + ": ";
    genericlog(pref, data, optionalParams);
    process.exit(1);
}
