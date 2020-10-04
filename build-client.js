// builds the elemental client
const config = require("./webpack.config")(true);
const fs = require("fs-extra");
const webpack = require("webpack");
const path = require("path");
const minifier = require("html-minifier");
const terser = require("uglify-es");
const chalk = require("chalk");

process.chdir(__dirname);

(async() => {
    fs.pathExistsSync('./dist_client') && fs.removeSync("./dist_client");

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

    // Minify HTML Files
    fs.ensureDirSync("./dist_client");
    fs.readdirSync("./game/views").forEach(file => {
        let input_html = fs.readFileSync(path.join(__dirname, "game/views/", file)).toString();
        input_html = input_html.replace(/\<script\>((.|\n|\r)*?)\<\/script\>/g, (src) => {
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
    fs.copySync('workshop', 'dist_client/');
    fs.copySync('res', 'dist_client/');
    fs.copySync('game/pwa', 'dist_client/');
    fs.copySync('node_modules/p5/lib/p5.min.js', 'dist_client/p5.min.js');
    fs.writeFileSync('dist_client/version', require('./package.json').version);
})();
