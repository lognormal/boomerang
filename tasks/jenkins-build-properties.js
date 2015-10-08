/*eslint-env node*/

var path = require("path");
var fs = require("fs");

module.exports = function(grunt) {
	var description = "Create Properties file for Jenkins to ingest";

	grunt.registerMultiTask("jenkins-build-properties", description, function() {
		var options = this.options({
			version: ""
		});

		var propertiesFile = path.resolve(__dirname, "..", "build", "boomerang.properties");
		var propertyString = "BuildVersion=" + options.version;
		fs.writeFileSync(propertiesFile, propertyString, "utf8");
	});
};
