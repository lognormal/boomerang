//
// Imports
//
var path = require("path");
var fs = require("fs");

//
// Mime types
//
var mimeTypes = {
	"html": "text/html",
	"json": "application/json",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"js": "text/javascript",
	"css": "text/css"
};

//
// Load env.json
//
var envFile = path.resolve(path.join(__dirname, "env.json"));

if (!fs.existsSync(envFile)) {
	throw new Error("Please create " + envFile + ". There's a env.json.sample in the same dir.");
}

// load JSON
var env = require(envFile);

var wwwRoot = env.www;
if (wwwRoot.indexOf("/") !== 0) {
	wwwRoot = path.join(__dirname, "..", "..", wwwRoot);
}

if (!fs.existsSync(wwwRoot)) {
	wwwRoot = path.join(__dirname, "..");
}

module.exports = function(req, res) {
	var q = require("url").parse(req.url, true).query;
	var delay = q.delay || 0;
	var file = q.file;
	var response = q.response;

	setTimeout(function() {
		res.set("Access-Control-Allow-Origin", "*");

		if (response) {
			return res.send(response);
		}

		var filePath = path.join(wwwRoot, file);

		fs.exists(filePath, function(exists) {
			if (!exists) {
				return res.send(404);
			}

			var mimeType = mimeTypes[path.extname(filePath).split(".")[1]];
			res.writeHead(200, {
				"Content-Type": mimeType
			});

			var fileStream = fs.createReadStream(filePath);
			fileStream.pipe(res);
		});
	}, delay);
};
