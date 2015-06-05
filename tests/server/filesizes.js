/* eslint-env node */

var fs = require("fs"),
    path = require("path"),
    parse = require("csv-parse");

var filesizesFile = path.join(__dirname, "..", "results", "filesizes.csv");

var parserConfig = {
	delimiter: ",",
	quote: "\"",
	rowDelimiter: ";\n",
	skip_empty_lines: true,
	auto_parse: true
};

module.exports = function(req, res) {
	var parser = parse(parserConfig, function(err, data) {
		if (err) {
			console.error(err);
			return;
		}
		res.send(data);
	});

	fs.createReadStream(filesizesFile).pipe(parser);
};
