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

// save previous 'delay' query param value
var previousDelay = 0;

module.exports = function(req, res) {
	// keep query strings on files if requested that way
	var url = req.url;
	var querySplit = req.url.split(/\?/);
	if (querySplit.length === 3) {
		querySplit.pop();
		url = querySplit.join("?");
	}

	var q = require("url").parse(url, true).query;
	var delay = q.delay || 0;
	var file = q.file;
	var response = q.response;
	var sendACAO = !(q.noACAO === "1"); // send by default
	var sendTAO = (q.TAO === "1"); // don't send by default

	// if we get a '+' or '-' delay prefix, add/sub its value with the delay used on the
	// previous request. This is usefull in cases where we need to hit the
	// same url and query params for multiple requests with differing delay times.
	if (typeof delay === "string" && delay) {
		if (delay[0] === "+") {
			delay = previousDelay + parseInt(delay.slice(1), 10);
		}
		else if (delay[0] === "-") {
			delay = previousDelay - parseInt(delay.slice(1), 10);
		}
		else {
			delay = parseInt(delay, 10);
		}
	}
	delay = delay >= 0 ? delay : 0;

	previousDelay = delay;

	setTimeout(function() {
		if (sendACAO) {
			res.set("Access-Control-Allow-Origin", "*");
		}

		if (sendTAO) {
			res.set("Timing-Allow-Origin", "*");
		}

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
