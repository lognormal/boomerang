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
	"css": "text/css",
	"xml": "text/xml"
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
	var responseHeaders = q.headers;
	var redir = q.redir;

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
		var headers = {};

		if (redir) {
			res.header("Cache-Control", "no-cache, no-store, must-revalidate");
			res.header("Pragma", "no-cache");
			res.header("Expires", 0);

			return res.redirect(302, file);
		}

		if (sendACAO) {
			headers["Access-Control-Allow-Origin"] = "*";
		}

		if (sendTAO) {
			headers["Timing-Allow-Origin"] = "*";
		}

		if (responseHeaders) {
			var responseHeadersObj = null;
			try {
				responseHeadersObj = JSON.parse(responseHeaders);
			}
			catch (e) {
				// nop
			}

			for (var headerName in responseHeadersObj) {
				if (responseHeadersObj.hasOwnProperty(headerName) && responseHeadersObj[headerName]) {
					headers[headerName] = responseHeadersObj[headerName];
				}
			}
		}

		if (response) {
			res.writeHead(200, headers);
			return res.end(response);
		}

		var filePath = path.join(wwwRoot, file);

		fs.exists(filePath, function(exists) {
			if (!exists) {
				return res.sendStatus(404);
			}

			// determine MIME type
			if (!headers["Content-Type"]) {
				var mimeType = mimeTypes[path.extname(filePath).split(".")[1]];

				if (mimeType) {
					headers["Content-Type"] = mimeType;
				}
			}

			res.writeHead(200, headers);

			var fileStream = fs.createReadStream(filePath);
			fileStream.pipe(res);
		});
	}, delay);
};
