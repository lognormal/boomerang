/* SOASTA PRIVATE START */
//
// Imports
//
var crypto = require("crypto");
var util = require("util");
var fs = require("fs");
var path = require("path");

module.exports = function(req, res) {
	var q = require("url").parse(req.url, true).query;
	var r = typeof q.r !== "undefined";

	var hash = crypto.createHash("sha1");

	var ht = Date.now();
	hash.update(ht.toString());

	var hcr = hash.digest("hex");

	res.header("Access-Control-Allow-Origin", "*");

	if (q.key !== "API_KEY") {
		// if they've requested a specific config, send that file
		var contents = fs.readFileSync(path.join(__dirname, "config", q.key + ".js"), "utf-8");

		// replace h.t and h.cr
		contents = contents.replace("{{H_T}}", ht);
		contents = contents.replace("{{H_CR}}", hcr);

		res.send(contents);
	}
	else if (r) {
		res.send(util.format('BOOMR_configt=new Date().getTime();BOOMR.addVar({"h.t":%d,"h.cr":"%s"});', ht, hcr));
	}
	else {
		res.send(util.format('BOOMR_configt=new Date().getTime();BOOMR.init({"h.t":%d,"h.cr":"%s"});', ht, hcr));
	}
};
/* SOASTA PRIVATE END */
