/* eslint-env node */
"use strict";

//
// Imports
//
var fs = require("fs");
var path = require("path");
var fse = require("fs-extra");
var stripJsonComments = require("strip-json-comments");
var grunt = require("grunt");

//
// Constants
//
var BUILD_PATH = "build";
var TEST_BUILD_PATH = path.join("tests", "build");
var TEST_RESULTS_PATH = path.join("tests", "results");
var TEST_DEBUG_PORT = 4002;
var TEST_URL_BASE = grunt.option("test-url") || "http://localhost:4002";

var DEFAULT_UGLIFY_BOOMERANGJS_OPTIONS = {
	preserveComments: false,
	mangle: {
		// for errors.js
		except: [
			"createStackForSend",
			"loadFinished",
			"BOOMR_addError",
			"BOOMR_plugins_errors_onerror",
			"BOOMR_plugins_errors_onxhrerror",
			"BOOMR_plugins_errors_console_error",
			"BOOMR_plugins_errors_wrap"
		]
	},
	sourceMap: true,
	compress: {
		sequences: false
	}
};

//
// Grunt config
//
module.exports = function() {
	//
	// Paths
	//
	var testsDir = path.join(__dirname, "tests");
	var pluginsDir = path.join(__dirname, "plugins");

	//
	// Determine source files:
	//  boomerang.js and plugins/*.js order
	//
	var src = [ "boomerang.js" ];
	var plugins = grunt.file.readJSON("plugins.json");
	src.push(plugins.plugins);
	src.push(path.join(pluginsDir, "zzz-last-plugin.js"));

	//
	// Ensure env.json exists
	//
	var envFile = path.resolve(path.join(testsDir, "server", "env.json"));
	if (!fs.existsSync(envFile)) {
		var envFileSample = path.resolve(path.join(testsDir, "server", "env.json.sample"));
		console.info("Creating env.json from defaults");
		fse.copySync(envFileSample, envFile);
	}

	var env = grunt.file.readJSON("tests/server/env.json");

	//
	// Build SauceLabs E2E test URLs
	//
	var e2eTests = [];
	if (grunt.file.exists("tests/e2e/e2e.json")) {
		e2eTests = JSON.parse(stripJsonComments(grunt.file.read("tests/e2e/e2e.json")));
	}
	var e2eUrls = [];

	for (var i = 0; i < e2eTests.length; i++) {
		e2eUrls.push(TEST_URL_BASE + "pages/" + e2eTests[i].path + "/" + e2eTests[i].file + ".html");
	}

	//
	// Build numbers
	//
	var pkg = grunt.file.readJSON("package.json");
	var buildNumber = grunt.option("buildNumber") || 0;
	var releaseVersion = pkg.releaseVersion + "." + buildNumber;
	var buildDate = Math.round(Date.now() / 1000);
	var boomerangVersion = releaseVersion + "." + buildDate;

	//
	// Output files
	//

	// build file name is based on the version number
	var buildFilePrefix = pkg.name + "-" + boomerangVersion;
	var buildPathPrefix = path.join(BUILD_PATH, buildFilePrefix);

	var testBuildFilePrefix = pkg.name;
	var testBuildPathPrefix = path.join(TEST_BUILD_PATH, testBuildFilePrefix);

	var buildDebug = buildPathPrefix + "-debug.js";
	var buildRelease = buildPathPrefix + ".js";
	var buildReleaseMin = buildPathPrefix + ".min.js";
	var buildTest = testBuildPathPrefix + "-latest-debug.js";
	var buildTestMin = testBuildPathPrefix + "-latest-debug.min.js";

	//
	// Build configuration
	//
	var buildConfig = {
		server: grunt.option("server") || "localhost"
	};

	var bannerFilePathRelative = "./lib/banner.txt";
	var bannerFilePathAbsolute = path.resolve(bannerFilePathRelative);
	var bannerString = grunt.file.read(bannerFilePathAbsolute);

	//
	// Config
	//
	grunt.initConfig({
		// package info
		pkg: pkg,

		//
		// Variables to use in tasks
		//
		buildConfig: buildConfig,
		boomerangVersion: boomerangVersion,
		buildFilePrefix: buildFilePrefix,
		buildPathPrefix: buildPathPrefix,
		testBuildPathPrefix: testBuildPathPrefix,

		//
		// Tasks
		//
		concat: {
			options: {
				stripBanners: false,
				seperator: ";"
			},
			debug: {
				src: src,
				dest: buildDebug
			},
			"debug-tests": {
				src: [src, "tests/boomerang-test-plugin.js"],
				dest: buildTest
			},
			release: {
				src: src,
				dest: buildRelease
			}
		},
		mkdir: {
			test: {
				options: {
					create: [TEST_RESULTS_PATH]
				}
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
				"tests/test-templates/**/*.js",
				"!tests/page-templates/12-react/support/*"
			]
		},
		"string-replace": {
			all: {
				files: [
					{
						src: buildRelease,
						dest: buildRelease
					},
					{
						src: buildDebug,
						dest: buildDebug
					},
					{
						src: buildTest,
						dest: buildTest
					}
				],
				options: {
					replacements: [
						{
							// Replace 1.0 with 1.[0 or jenkins build #].[date]
							pattern: "%boomerang_version%",
							replacement: boomerangVersion
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
			"debug-tests": {
				files: [{
					src: buildTest,
					dest: buildTest
				}],
				options: {
					replacements: [
						{
							// Send beacons to null
							pattern: /beacon_url: .*/,
							replacement: "beacon_url: \"/blackhole\","
						}
					]
				}
			},
			release: {
				files: [{
					src: buildRelease,
					dest: buildRelease
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
			},
			"remove-sourcemappingurl": {
				files: [
					{
						src: buildReleaseMin,
						dest: buildReleaseMin
					}
				],
				options: {
					replacements: [
						{
							pattern: /\/\/# sourceMappingURL=.*/g,
							replacement: ""
						}
					]
				}
			}
		},
		strip_code: {
			debug: {
				files: [{
					src: buildRelease
				}],
				options: {
					start_comment: "BEGIN_DEBUG",
					end_comment: "END_DEBUG"
				}
			},
			prod: {
				files: [
					{
						src: buildDebug
					},
					{
						src: "<%= testBuildPathPrefix %>*.js"
					}
				],
				options: {
					start_comment: "BEGIN_PROD",
					end_comment: "END_PROD"
				}
			}
		},
		copy: {
			webserver: {
				files: [
					{
						expand: true,
						nonull: true,
						cwd: "tests/",
						src: "**/*",
						force: true,
						dest: env.publish + "/"
					}
				]
			}
		},
		uglify: {
			options: {
				banner: bannerString + "/* Boomerang Version: <%= boomerangVersion %> */\n"
			},
			default: {
				options: DEFAULT_UGLIFY_BOOMERANGJS_OPTIONS,
				files: [{
					expand: true,
					cwd: "build/",
					src: ["<%= buildFilePrefix %>-debug.js",
					      "<%= buildFilePrefix %>.js"],
					dest: "build/",
					ext: ".min.js",
					extDot: "last"
				}]
			},
			"debug-test-min": {
				options: DEFAULT_UGLIFY_BOOMERANGJS_OPTIONS,
				files: [{
					src: buildTest,
					dest: buildTestMin
				}]
			},
			plugins: {
				options: {
					preserveComments: false,
					mangle: true,
					banner: "",
					sourceMap: true,
					compress: {
						sequences: false
					}
				},
				files: [{
					expand: true,
					cwd: "plugins/",
					src: ["./*.js"],
					dest: "build/plugins/",
					ext: ".min.js",
					extDot: "first"
				}]
			},
			snippets: {
				options: {
					preserveComments: false,
					mangle: true,
					banner: "",
					compress: {
						sequences: false
					}
				},
				files: [{
					expand: true,
					cwd: "tests/page-template-snippets/",
					src: ["instrumentXHRSnippetNoScript.tpl"],
					dest: "build/snippets/",
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
						src: buildRelease,
						dest: "<%= buildPathPrefix %>.js.gz"
					},
					{
						src: buildDebug,
						dest: "<%= buildPathPrefix %>-debug.js.gz"
					},
					{
						src: "<%= buildPathPrefix %>.min.js",
						dest: "<%= buildPathPrefix %>.min.js.gz"
					},
					{
						src: "<%= buildPathPrefix %>-debug.min.js",
						dest: "<%= buildPathPrefix %>-debug.min.js.gz"
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
		"babel": {
			"spa-react-test-templates": {
				files: {
					"tests/page-templates/12-react/support/app-component.js": "tests/page-templates/12-react/support/app.jsx"
				}
			}
		},
		browserify: {
			"spa-react-test-templates": {
				files: {
					"tests/page-templates/12-react/support/app.js": [
						"node_modules/react/dist/react.js",
						"node_modules/react-dom/dist/react-dom.js",
						"node_modules/react-router/umd/ReactRouter.js",
						"tests/page-templates/12-react/support/app-component.js"
					]
				}
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
			console: {
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
			"spa-react-test-templates": [
				"tests/pages/12-react/support/app.js",
				"tests/page-templates/12-react/support/app.js",
				"tests/page-templates/12-react/support/app-component.js",
				"tests/page-templates/12-react/support/*.map"
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
					"boomerang-test-framework.js",
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
			},
			debug: {
				singleRun: false
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
				port: TEST_DEBUG_PORT,
				hostname: "0.0.0.0"
			},
			dev: {
				options: {
					script: "tests/server/app.js"
				}
			},
			"secondary": {
				options: {
					script: "tests/server/app.js",
					port: (TEST_DEBUG_PORT + 1)
				}
			},
			doc: {
				options: {
					port: (TEST_DEBUG_PORT - 1),
					script: "tests/server/doc-server.js"
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
						"version": "11",
						"platform": "Windows 8.1"
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
		jsdoc: {
			dist: {
				src: ["boomerang.js", "plugins/*.js"],
				jsdoc: "./node_modules/jsdoc/jsdoc.js",
				options: {
					destination: "build/doc",
					package: "package.json",
					readme: "README.md",
					configure: "jsdoc.conf.json"
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
					"tests/test-templates/**/*.js",
					"!tests/page-templates/12-react/support/*.jsx",
					"!*.#*"
				],
				tasks: ["pages-builder"]
			},
			"test-react": {
				files: [
					"tests/page-templates/12-react/support/*.jsx"
				],
				tasks: ["test:build:react"]
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
				tasks: ["express:dev", "express:secondary"]
			},
			doc: {
				files: [
					"boomerang.js",
					"plugins/*.js",
					"doc/**/**"
				],
				tasks: ["clean", "jsdoc"]
			}
		}
	});

	grunt.loadNpmTasks("gruntify-eslint");
	grunt.loadNpmTasks("grunt-babel");
	grunt.loadNpmTasks("grunt-browserify");
	grunt.loadNpmTasks("grunt-express-server");
	grunt.loadNpmTasks("grunt-karma");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-string-replace");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-filesize");
	grunt.loadNpmTasks("grunt-mkdir");
	grunt.loadNpmTasks("grunt-protractor-runner");
	grunt.loadNpmTasks("grunt-protractor-webdriver");
	grunt.loadNpmTasks("grunt-template");
	grunt.loadNpmTasks("grunt-saucelabs");
	grunt.loadNpmTasks("grunt-strip-code");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-jsdoc");

	// tasks/*.js
	if (grunt.file.exists("tasks")) {
		grunt.loadTasks("tasks");
	}

	grunt.registerTask("pages-builder", "Builds our HTML tests/pages", require(path.join(testsDir, "builder")));

	// Custom aliases for configured grunt tasks
	var aliases = {
		"default": ["lint", "build", "test", "metrics"],

		//
		// Build
		//
		"build": ["concat", "build:apply-templates", "uglify", "string-replace:remove-sourcemappingurl", "compress", "metrics"],
		"build:test": ["concat:debug", "concat:debug-tests", "!build:apply-templates", "uglify:debug-test-min"],

		// Build steps
		"build:apply-templates": [
			"string-replace:all",
			"!string-replace:debug-tests",
			"string-replace:release",
			"!strip_code:debug",
			"!strip_code:prod"
		],

		// metrics to generate
		"metrics": ["filesize:console"],

		//
		// Lint
		//
		"lint": ["eslint"],

		//
		// Test tasks
		//
		"test": ["build", "test:build", "test:unit", "test:e2e"],

		// builds test files
		"test:build": ["mkdir:test", "test:build:react", "pages-builder", "build"],

		// react test files
		"test:build:react": ["babel:spa-react-test-templates", "browserify:spa-react-test-templates"],

		// useful for debugging tests, leaves a webbrowser open at http://localhost:3001
		"test:debug": [
			"test:build",
			"build:test",
			"express:dev",
			"express:secondary",
			"test:debug:watch"
		],

		// open your browser to http://localhost:4000/debug.html to debug
		"test:karma:debug": ["test:build", "build:test", "karma:debug"],

		// unit tests
		"test:unit": ["test:build", "build", "karma:unit"],
		"test:unit:all": ["build", "karma:all"],
		"test:unit:chrome": ["build", "karma:chrome"],
		"test:unit:ff": ["build", "karma:ff"],
		"test:unit:ie": ["build", "karma:ie"],
		"test:unit:opera": ["build", "karma:opera"],
		"test:unit:safari": ["build", "karma:safari"],

		// End-to-End tests
		"test:e2e": ["test:build", "build", "test:e2e:phantomjs"],
		"test:e2e:chrome": ["build", "express:dev", "express:secondary", "protractor_webdriver", "protractor:chrome"],
		"test:e2e:debug": ["build", "test:build", "build:test", "express:dev", "express:secondary", "protractor_webdriver", "protractor:debug"],
		"test:e2e:phantomjs": ["build", "express:dev", "express:secondary", "protractor_webdriver", "protractor:phantomjs"],

		"test:doc": ["clean", "jsdoc", "express:doc", "watch:doc"],

		// SauceLabs tests
		"test:matrix": ["test:matrix:unit", "test:matrix:e2e"],
		"test:matrix:e2e": ["pages-builder", "saucelabs-mocha:e2e"],
		"test:matrix:e2e:debug": ["pages-builder", "saucelabs-mocha:e2e-debug"],
		"test:matrix:unit": ["saucelabs-mocha:unit"],
		"test:matrix:unit:debug": ["saucelabs-mocha:unit-debug"]
	};

	function isAlias(task) {
		return aliases[task] ? true : false;
	}

	// tasks that need to be run more than once (denoted by starting with !)
	var rerunTasks = {};

	function resolveAlias(task) {
		var tasks = aliases[task],
		    resolved = false;

		function checkDuplicates(insertableTask) {
			if (rerunTasks[insertableTask]) {
				// always return true for tasks that were marked as rerun
				return true;
			}

			return tasks.indexOf(insertableTask) === -1;
		}

		while (!resolved) {
			if (tasks.filter(isAlias).length === 0) {
				resolved = true;
			}

			for (var index = 0; index < tasks.length; index++) {
				// if the task starts with !, it should be run more than once
				if (tasks[index].startsWith("!")) {
					// trim back to the real name
					tasks[index] = tasks[index].substr(1);

					// keep track of this task
					rerunTasks[tasks[index]] = true;
				}

				if (isAlias(tasks[index])) {
					var aliasTask = tasks[index];
					var beforeTask = tasks.slice(0, index);
					var afterTask = tasks.slice(index + 1, tasks.length);
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

	// Don't re-generate Docs during test:debug builds running
	grunt.registerTask("test:debug:watch", function() {
		delete grunt.config.data.watch.doc;
		grunt.task.run("watch");
	});
};
