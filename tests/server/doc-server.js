/* eslint-env node */

//
// Imports
//
var path = require("path");
var fs = require("fs");
var express = require("express");
var http = require("http");

var docPath = path.resolve(path.join(__dirname, "..", "..", "build", "doc"));
var packageJsonPath = path.resolve(path.join(__dirname, "..", "..", "package.json"));

if (!fs.existsSync(docPath)) {
	throw new Error("Documentation not available" + docPath);
}

if (!fs.existsSync(packageJsonPath)) {
	throw new Error("package.json not found: " + packageJsonPath);
}

var pkg = require(packageJsonPath);

var docResultPath = path.resolve(path.join(docPath, pkg.name, pkg.version));

if (!fs.existsSync(docResultPath)) {
	throw new Error("Build path not found: " + packageJsonPath);
}

var app = express();
app.use(express["static"](docResultPath));

var server = http.createServer(app);

// listen
var port = process.env.PORT || 3000;
server.listen(port, function() {
	console.log("Server starting on port " + port + " for " + docResultPath);
});
