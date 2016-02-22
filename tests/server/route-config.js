/* SOASTA PRIVATE START */
//
// Imports
//
var crypto = require("crypto");
var util = require("util");

module.exports = function(req, res) {
	var q = require("url").parse(req.url, true).query;
	var r = typeof q.r !== "undefined";

	var hash = crypto.createHash("sha1");

	var ht = Date.now();
	hash.update(ht.toString());

	var hcr = hash.digest("hex");

	res.header("Access-Control-Allow-Origin", "*");

	if (r) {
		res.send(util.format('BOOMR_configt=new Date().getTime();BOOMR.addVar({"h.t":%d,"h.cr":"%s"});', ht, hcr));
	}
	else {
		res.send(util.format('BOOMR_configt=new Date().getTime();BOOMR.init({"h.t":%d,"h.cr":"%s"});', ht, hcr));
	}
};
/* SOASTA PRIVATE END */
