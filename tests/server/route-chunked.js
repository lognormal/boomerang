//
// Constants
//
var CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

//
// Functions
//
function rnd(length) {
	var str = "", i;

	for (i = 0; i < length; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

//
// Exports
//
module.exports = function(req, res) {
	var q = require("url").parse(req.url, true).query;
	var chunkSize = q.chunkSize;
	var chunkCount = q.chunkCount;
	var chunkDelay = q.chunkDelay;
	var contentLength = chunkSize * chunkCount;

	// set a few headers
	res.setHeader("Last-Modified", (new Date()).toUTCString());
	res.setHeader("Transfer-Encoding", "chunked");

	var cur = 0;

	function sendData() {
		res.write(rnd(chunkSize));

		cur++;

		// if we still have chunks to send, set another timeout
		if (cur < chunkCount) {
			setTimeout(sendData, chunkDelay);
		}
		else {
			res.end();
		}
	}

	setTimeout(sendData, chunkDelay);
};
