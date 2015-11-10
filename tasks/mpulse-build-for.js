/*eslint-env node*/
/**
 * Grunt Tasks - mpulse-build-for
 *
 * Configure tasks/mpulse-build-for.config.json
 * {
 *   "default": {
 *     "server": "localhost:8080",
 *     "apikey": "11111-11111-11111-11111-11111",
 *     "secondaryBeacons": [],
 *     "configAsJSON": false
 *   }
 * }
 *
 * Keys and values map as follows:
 *
 *   server: mPulse Collector server to send beacons to and fetch config.js from
 *   apikey: API Key for the specific application you wish to use
 *   secondary_beacons: list of servers to send beacons to next to the main servers for debugging purposes
 *   configAsJSON: Whether or not to use config.json instead of config.js
 *
 * Other parameters are set via Gruntfile.js but can be overridden if desired:
 *
 *   boomerang: boomerang script taken as basis for modification.  By default, a new version of Boomerang is built.
 *   outputSuffix: The output suffix of the built file.
 *
 * `default` is the name of the app that this build is supposed to generate beacons for.
 * You may have multiple named apps in the configuration file:
 *
 * {
 *   "default": { ... },
 *   "mpulse": { ... },
 *   "soasta": { ... }
 * }
 *
 * These do not serve the same purpose as the build targets in Gruntfile.js, they only decide which API Key
 * and Collector we're supposed to use to send our beacons. This way you may have release, debug, and various
 * minified versions of the same app-specific boomerang script.
 *
 * Choose which app to build for with the commandline parameter --app. For the above example config file, use
 * the following to build a debug version of boomerang for mpulse:
 *
 *  $> grunt mpulse:build --app mpulse
 *
 * Values can also be partially overridden by Gruntfile.js.
 *
 * Application of Values from different sources is hirarchically set as follows:
 *
 *   defaultConfig <= tasks/mpulse-build-for.config.json <= Gruntfile.js
 *
 * Filepaths are relative to the root of the project or Gruntfile.js file.
 *
 * By default, the resulting file will be in build/[apikey][outputSuffix].js
 */

var merge = require("deepmerge");

module.exports = function(grunt) {
	var defaultConfig = {
		server: "localhost:8080",
		apikey: "11111-11111-11111-11111-11111",
		secondaryBeacons: [],
		boomerang: "",
		configAsJSON: false
	};

	var stringTemplates = {
		beaconDestinationHost: "%beacon_dest_host%",
		beaconDestinationPath: "%beacon_dest_path%",
		configHost: "%config_host%",
		configJsPath: "%config_path%",
		configJsonPath: "%config_json_path%",
		apikey: /%client_apikey%/g,
		configURLSuffix: "%config_url_suffix%",
		secondaryBeacon: "secondary_beacons:[<%= secondaryBeacon %>],instrument_xhr:true,"
	};

	var description = "Build Boomerang for a specific combination of collector-server and apikey";
	var configFilePath = "tasks/mpulse-build-for.config.json";
	var defaultConfigJsPath = "/boomerang/config.js";
	var defaultConfigJsonPath = "/api/config.json";

	grunt.registerMultiTask("mpulse-build-for", description, function() {
		var jsonConfig = {};

		var app = grunt.option("app");

		// don't break the build if the config file does not exist
		try {
			jsonConfig = grunt.file.readJSON(configFilePath);
		}
		catch (e) {
			grunt.log.warn("No file " + configFilePath + " found!");
			jsonConfig = {};
		}

		jsonConfig = jsonConfig[app] ? jsonConfig[app] : jsonConfig["default"];

		var gruntConfig = grunt.config.get("mpulse-build-for");

		var defaultJsonConfig = merge(defaultConfig, jsonConfig),
		    config = merge(defaultJsonConfig, gruntConfig[this.target]);

		var secondaryBeaconServers = "";
		if (config.secondaryBeacons.length > 0) {
			secondaryBeaconServers = config.secondaryBeacons.map(function(beaconServer) {
				return "'" + beaconServer + "'";
			}).join(",");
		}

		var secondaryBeaconsProcessed = grunt.template.process(stringTemplates.secondaryBeacon, {
			secondaryBeacon: secondaryBeaconServers
		});

		grunt.log.debug("Finished building configuration: ");
		grunt.log.debug(JSON.stringify(config, null, 2));
		try {
			grunt.log.debug("Reading file: " + config.boomerang);
			var boomerang = grunt.file.read(config.boomerang, { encoding: "utf8" });

			boomerang = boomerang.replace(stringTemplates.beaconDestinationHost + stringTemplates.beaconDestinationPath, config.server);
			boomerang = boomerang.replace(stringTemplates.configHost + stringTemplates.configJsPath, config.server + defaultConfigJsPath);
			boomerang = boomerang.replace(stringTemplates.configHost + stringTemplates.configJsonPath, config.server + defaultConfigJsonPath);
			boomerang = boomerang.replace(stringTemplates.apikey, config.apikey);
			boomerang = boomerang.replace(stringTemplates.configURLSuffix, config.configURLSuffix || "");
			boomerang = boomerang.replace(/\/\*BEGIN DEBUG TOKEN\*\/log: null, \/\*END DEBUG TOKEN\*\//, secondaryBeaconsProcessed);

			if (config.configAsJSON) {
				boomerang = boomerang.replace(/var\s*configAsJSON\s*=\s*false;/, "var configAsJSON = true;");
			}

			grunt.file.write("build/" + config.apikey + config.outputSuffix + ".js", boomerang, {encoding: "utf8"});
		}
		catch (e) {
			grunt.log.debug(JSON.stringify(e, null, 2));
			grunt.fail.error("Something went wrong during boomerang manipulation");
		}

	});
};
