/* eslint-env node */

"use strict";
module.exports = function (grunt) {
    var src = [ "boomerang.js" ];
    var plugins = grunt.file.readJSON("plugins.json");
    src.push(plugins.plugins);
    src.push("plugins/zzz_last_plugin.js");

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
                "plugins/*.js"
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
                            pattern: /BOOMR.version\s*=\s*".*";/,
                            replacement: "BOOMR.version = \"<%= pkg.releaseVersion %>.<%= buildDate %>\";"
                        },
                        {
                            pattern: /BOOMR\s*=\s*BOOMR\s*\|\|\s*{};/g,
                            replacement: ""
                        },
                        {
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
            latest: {
                files: [
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js", 
                        dest: "build/<%= pkg.name %>-latest-debug.js", 
                    },
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.min.js", 
                        dest: "build/<%= pkg.name %>-latest-debug.min.js", 
                    },
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.min.js.map", 
                        dest: "build/<%= pkg.name %>-latest-debug.min.js.map", 
                    },
                ]
            }
        },
        uglify: {
            options : {
                preserveComments: false,
                mangle: false,
                sourceMap: true
            },
            min_release: {
                report: "gzip",
                src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js",
                dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.min.js"
            },
            min_debug: {
                report: "gzip",
                src: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.js",
                dest: "build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>-debug.min.js"
            }
        },
        clean: {
            options: {},
            build: ["build/"],
            src: ["plugins/*~", "*.js~"]
        },
        karma: {
            options: {
            configFile: "./karma.config.js",
            preprocessors: {
                "./build/*.js": ["coverage"],
            },
            basePath: "./",
            files: [
                "tests/vendor/mocha/mocha.css",
                "tests/vendor/mocha/mocha.js",
                "tests/vendor/chai/chai.js",
                "tests/vendor/expect/index.js",
                "tests/library/*.js",
                "./build/<%= pkg.name %>-<%= pkg.releaseVersion %>.<%= buildDate %>.js"
            ]
            },
            unit: { 
                singleRun: true,
                colors: true,
                browsers: ["PhantomJS"]
            },
            dev: { 
                singleRun: true,
                colors: true,
                browsers: ["Chrome", "Firefox", "IE", "Opera", "Safari"]
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

    grunt.registerTask("lint", "eslint");
    grunt.registerTask("build", ["concat", "string-replace", "uglify", "copy:latest"]);
    grunt.registerTask("test", ["build", "karma:unit"]);
    grunt.registerTask("test:dev", ["build", "karma:dev"]);
    grunt.registerTask("default", ["lint", "build", "test"]);
};
