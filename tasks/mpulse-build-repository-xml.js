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
			version: "0.9",
			schema_version: grunt.option("schema-version") || 1
		});

		// read in the XML .tmpl file
		var template = grunt.file.read(options.template);

		// read in both the minified and debug builds
		var minFile = grunt.file.read(options.filePrefix + ".min.js");
		var debugFile = grunt.file.read(options.filePrefix + "-debug.js");

		// convert both to base64
		var minFileBase64 = new Buffer(minFile).toString("base64").match(/.{1,80}/g).join("\n");
		var debugFileBase64 = new Buffer(debugFile).toString("base64").match(/.{1,80}/g).join("\n");

		var xml = "";
		try {
			// run the template
			xml = grunt.template.process(template, {
				data: {
					minified: minFileBase64,
					debug: debugFileBase64,
					version: options.version,
					name: "boomerang-" + options.version,
					schema_version: options.schema_version
				}});
		}
		catch (e) {
			grunt.verbose.debug(JSON.stringify(e, null, 2));
			grunt.fail.error("Something went wrong during template processing (mpulse-build-repository-xml.tmpl)");
		}

		// write to XML
		var xmlFileName = options.filePrefix + ".xml";
		grunt.log.ok("Writing " + xmlFileName);
		grunt.file.write(xmlFileName, xml);
	});
};
