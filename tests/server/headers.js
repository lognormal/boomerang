var fs = require("fs");
var path = require("path");

// Backward compatibillity for node: https://nodejs.org/api/fs.html#fs_fs_existssync_path
// Stability: 0 - Deprecated: Use fs.statSync() or fs.accessSync() instead.
function exists(filePath) {
	return (fs.existsSync && fs.existsSync(filePath)) || (fs.statsSync && fs.statSync(filePath));
}

/**
 * Add custom headers to a file downloaded from `support/` directory for your test subset
 * This allows you to define custom headers for your support files.
 *
 * Suppose you have a file `test.jpg` under `support/` and want to add a specific header to it.
 * Set this in your `support/headers.json`
 * @example
 * {
 *	 "test.jpg": {
 *	   "headers": {
 *		 "Access-Control-Allow-Origin": "*"
 *	   }
 *	 }
 * }
 */
module.exports = function(req, res, next) {
	var q = require("url").parse(req.url, true);
	var pathSplits = q.path.split("/");
	var filePath = path.resolve(path.join("tests", "page-templates", pathSplits[2], "support", "headers.json"));

	// If headers file exists and has a key matching the file requested add the headers defined to the response
	if (exists(filePath)) {
		var headersConfig = require(filePath);
		var fileKeys = Object.keys(headersConfig);

		for (var fileIndex = 0; fileIndex < fileKeys.length; fileIndex++) {

			if (pathSplits[pathSplits.length - 1] === fileKeys[fileIndex]) {
				var headers = headersConfig[fileKeys[fileIndex]].headers;
				var headerKeys = Object.keys(headers);

				for (var headerIndex = 0; headerIndex < headerKeys.length; headerIndex++) {
					res.header(headerKeys[headerIndex], headers[headerKeys[headerIndex]]);
				}
			}
		}
	}

	next();
};
