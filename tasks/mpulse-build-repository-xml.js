/*eslint-env node*/

//
// Imports
//
var path = require("path");

/**
 * Grunt Tasks - mpulse-build-repository-xml
 *
 * Builds a mPulse Repository XML for boomerang.js
 */
module.exports = function(grunt) {
	var description = "Builds a mPulse Repository XML for boomerang.js";

	grunt.registerTask("mpulse-build-repository-xml", description, function() {
		var options = this.options({
			filePrefix: "",
			template: path.join(__dirname, "mpulse-build-repository-xml.tmpl"),
			version: "0.9"
		});

		var template = grunt.file.read(options.template);

		var minFile = grunt.file.read(options.filePrefix + ".min.js");
		var debugFile = grunt.file.read(options.filePrefix + "-debug.js");

		var minFileBase64 = new Buffer(minFile).toString("base64");
		var debugFileBase64 = new Buffer(debugFile).toString("base64");

		// replace parts of the template
		var xml = grunt.template.process(template, {
			data: {
				minified: minFileBase64,
				debug: debugFileBase64,
				version: options.version
			}});

		var xmlFileName = options.filePrefix + ".xml";

		grunt.log.ok("Writing " + xmlFileName);
		grunt.file.write(xmlFileName, xml);
	});
};
