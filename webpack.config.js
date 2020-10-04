const path = require('path');
const webpack = require('webpack');
const gamedir = path.resolve(__dirname, 'game');
// const Fiber = require('fibers');
const dotenv = require('dotenv');
const env = dotenv.parse(require('fs').readFileSync('./.env'));
const {execSync} = require('child_process');

module.exports = (prod = false) => ({
    entry: [
        path.resolve(gamedir, 'ts/index.ts'),
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            $production: JSON.stringify(prod),
            $build_date: JSON.stringify(execSync('date +"%F %H:%M:%S"').toString()),
            $password: JSON.stringify(false)
            // $password: JSON.stringify('username')
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    output: {
        filename: 'elemental.js',
        path: path.resolve(__dirname, 'dist_client')
    },
    devtool: prod ? "none" : "source-map",
    mode: prod ? "production" : "development"
});
