/*eslint-env node*/

var path = require("path");
var Repository = require("soasta-repository").SOASTA.Repository;

module.exports = function(grunt) {
	var description = "Upload a version of Boomerang based on the pre-built XML for boomerang.js";

	grunt.registerMultiTask("mpulse-build-repository-xml-upload", description, function() {
		var done = this.async();
		var options = this.options({
			filePrefix: "",
			template: path.join(__dirname, "mpulse-build-repository-xml-upload.tmpl"),
			version: "1.0",
			schema_version: grunt.option("schema-version") || 1
		});

		var configFilePath = "tasks/mpulse-build-repository-xml-upload.config.json";

		// read in the XML .tmpl file
		var template = grunt.file.read(options.template);

		// read in both the minified and debug builds
		var minFile = grunt.file.read(options.filePrefix + ".min.js");
		var debugFile = grunt.file.read(options.filePrefix + "-debug.js");

		// convert both to base64
		var minFileBase64 = new Buffer(minFile).toString("base64").match(/.{1,80}/g).join("\n");
		var debugFileBase64 = new Buffer(debugFile).toString("base64").match(/.{1,80}/g).join("\n");

		//read in the feature keys
		var features = [];
		grunt.file.readJSON(path.join("tasks", "features.json")).forEach(function(feature) {
			features.push(feature.key);
		});

		var xml = "";
		try {
			// run the template
			xml = grunt.template.process(template, {
				data: {
					minified: minFileBase64,
					debug: debugFileBase64,
					features: features.join(",")
				}});
		}
		catch (e) {
			grunt.log.debug(JSON.stringify(e, null, 2));
			grunt.fail.fatal("Something went wrong during template processing (mpulse-build-repository-xml.tmpl)");
		}


		var jsonConfig = {};

		// don't break the build if the config file does not exist
		try {
			jsonConfig = grunt.file.readJSON(configFilePath);
		}
		catch (e) {
			grunt.log.warn("No file " + configFilePath + " found!");
			jsonConfig = {};
		}
		var repository = new Repository(jsonConfig.repository);

		repository.connect(jsonConfig.tenant, jsonConfig.username, jsonConfig.password, function(repositoryConnectError) {
			if (repositoryConnectError) {
				grunt.fail.fatal("Repository Fault: " + repositoryConnectError.message);
			}

			repository.createObject({
				type: "boomerang",
				name: "boomerang-" + options.version,
				schemaVersion: options.schema_version,
				description: "Grunt created Boomerang Version:" + options.version,
				body: xml,
				attributes: [{
					name: "version",
					value: options.version
				}]
			}, function(repositoryUploadError, id) {
				if (repositoryUploadError) {
					grunt.fail.fatal("Repository Upload Fault: " + repositoryUploadError.message);
				}
				grunt.verbose.ok("Successfully created Boomerang version: " + options.version + " on repository service with id: " + id);
				done();
			});
		});
	});
};
