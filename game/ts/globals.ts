/** Sets a global variable to stuff. */
export function exposeGlobals() {
    window["$ts"] = {
        'api': require('./api'),
        'savefile': require('./savefile'),
        'settings': require('./settings/settings'),
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
        'ssg': require('./settings-server-config'),
        'tree': require('./tree'),
        'shared': {
            util: require('../../shared/shared'),
            cache: require('../../shared/cache'),
            queue: require('../../shared/async-queue-exec'),
            fetch: require('../../shared/fetch-progress'),
            elem: require('../../shared/elem'),
            pack: require('../../shared/elem-pack'),
            store: require('../../shared/store'),
            chunked: require('../../shared/store-chunk'),
        },
        deps: {
            color: require('color'),
            localforage: require('../../shared/localForage'),
        }
    };
}
