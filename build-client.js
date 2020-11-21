// builds the elemental client
const config = require("./webpack.config")(true);
const fs = require("fs-extra");
const webpack = require("webpack");
const path = require("path");
const minifier = require("html-minifier");
const terser = require("uglify-es");
const chalk = require("chalk");
const url = require("url");

let version = require('./package.json').version;
if (process.env.CONTEXT === 'deploy-preview') version += '-' + (process.env.COMMIT_REF || 'unknown').slice(0, 4);
if (process.env.CONTEXT === 'branch-deploy') version += '-dev-' + (process.env.COMMIT_REF || 'unknown').slice(0, 4);

process.chdir(__dirname);

(async() => {
    fs.pathExistsSync('./dist_client') && fs.removeSync("./dist_client");

    if(!process.argv.includes('-s')) {
        // Webpack build
        await new Promise((next) => {
            webpack(config, (err, stats) => {
                // errors
                if (err) {
                    console.error(err.stack || err);
                    if (err.details) {
                        console.error(err.details);
                    }
                    process.exit(1);
                }
    
                const info = stats.toJson();
    
                // errors
                if (stats.hasErrors()) {
                    console.error(info.errors.join("\n\n"));
                }
    
                // warnings
                if (stats.hasWarnings()) {
                    console.warn(info.warnings.join("\n"));
                }
    
                next();
            });
        });
    }

    const workshopManifest = {
        themes: [],
        packs: [],
    };
    fs.copySync('workshop', 'dist_client/');

    fs.readdirSync('workshop/themes').forEach((id) => {
        const json = (fs.readJSONSync('workshop/themes/' + id + '/elemental.json'));

        workshopManifest.themes.push({
            url: '/themes/' + id,
            id: json.id,
            name: json.name,
            author: json.author,
            description: json.description,
            icon: json.icon ? url.resolve('/themes/' + id + '/', json.icon) : undefined,
            contains: ['styles', 'colors', 'sounds', 'music', 'sketch'].filter(y => y in json),
        });
        delete json['$schema'];
        fs.writeFileSync('dist_client/themes/' + id + '/elemental.json', JSON.stringify(json))
    });
    fs.readdirSync('workshop/packs').forEach((id) => {
        const json = (fs.readJSONSync('workshop/packs/' + id + '/elemental.json'));

        workshopManifest.packs.push({
            url: '/packs/' + id,
            id: json.id,
            name: json.name,
            author: json.author,
            description: json.description,
            icon: json.icon ? url.resolve('/packs/' + id + '/', json.icon) : undefined
        });

        delete json['$schema'];

        fs.writeFileSync('dist_client/packs/' + id + '/elemental.json', JSON.stringify(json))
    });
    fs.ensureDirSync("./dist_client");

    fs.writeJSONSync('dist_client/workshop.json', workshopManifest)

    // Minify HTML Files
    fs.readdirSync("./game/views").forEach(file => {
        let input_html = fs.readFileSync(path.join(__dirname, "game/views/", file)).toString();
        input_html = input_html
            .replace('{CURRENT_VERSION}', version)
            .replace('{TARGET_CURRENT_VERSION}', require('./package.json').version)
            .replace(/\<script\>((.|\n|\r)*?)\<\/script\>/g, (src) => {
            let js = src.substring(8, src.length - 9);
            
            let result = terser.minify(js, {
                warnings: true,
                mangle: {
                    toplevel: true
                }
            });

            if (result.error) {
                console.log(chalk.red("Minification Error!"))
                console.log(chalk.red(result.error.message));
                console.log("At " + result.error.filename + result.error.line + "," + result.error.col);
                return;
            } else {
                if (result.warnings) {
                    result.warnings.forEach(warning => {
                        console.warn(chalk.yellow("[WARN] " + warning));
                    });
                }
            }

            return "<script>" + result.code + "</script>";
        });
        const output_html = minifier.minify(input_html, {
            caseSensitive: true,
            collapseWhitespace: true,
            minifyURLs: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
            removeAttributeQuotes: true,
            removeOptionalTags: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
        });
        fs.writeFileSync(path.join("./dist_client/", file), output_html);
    });
    fs.copySync('res', 'dist_client/');
    fs.copySync('game/pwa', 'dist_client/');
    fs.copySync('node_modules/p5/lib/p5.min.js', 'dist_client/p5.min.js');
    const monacoEditor = require('./monaco-editor-files.json')
    monacoEditor.files.forEach((f) => {
        fs.copySync(path.join(__dirname, monacoEditor.base, f), path.join('dist_client/vs/', f));
    })
    fs.writeFileSync('dist_client/version', version);
    fs.appendFileSync('dist_client/_redirects',
        '\n' +
        workshopManifest.packs
            .concat(...workshopManifest.themes)
            .map(x => `${x.url} https://github.com/davecaruso/elemental4/tree/master/workshop${x.url}`)
            .join('\n')
    );
})();
