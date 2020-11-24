// Constants for the server to use.
import { join } from "path";
import * as dotenv from "dotenv";
import { readFileSync, existsSync, readJSONSync } from "fs-extra";
import { info } from "./logger";

if(!existsSync("./.env")) {
    info("Creating a default .env file, please edit this to configure HTTPS and the Database.");
    require("../../gen-env.js");
}

const env = dotenv.parse(readFileSync("./.env"));

/** Points to the res folder */
export const GAME_DATA_FOLDER = join(process.cwd(), "./data");

/** How many votes until an elements get added. */
export const VOTE_THRESHOLD_EQUATION = env.VOTE_THRESHOLD_EQUATION;
/** How much is a new vote worth. */
export const VOTE_SCORES_EQUATION = env.VOTE_SCORES_EQUATION;

/** HTTP port to run on, default 80 */
export const HTTP_PORT = parseInt(env.HTTP_PORT) || 80;
/** HTTPS port to run on, default 443 */
export const HTTPS_PORT = parseInt(env.HTTPS_PORT) || 443;

/** Location of the .pem file for HTTPS certification */
export const HTTPS_KEY = env.HTTPS_KEY;
/** Location of the .cert file for HTTPS certification */
export const HTTPS_CERT = env.HTTPS_CERT;

export const ENABLE_HTTP = env.ENABLE_HTTP === "true";
export const ENABLE_HTTPS = env.ENABLE_HTTPS === "true";
export const DEV_VOTE_NO_CHECK = env.DEV_VOTE_NO_CHECK === "true";

export const SERVER_NAME = env.SERVER_NAME;
export const SERVER_DESCRIPTION = env.SERVER_DESCRIPTION;
export const SERVER_ICON = env.SERVER_ICON;

export const IP_FORWARDING = env.IP_FORWARDING === "true";
/** API Key */
export const IP_DUPLICATION_KEY = env.IP_DUPLICATION_KEY;

export const DATALOG_SHEET_ID = env.DATALOG_SHEET_ID;
export const DAILY_RESET = env.DAILY_RESET;

function getgcloud() {
    try {
        return readJSONSync('.gcloud.json');
    } catch (error) {
        return {};
    }
}

export const GCLOUD_AUTH = getgcloud()
