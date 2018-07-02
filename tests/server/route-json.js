//
// Constants
//
var RESPONSE = { a: 1, b: 2 };
var RESPONSE_STR = JSON.stringify(RESPONSE);

//
// Exports
//
module.exports = function(req, res) {
	// set a few headers
	res.setHeader("Last-Modified", (new Date()).toUTCString());
	res.setHeader("Content-Length", RESPONSE_STR.length);
	res.setHeader("Content-Type", "application/json");

	res.send(RESPONSE_STR);
};
