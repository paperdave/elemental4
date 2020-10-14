/** Sets a global variable to stuff. */
export function exposeGlobals() {
    window["$ts"] = {
        'api': require('./api'),
        'savefile': require('./savefile'),
        'settings': require('./settings'),
        'theme': require('./theme'),
        'server': require('./server-manager'),
        'game': require('./element-game'),
        'color': require('./element-color'),
        'loading': require('./loading'),
        'iframe': require('./iframe'),
        'stats': require('./statistics'),
        'dialog': require('./dialog'),
        'audio': require('./audio'),
        'devTheme': require('./theme-editor'),
        deps: {
            color: require('color'),
            localforage: require('localforage'),
        }
    };
}
