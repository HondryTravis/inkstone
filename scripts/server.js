// refer to: https://www.npmjs.com/package/live-server

const liveServer = require("live-server");

const params = {
    port: 8181, // Set the server port. Defaults to 8080.
    host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    root: "./packages", // Set root directory that's being served. Defaults to cwd.
    open: true, // When false, it won't load your browser by default.
    wait: 500, // Waits for all changes, before reloading. Defaults to 0 sec.
    logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
    middleware: [function (req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
};

liveServer.start(params);
