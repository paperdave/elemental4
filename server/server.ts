// Handles serving front end static pages
// and routing api calls.
import { HTTP_PORT, HTTPS_KEY, HTTPS_CERT, HTTPS_PORT, ENABLE_HTTP, ENABLE_HTTPS, SERVER_NAME, SERVER_DESCRIPTION, SERVER_ICON } from "./constants";
import express from 'express';
import * as log from './logger';
import { createServer as createHTTPServer } from 'http';
import { createServer as createHTTPSServer, ServerOptions } from 'https';
import { readFileSync } from "fs-extra";
import SocketIO from 'socket.io';
import pkg from '../package.json';
import { getDbId, newEntryEmitter } from "./storage";

export let app: express.Express;
export let io: SocketIO.Server;
export function serverCreate() {
    app = express();
    io = SocketIO();
    io.origins('*:*');

    newEntryEmitter.on((entry) => {
        io.sockets.emit('new-entry', entry)
    })
        
    // Remove Express Header
    app.use((req,res,next) => {
        res.removeHeader("X-Powered-By");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length,Elem4-Entry-Length");

        next();
    });

    app.get('/', (r,res) => res.send("Elemental 4 " + pkg.version));
    app.get('/ping', (r,res) => res.send("pong"));
    app.get('/elemental.json', (r,res) => {
        res.send({
            type: 'elemental4',
            name: SERVER_NAME,
            description: SERVER_DESCRIPTION,
            serverVersion: pkg.version,
            icon: SERVER_ICON,
            dbId: getDbId()
        })
    });
    
    // Add api calls
    app.use(require("./api/api-v1").default());

    // Create an HTTP service.
    if (ENABLE_HTTP) {
        if(ENABLE_HTTPS) {
            // redirectify
            createHTTPServer((req, res) => {
                const host = req.headers["host"];
                const url = "https://" + host + req.url;
                res.statusCode = 302;
                res.setHeader("Location", url);
                res.end("Moved to <a href='" + url + "'>" + url + "</a>");
            }).listen(HTTP_PORT, () => {
                log.info("HTTP server started (Redirecting to HTTPS). http://localhost:" + HTTP_PORT);
            });
        } else {
            // make the server on http
            const s = createHTTPServer(app).listen(HTTP_PORT, () => {
                log.info("HTTP server started. http://localhost:" + HTTP_PORT);
            });
            io.listen(s);
        }
    }
    
    // Create an HTTPS service identical to the HTTP service.
    if (ENABLE_HTTPS) {
        const httpsOptions: ServerOptions = {
            key: readFileSync(HTTPS_KEY),
            cert: readFileSync(HTTPS_CERT),
        }
        const s = createHTTPSServer(httpsOptions, app).listen(HTTPS_PORT, () => {
            log.info("HTTPS server started. https://localhost:" + HTTPS_PORT);
        });
        io.listen(s);
    }
}
