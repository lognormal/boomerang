/* eslint-env node */

//
// Imports
//
var path = require("path");
var fs = require("fs");
var express = require("express");
var http = require("http");
var compress = require("compression");

//
// Load env.json
//
var envFile = path.resolve(path.join(__dirname, "env.json"));

if (!fs.existsSync(envFile)) {
	throw new Error("Please create " + envFile + ". There's a env.json.sample in the same dir.");
}

// load JSON
var env = require(envFile);

//
// Start HTTP server / Express
//
var wwwRoot = env.www;
if (wwwRoot.indexOf("/") !== 0) {
	wwwRoot = path.join(__dirname, "..", "..", wwwRoot);
}

if (!fs.existsSync(wwwRoot)) {
	wwwRoot = path.join(__dirname, "..");
}

var app = express();
var server = http.createServer(app);

// listen
var port = process.env.PORT || env.port;
server.listen(port, function() {
	console.log("Server starting on port " + port + " for " + wwwRoot);
});

// ensure content is compressed
app.use(compress());

//
// Routes
//

// /blackhole - returns a 204
app.get("/blackhole", function(req, res) {
	res.status(204).send();
});
app.post("/blackhole", function(req, res) {
	res.status(204).send();
});

// /delay - delays a response
app.get("/delay", require("./route-delay"));

// all static content follows afterwards
/*eslint dot-notation:0*/
app.use(express.static(wwwRoot));
