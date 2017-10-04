/* eslint-env node */

//
// Imports
//
var path = require("path");
var fs = require("fs");
var readline = require("readline");
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
// Quick Handlers
//
function respond204(req, res) {
	res.status(204).send();
}

function respond301(req, res) {
	var q = require("url").parse(req.url, true).query;
	var file = q.file;

	res.set("Access-Control-Allow-Origin", "*");
	res.redirect(301, file);
}

//
// Routes
//

// /blackhole and /204: returns a 204
app.get("/blackhole", respond204);
app.post("/blackhole", respond204);

// /delay - delays a response
app.get("/delay", require("./route-delay"));
app.post("/delay", require("./route-delay"));

// /301 - 301 redirects
app.get("/redirect", respond301);
app.post("/redirect", respond301);

// /chunked
app.get("/chunked", require("./route-chunked"));
app.post("/chunked", require("./route-chunked"));

app.get("/blackhole/no-op", respond204);
app.post("/blackhole/no-op", respond204);

// for every GET, look for a file with the same name appended with ".headers"
// if found, parse the headers and write them on the response
// whether found or not, let the req/res pass through with next()
app.get("/*", function(req, res, next) {
	var fullPath = path.resolve(path.join(wwwRoot, req.url));
	var qIndex = fullPath.indexOf("?");
	if (qIndex > -1) {
		fullPath = fullPath.substring(0, qIndex);
	}

	var headersFilePath = fullPath + ".headers";
	var input = fs.createReadStream(headersFilePath);
	input.on("error", function() {
		next();
	});
	input.on("open", function() {
		var headers = {};
		var lineReader = readline.createInterface({input: input});
		lineReader.on("line", function(line) {
			var colon = ":";
			var colonIndex = line.indexOf(colon);
			var name = line.substring(0, colonIndex).trim();
			headers[name] = headers[name] || [];
			headers[name].push(line.substring(colonIndex + colon.length).trim());
		});
		lineReader.on("close", function(line) {
			Object.keys(headers).forEach(function(name) {
				res.setHeader(name, headers[name]);
			});
			next();
		});
	});
});

// all static content follows afterwards
/*eslint dot-notation:0*/
app.use(express.static(wwwRoot));
