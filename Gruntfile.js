/* eslint-env node */
"use strict";

var fs = require("fs");
var path = require("path");
var fse = require("fs-extra");
var stripJsonComments = require("strip-json-comments");
var grunt = require("grunt");

//
// Constants
//
var TEST_URL_BASE = "http://boomerang-test.soasta.com:3000/";

//
// Grunt config
//
module.exports = function() {
	//
	// paths
	//
	var testsDir = path.join(__dirname, "tests");
	var pluginsDir = path.join(__dirname, "plugins");

	// boomerang.js and plugins/*.js order
	var src = [ "boomerang.js" ];
	var plugins = grunt.file.readJSON("plugins.json");
	src.push(plugins.plugins);
	src.push(path.join(pluginsDir, "zzz_last_plugin.js"));

	// ensure env.json exists
	var envFile = path.resolve(path.join(testsDir, "server", "env.json"));
	if (!fs.existsSync(envFile)) {
		var envFileSample = path.resolve(path.join(testsDir, "server", "env.json.sample"));
		console.info("Creating env.json from defaults");
		fse.copySync(envFileSample, envFile);
	}

	// Build SauceLabs E2E test URLs
	var e2eTests = [];
	if (grunt.file.exists("tests/e2e/e2e.json")) {
		e2eTests = JSON.parse(stripJsonComments(grunt.file.read("tests/e2e/e2e.json")));
	}
	var e2eUrls = [];

	for (var i = 0; i < e2eTests.length; i++) {
		e2eUrls.push(TEST_URL_BASE + "pages/" + e2eTests[i].path + "/" + e2eTests[i].file + ".html");
	}

	//
	// Release version
	//
	var pkg = grunt.file.readJSON("package.json");
	var buildNumber = grunt.option("buildNumber") || 0;

	//
	// Config
	//
	grunt.initConfig({
		pkg:  grunt.file.readJSON("package.json"),
		releaseVersion: pkg.releaseVersion + "." + buildNumber,
		buildDate: Math.round(Date.now() / 1000),
		concat: {
			options: {
				stripBanners: false,
				seperator: ";"
			},
			debug: {
				src: src,
				dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js"
			},
			release: {
				src: src,
				dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js"
			}
		},
		eslint: {
			target: [
				"Gruntfile.js",
				"boomerang.js",
				"*.config*.js",
				"plugins/*.js",
				"tasks/*.js",
				"tests/*.js",
				"tests/unit/*.js",
				"tests/unit/*.html",
				"tests/e2e/*.js",
				"tests/server/*.js",
				"tests/page-templates/**/*.js",
				"tests/page-templates/**/*.html",
				"tests/page-templates/**/*.js",
				"tests/test-templates/**/*.js"
			]
		},
		"string-replace": {
			all: {
				files: [
					{
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js",
						dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js"
					},
					{
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js",
						dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js"
					}
				],
				options: {
					replacements: [
						{
							// Replace 1.0 with 1.[0 or jenkins build #].[date]
							pattern: /BOOMR.version\s*=\s*".*";/,
							replacement: "BOOMR.version = \"<%= releaseVersion %>.<%= buildDate %>\";"
						},
						{
							// strip out BOOMR = BOOMR || {}; in plugins
							pattern: /BOOMR\s*=\s*BOOMR\s*\|\|\s*{};/g,
							replacement: ""
						},
						{
							// strip out BOOMR.plugins = BOOMR.plugins || {}; in plugins
							pattern: /BOOMR\.plugins\s*=\s*BOOMR\.plugins\s*\|\|\s*{};/g,
							replacement: ""
						}
					]
				}
			},
			debug: {
				files: [{
					src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js",
					dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js"
				}],
				options: {
					replacements: [
						{
							// Add &debug key to request
							pattern: /key=%client_apikey%/,
							replacement: "debug=\&key=%client_apikey%"
						},
						{
							// Show debug log
							pattern: /\/\*BEGIN DEBUG TOKEN\*\/.*\/\*END DEBUG TOKEN\*\//,
							replacement: ""
						},
						{
							// Leave ConfigJS Script tag in DOM If debug
							pattern: /\* CONFIGJSDEBUG_TOKEN \*/,
							replacement: ""
						}
					]
				}
			},
			"debug-tests": {
				files: [{
					src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js",
					dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug-tests.js"
				}],
				options: {
					replacements: [
						{
							// Send beacons to null
							pattern: /location\.protocol \+ \"\/\/%beacon_dest_host%%beacon_dest_path%/,
							replacement: "\"/blackhole"
						},
						{
							// Add config to null
							pattern: /\/\/%config_host%%config_path%/,
							replacement: "/blackhole"
						}
					]
				}
			},
			release: {
				files: [{
					src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js",
					dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js"
				}],
				options: {
					// strip out some NOPs
					replacements: [
						{
							pattern: /else{}/g,
							replacement: ""
						},
						{
							pattern: /\(window\)\);/g,
							replacement: "\(window\)\);\n"
						},
						{
							pattern: /\(\)\);\(function\(/g,
							replacement: "\(\)\);\n(function("
						},
						{
							pattern: /BEGIN UNIT_TEST_CODE \*\//,
							replacement: ""
						},
						{
							pattern: /\/\* END UNIT_TEST_CODE /,
							replacement: ""
						}
					]
				}
			},
			"release-test": {
				files: [{
					src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js",
					dest: "tests/build/<%= pkg.name %>-latest.js"
				}],
				options: {
					replacements: [
						{
							pattern: /else{}/g,
							replacement: ""
						},
						{
							pattern: /\(window\)\);/g,
							replacement: "\(window\)\);\n"
						},
						{
							pattern: /\(\)\);\(function\(/g,
							replacement: "\(\)\);\n(function("
						},
						{
							// Add &debug key to request
							pattern: /key=%client_apikey%/,
							replacement: "debug=\&key=API_KEY"
						},
						{
							// Send beacons to null
							pattern: /location\.protocol \+ \"\/\/%beacon_dest_host%%beacon_dest_path%/,
							replacement: "\"/blackhole"
						},
						{
							// Add config to null
							pattern: /\/\/%config_host%%config_path%/,
							replacement: "/config"
						},
						{
							pattern: /%config_url_suffix%/,
							replacement: ""
						},
						{
							pattern: /CONFIG_RELOAD_TIMEOUT=5\.5\*60\*1000;/,
							replacement: "CONFIG_RELOAD_TIMEOUT=1000;"
						}
					]
				}
			}
		},
		copy: {
			// copy files to tests\build\boomerang-latest.js so tests/index.html points to the latest version always
			debug: {
				files: [
					{
						nonull: true,
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug-tests.js",
						dest: "tests/build/<%= pkg.name %>-latest-debug.js"
					}
				]
			},
			webserver: {
				files: [
					{
						expand: true,
						nonull: true,
						cwd: "tests/",
						src: "**/*",
						force: true,
						dest: grunt.file.readJSON("tests/server/env.json").publish + "/"
					}
				]
			}
		},
		uglify: {
			default: {
				options: {
					preserveComments: false,
					mangle: true,
					sourceMap: true
				},
				files: [{
					expand: true,
					cwd: "build/",
					src: ["<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js",
					      "<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js"],
					dest: "build/",
					ext: ".min.js",
					extDot: "last"
				}]
			},
			plugins: {
				options: {
					preserveComments: false,
					mangle: true,
					sourceMap: true
				},
				files: [{
					expand: true,
					cwd: "plugins/",
					src: ["./*.js"],
					dest: "build/plugins/",
					ext: ".min.js",
					extDot: "first"
				}]
			}
		},
		compress: {
			main: {
				options: {
					mode: "gzip",
					level: 9
				},
				files: [
					{
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js",
						dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js.gz"
					},
					{
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js",
						dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.js.gz"
					},
					{
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.min.js",
						dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.min.js.gz"
					},
					{
						src: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.min.js",
						dest: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>-debug.min.js.gz"
					}
				]
			},
			plugins: {
				options: {
					mode: "gzip",
					level: 9
				},
				files: [{
					expand: true,
					cwd: "build/plugins",
					src: "./*.js",
					dest: "build/plugins/",
					ext: ".min.js.gz",
					extDot: "first"
				}]
			}
		},
		"mpulse-build-for": {
			release: {
				boomerang: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.min.js",
				outputSuffix: ".min"
			},
			base: {
				boomerang: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>.js",
				outputSuffix: ""
			}
		},
		filesize: {
			csv: {
				files: [{
					expand: true,
					cwd: "build",
					src: ["./**/*.min.js", "./**/*.min.js.gz"],
					ext: ".min.js.gz",
					extDot: "first"
				}],
				options: {
					output: {
						path: "tests/results/filesizes.csv",
						format: "\"{filename}\",{size},{kb},{now:YYYYMMDDhhmmss};", /* https://github.com/k-maru/grunt-filesize/issues/8 */
						append: true
					}
				}
			},
			default: {
				files: [{
					expand: true,
					cwd: "build",
					src: ["./**/*.min.js", "./**/*.min.js.gz"],
					ext: ".min.js.gz",
					extDot: "first"
				}],
				options: {
					output: {
						format: "{filename}: Size of {size:0,0} bytes ({kb:0.00} kilobyte)",
						stdout: true
					}
				}
			}
		},
		clean: {
			options: {},
			build: [
				"build/*",
				"tests/build/*",
				"tests/results/*.tap",
				"tests/results/*.xml",
				"tests/coverage/*",
				"tests/pages/**/*"
			],
			src: ["plugins/*~", "*.js~", "*.html~"]
		},
		karma: {
			options: {
				singleRun: true,
				colors: true,
				configFile: "./tests/karma.config.js",
				preprocessors: {
					"./build/*.js": ["coverage"]
				},
				basePath: "./",
				files: [
					// relative to tests/ dir
					"vendor/mocha/mocha.css",
					"vendor/mocha/mocha.js",
					"vendor/assertive-chai/dist/assertive-chai.js",
					"unit/*.js",
					"build/*.js"
				]
			},
			unit: {
				browsers: ["PhantomJS"],
				frameworks: ["mocha"]
			},
			all: {
				browsers: ["Chrome", "Firefox", "IE", "Opera", "Safari", "PhantomJS"]
			},
			chrome: {
				browsers: ["Chrome"]
			},
			ie: {
				browsers: ["IE"]
			},
			ff: {
				browsers: ["Firefox"]
			},
			opera: {
				browsers: ["Opera"]
			},
			safari: {
				browsers: ["Safari"]
			}
		},
		protractor: {
			// NOTE: https://github.com/angular/protractor/issues/1512 Selenium+PhantomJS not working in 1.6.1
			options: {
				noColor: false,
				keepAlive: false
			},
			phantomjs: {
				configFile: "tests/protractor.config.phantom.js"
			},
			chrome: {
				configFile: "tests/protractor.config.chrome.js"
			},
			debug: {
				configFile: "tests/protractor.config.debug.js"
			}
		},
		protractor_webdriver: {
			options: {
				keepAlive: true
			},
			e2e: {
			}
		},
		express: {
			options: {
				port: 4002,
				hostname: "0.0.0.0"
			},
			dev: {
				options: {
					script: "tests/server/app.js"
				}
			}
		},
		"saucelabs-mocha": {
			all: {
				options: {
					// username: "", // SAUCE_USERNAME
					// key: "",      // SAUCE_ACCESS_KEY
					build: process.env.CI_BUILD_NUMBER,
					tunneled: false
				}
			},
			unit: {
				options: {
					urls: [TEST_URL_BASE + "unit/"],
					testname: "Boomerang Unit Tests",
					browsers: JSON.parse(stripJsonComments(grunt.file.read("tests/browsers-unit.json")))
				}
			},
			"unit-debug": {
				options: {
					urls: [TEST_URL_BASE + "unit/"],
					testname: "Boomerang Unit Tests",
					browsers: [{
						"browserName": "internet explorer",
						"version":     "11",
						"platform":    "Windows 8.1"
					}]
				}
			},
			e2e: {
				options: {
					urls: e2eUrls,
					testname: "Boomerang E2E Tests",
					browsers: JSON.parse(stripJsonComments(grunt.file.read("tests/browsers-unit.json")))
				}
			},
			"e2e-debug": {
				options: {
					urls: e2eUrls,
					testname: "Boomerang E2E Tests",
					browsers: [{
						"browserName": "internet explorer",
						"version":     "11",
						"platform":    "Windows 8.1"
					}]
				}
			}
		},
		watch: {
			test: {
				files: [
					"tests/e2e/*.js",
					"tests/page-template-snippets/**/*",
					"tests/page-templates/**/*",
					"tests/unit/**/*",
					"tests/test-templates/**/*.js"
				],
				tasks: ["pages-builder"]
			},
			boomerang: {
				files: [
					"boomerang.js",
					"plugins/*.js",
					"plugins.json"
				],
				tasks: ["build:test"]
			},
			express: {
				files: [
					"tests/server/*.js"
				],
				tasks: ["express"]
			}
		},
		"mpulse-build-repository-xml": {
			"build": {
				options: {
					filePrefix: "build/<%= pkg.name %>-<%= releaseVersion %>.<%= buildDate %>",
					version: "<%= releaseVersion %>.<%= buildDate %>"
				}
			},
			"from": {
				options: {
					filePrefix: grunt.option("file-prefix"),
					version: grunt.option("boomerang-version")
				}
			}
		}
	});
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-express-server");
	grunt.loadNpmTasks("grunt-karma");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-string-replace");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-filesize");
	grunt.loadNpmTasks("grunt-protractor-runner");
	grunt.loadNpmTasks("grunt-protractor-webdriver");
	grunt.loadNpmTasks("grunt-template");
	grunt.loadNpmTasks("grunt-saucelabs");
	grunt.loadNpmTasks("grunt-contrib-watch");

	// tasks/*.js
	grunt.loadTasks("tasks");

	grunt.registerTask("pages-builder", "Builds our HTML tests/pages", require(path.join(testsDir, "builder")));

	// Custom aliases for configured grunt tasks
	var aliases = {
		"build": ["concat", "string-replace", "uglify", "compress", "copy:debug", "filesize:default", "mpulse-build-repository-xml:build"],
		"build:test": ["concat:debug", "string-replace", "copy:debug"],
		"default": ["lint", "build", "test", "filesize:default"],
		"jenkins": ["lint", "build", "test", "copy:webserver", "filesize:csv"],
		"lint": ["eslint"],
		"mpulse:build": ["build", "mpulse-build-for:base", "mpulse-build-for:release"],
		"mpulse:xml": ["build"],
		"test": ["build", "test:build", "test:unit", "test:e2e"],
		"test:build": ["pages-builder", "build"],
		"test:debug": ["test:build", "build:test", "express", "watch"],
		"test:e2e": ["test:build", "build", "test:e2e:phantomjs"],
		"test:e2e:chrome": ["build", "express", "protractor_webdriver", "protractor:chrome"],
		"test:e2e:debug": ["build", "test:build", "build:test", "express", "protractor_webdriver", "protractor:debug"],
		"test:e2e:phantomjs": ["build", "express", "protractor_webdriver", "protractor:phantomjs"],
		"test:matrix": ["test:matrix:unit", "test:matrix:e2e"],
		"test:matrix:e2e": ["saucelabs-mocha:e2e"],
		"test:matrix:e2e:debug": ["saucelabs-mocha:e2e-debug"],
		"test:matrix:unit": ["saucelabs-mocha:unit"],
		"test:matrix:unit:debug": ["saucelabs-mocha:unit-debug"],
		"test:unit": ["test:build", "build", "karma:unit"],
		"test:unit:all": ["build", "karma:all"],
		"test:unit:chrome": ["build", "karma:chrome"],
		"test:unit:ff": ["build", "karma:ff"],
		"test:unit:ie": ["build", "karma:ie"],
		"test:unit:opera": ["build", "karma:opera"],
		"test:unit:safari": ["build", "karma:safari"]
	};

	function isAlias(task) {
		return aliases[task] ? true : false;
	}

	function resolveAlias(task) {
		var tasks = [],
		    resolved = false;
		tasks = aliases[task];

		function checkDuplicates(insertableTask) {
			return tasks.indexOf(insertableTask) === -1;
		}

		while (!resolved) {
			if (tasks.filter(isAlias).length === 0) {
				resolved = true;
			}

			for (var index = 0; index < tasks.length; index++) {
				if (isAlias(tasks[index])) {
					var aliasTask = tasks[index];
					var beforeTask = tasks.slice(0, index );
					var afterTask = tasks.slice(index +1, tasks.length);
					var insertTask = aliases[aliasTask].filter(checkDuplicates);
					tasks = [].concat(beforeTask, insertTask, afterTask);
				}
			}
		}

		return tasks;
	}

	Object.keys(aliases).map(function(alias) {
		var resolved = resolveAlias(alias);
		grunt.log.debug("Resolving task alias: " + alias + " to " + JSON.stringify(resolved));
		grunt.registerTask(alias, resolved);
	});
};
