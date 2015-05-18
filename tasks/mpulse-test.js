/*eslint-env node*/
/**
 * Grunt Tasks - mpulse-test
 *
 * configure tasks/mpulse-test.config.json
 * {
 *   "server": "localhost:8080",
 *   "apikey": "PH7E4-H9YBZ-6NM8T-L4UQK-ZJAPW",
 *   "secondary_beacons": [],
 *   "boomerang": "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js"
 * }
 *
 * keys and values map as follows:
 *
 *   server: mPulse Collector server to send beacons to and fetch config.js from
 *   apikey: API Key for the specific application you wish to use
 *   secondary_beacons: list of servers to send beacons to next to the main servers for debugging purposes
 *   boomerang: boomerang script taken as basis for modification.
 *
 * Values can also be partially overridden by Gruntfile.js.
 * Application of Values from different sources is hirarchically set as follows:
 *
 *   defaultConfig <= tasks/mpulse-test.config.json <= Gruntfile.js
 *
 * Filepaths are relative to the root of the project or Gruntfile.js file
 */

var merge = require("deepmerge");

module.exports = function(grunt) {

	var defaultConfig = {
		server: "localhost:8080",
		apikey: "PH7E4-H9YBZ-6NM8T-L4UQK-ZJAPW",
		secondaryBeacons: [],
		boomerang: ""
	};

	var stringTemplates = {
		beaconDestinationHost: "%beacon_dest_host%",
		beaconDestinationPath: "%beacon_dest_path%",
		configJsHost: "%config_host%",
		configJsPath: "%config_path%",
		apikey: "%client_apikey%",
		configURLSuffix: "%config_url_suffix%",
		secondaryBeacon: "secondary_beacons:[<%= secondaryBeacon %>],instrument_xhr:true,"
	};

	var description = "Build Boomerang for a specific combination of collector-server and apikey";
	var configFilePath = "tasks/mpulse-test.config.json";
	var defaultConfigJsPath = "/boomerang/config.js";

	grunt.registerMultiTask("mpulse-test", description, function() {
		var jsonConfig = {};

		// don't break the build if the config file does not exist
		try { jsonConfig = grunt.file.readJSON(configFilePath); }
		catch(e) {
			grunt.log.warn("No file " + configFilePath + " found!");
			jsonConfig = {};
		}

		var gruntConfig = grunt.config.get("mpulse-test");

		var defaultJsonConfig = merge(defaultConfig, jsonConfig),
		    config = merge(defaultJsonConfig, gruntConfig[this.target]);

		var secondaryBeaconServers = "";
		if (config.secondaryBeacons.length > 0) {
			secondaryBeaconServers = config.secondaryBeacons.map(function(beaconServer) {
				return "'"+ beaconServer + "'";
			}).join(",");
		}

		var secondaryBeaconsProcessed = grunt.template.process(stringTemplates.secondaryBeacon, {
			secondaryBeacon: secondaryBeaconServers
		});

		try {
			var boomerang = grunt.file.read(config.boomerang, { encoding: "utf8" });

			boomerang = boomerang.replace(stringTemplates.beaconDestinationHost + stringTemplates.beaconDestinationPath, config.server);
			boomerang = boomerang.replace(stringTemplates.configJsHost + stringTemplates.configJsPath, config.server + defaultConfigJsPath);
			boomerang = boomerang.replace(stringTemplates.apikey, config.apikey);
			boomerang = boomerang.replace(stringTemplates.configURLSuffix, config.configURLSuffix || "");
			boomerang = boomerang.replace(/\\*BEGIN DEBUG TOKEN\*\/log:null, \/\*END DEBUG TOKEN\*/, secondaryBeaconsProcessed);

			grunt.file.write("build/" + config.apikey + ".js", boomerang, {encoding: "utf8"});
		}
		catch (e) {
			grunt.verbose.debug(JSON.stringify(e, null, 2));
			grunt.fail.error("Something went wrong during boomerang manipulation");
		}
	});
};
