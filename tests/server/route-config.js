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
	var json = q.json || require("url").parse(req.url).pathname === "/config.json";
	var delay = q.delay || 0;

	setTimeout(function() {
		var hash = crypto.createHash("sha1");

		var ht = Date.now();
		hash.update(ht.toString());

		var hcr = hash.digest("hex");

		res.header("Access-Control-Allow-Origin", "*");

		if (q.key && q.key !== "API_KEY") {
			var ending = typeof q.acao !== "undefined" ? ".json" : ".js";
			var file = path.join(__dirname, "config", q.key + ending);

			if (!fs.existsSync(file)) {
				return res.status(404).send("Not found");
			}

			// if they've requested a specific config, send that file
			var contents = fs.readFileSync(file, "utf-8");

			// replace h.t and h.cr
			contents = contents.replace("{{H_T}}", ht);
			contents = contents.replace("{{H_CR}}", hcr);

			res.send(contents);
		}
		else if (r) {
			var content = util.format('{"h.t":%d,"h.cr":"%s"}', ht, hcr);
			var wrap = util.format("BOOMR_configt=new Date().getTime();BOOMR.addVar(%s);", content);
			if (json) {
				res.send(content);
			}
			else {
				res.send(wrap);
			}
		}
		else {
			var content = util.format('{"h.t":%d,"h.cr":"%s"}', ht, hcr);
			var wrap = util.format("BOOMR_configt=new Date().getTime();BOOMR.init(%s);", content);
			if (json) {
				res.send(content);
			}
			else {
				res.send(wrap);
			}
		}
	}, delay);
};
/* SOASTA PRIVATE END */
