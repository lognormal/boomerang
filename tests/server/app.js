//
// Imports
//
var path = require('path');
var fs = require('fs');
var express = require("express");
var http = require("http");

//
// Load env.json
//
var envFile = path.resolve(path.join(__dirname, "env.json"));

if (!fs.existsSync(envFile)) {
    console.error("Please create " + envFile);
    process.exit(1);
}

// load JSON
var env = require(envFile);

//
// Start HTTP server / Express
//
app = express();
server = http.createServer(app);
app.use(express.static(env.www));

// listen
console.log("Server starting on port " + env.port + " for " + env.www);
server.listen(env.port);
