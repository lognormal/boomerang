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
	// Config
	//
	grunt.initConfig({
		pkg:  grunt.file.readJSON("package.json"),
		buildDate: Math.round(Date.now() / 1000),
		concat: {
			options: {
				stripBanners: false,
				seperator: ";"
			},
			debug: {
				src: src,
				dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js"
			},
			release: {
				src: src,
				dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js"
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
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js",
						dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js"
					},
					{
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
						dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js"
					}
				],
				options: {
					replacements: [
						{
							// Replace 0.9 with 0.9.[date]
							pattern: /BOOMR.version\s*=\s*".*";/,
							replacement: "BOOMR.version = \"<%= pkg.releaseVersion %>.<%= buildDate %>\";"
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
					src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
					dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js"
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
						}
					]
				}
			},
			"debug-tests": {
				files: [{
					src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
					dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug-tests.js"
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
					src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js",
					dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js"
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
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug-tests.js",
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
						dest: grunt.file.readJSON("tests/server/env.json").www + "/"
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
					src: ["<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
					      "<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js"],
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
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js",
						dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js.gz"
					},
					{
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
						dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js.gz"
					},
					{
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.min.js",
						dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.min.js.gz"
					},
					{
						src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.min.js",
						dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.min.js.gz"
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
		"mpulse-test": {
				release: {
						boomerang: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.min.js"
				},
				base: {
						boomerang: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js"
				}
		},
		filesize: {
			default: {
				files: [{
					expand: true,
					cwd: "build",
					src: "./**/*.min.js*",
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
					"./tests/build/*.js": ["coverage"]
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
				tasks: ["test:build"]
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
			options: {
				filePrefix: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>",
				version: "<%= pkg.releaseVersion %>.<%= buildDate %>"
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

	// custom tasks
	grunt.registerTask("mpulse:test", ["build", "mpulse-test:release"]);
	grunt.registerTask("mpulse:xml", ["build"]);

	grunt.registerTask("lint", "eslint");

	grunt.registerTask("build", ["concat", "string-replace", "uglify", "compress", "copy:debug", "filesize", "mpulse-build-repository-xml"]);
	grunt.registerTask("build:test", ["concat:debug", "string-replace", "copy:debug"]);

	grunt.registerTask("test", ["test:build", "test:unit", "test:e2e"]);
	grunt.registerTask("test:unit", ["build", "karma:unit"]);
	grunt.registerTask("test:e2e", ["test:e2e:phantomjs"]);

	grunt.registerTask("test:debug", ["test:build", "build:test", "express", "watch"]);

	grunt.registerTask("test:unit:all", ["build", "karma:all"]);
	grunt.registerTask("test:unit:chrome", ["build", "karma:chrome"]);
	grunt.registerTask("test:unit:ie", ["build", "karma:ie"]);
	grunt.registerTask("test:unit:ff", ["build", "karma:ff"]);
	grunt.registerTask("test:unit:opera", ["build", "karma:opera"]);
	grunt.registerTask("test:unit:safari", ["build", "karma:safari"]);

	grunt.registerTask("test:e2e:phantomjs", ["build", "express", "protractor_webdriver", "protractor:phantomjs"]);
	grunt.registerTask("test:e2e:chrome", ["build", "express", "protractor_webdriver", "protractor:chrome"]);
	grunt.registerTask("test:e2e:debug", ["build", "test:build", "build:test", "express", "protractor_webdriver", "protractor:debug"]);

	grunt.registerTask("test:matrix", ["test:matrix:unit", "test:matrix:e2e"]);
	grunt.registerTask("test:matrix:unit", ["saucelabs-mocha:unit"]);
	grunt.registerTask("test:matrix:unit:debug", ["saucelabs-mocha:unit-debug"]);
	grunt.registerTask("test:matrix:e2e", ["saucelabs-mocha:e2e"]);
	grunt.registerTask("test:matrix:e2e:debug", ["saucelabs-mocha:e2e-debug"]);

	grunt.registerTask("test:build", ["pages-builder"]);

	grunt.registerTask("jenkins", ["lint", "build", "test", "copy:webserver"]);

	grunt.registerTask("default", ["lint", "build", "test"]);
};
