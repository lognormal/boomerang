/* eslint-env node */
"use strict";

var fs = require("fs");
var path = require("path");
var fse = require("fs-extra");

module.exports = function (grunt) {
    // boomerang.js and plugins/*.js order
    var src = [ "boomerang.js" ];
    var plugins = grunt.file.readJSON("plugins.json");
    src.push(plugins.plugins);
    src.push("plugins/zzz_last_plugin.js");

    // ensure env.json exists
    var envFile = path.resolve(path.join(__dirname, "tests", "server", "env.json"));
    if (!fs.existsSync(envFile)) {
        var envFileSample = path.resolve(path.join(__dirname, "tests", "server", "env.json.sample"));
        console.info("Creating env.json from defaults");
        fse.copySync(envFileSample, envFile);
    }

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
                "plugins/*.js",
                "tests/unit/*.js",
                "tests/e2e/*.js",
                "tests/server/*.js",
                "tests/pages/**/*.js"
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
            // copy files to tests\build\boomerang-latest.js so test/index.html points to the latest version always
            latest: {
                files: [
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
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
            options: {
                preserveComments: false,
                mangle: true,
                sourceMap: true
            },
            min_release: {
                src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js",
                dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.min.js"
            },
            min_debug: {
                src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
                dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.min.js"
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
            }
        },
        filesize: {
            files: [ "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.min.js.gz" ]
        },
        clean: {
            options: {},
            build: ["build/*", "tests/build/*", "tests/results/*.tap", "tests/results/*.xml", "tests/coverage/*"],
            src: ["plugins/*~", "*.js~"]
        },
        karma: {
            options: {
                singleRun: true,
                colors: true,
                configFile: "./karma.config.js",
                preprocessors: {
                    "./tests/build/*.js": ["coverage"]
                },
                basePath: "./",
                files: [
                    "tests/vendor/mocha/mocha.css",
                    "tests/vendor/mocha/mocha.js",
                    "tests/vendor/node-assert/assert.js",
                    "tests/vendor/assertive-chai/assertive-chai.js",
                    "tests/vendor/lodash/lodash.js",
                    "tests/unit/*.js",
                    "tests/build/*.js"
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
                keepAlive: true
            },
            phantomjs: {
                configFile: "protractor.config.phantom.js"
            },
            chrome: {
                configFile: "protractor.config.chrome.js"
            }
        },
        protractor_webdriver: {
            options: {
                keepAlive: true
            },
            e2e: {
            }
        },
        connect: {
            options: {
                port: 4002,
                hostname: "localhost"
            },
            test: {
                options: {
                    base: ["tests"]
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-string-replace");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-filesize");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-protractor-runner");
    grunt.loadNpmTasks("grunt-protractor-webdriver");

    grunt.registerTask("lint", "eslint");
    grunt.registerTask("build", ["concat", "string-replace", "uglify", "compress", "copy:latest", "filesize"]);

    grunt.registerTask("test", ["test:unit", "test:e2e"]);
    grunt.registerTask("test:unit", ["build", "karma:unit"]);
    grunt.registerTask("test:e2e", ["test:e2e:phantomjs"]);
    grunt.registerTask("test:e2e:chrome", ["test:e2e:chrome"]);

    grunt.registerTask("test:e2e:debug", ["build", "connect::keepalive"]);

    grunt.registerTask("test:unit:all", ["build", "karma:all"]);
    grunt.registerTask("test:unit:chrome", ["build", "karma:chrome"]);
    grunt.registerTask("test:unit:ie", ["build", "karma:ie"]);
    grunt.registerTask("test:unit:ff", ["build", "karma:ff"]);
    grunt.registerTask("test:unit:opera", ["build", "karma:opera"]);
    grunt.registerTask("test:unit:safari", ["build", "karma:safari"]);

    grunt.registerTask("test:e2e:phantomjs", ["build", "connect:test", "protractor_webdriver", "protractor:phantomjs"]);
    grunt.registerTask("test:e2e:chrome", ["build", "connect:test", "protractor_webdriver", "protractor:chrome"]);

    grunt.registerTask("webserver:build", ["build", "copy:webserver"]);

    grunt.registerTask("default", ["lint", "test"]);
};
