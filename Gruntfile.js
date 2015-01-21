/* eslint-env node */

"use strict";
module.exports = function (grunt) {
    var src = [ "boomerang.js" ];
    var plugins = grunt.file.readJSON("plugins.json");
    src.push(plugins.plugins);
    src.push("plugins/zzz_last_plugin.js");

    grunt.initConfig({
        pkg:  grunt.file.readJSON("package.json"),
        builddate: Date.now(),
        concat: {
            options: {
                stripBanners: {
                    block : true,
                    line: true
                },
                seperator: ";"
            },
            debug: {
                src: src,
                dest: "build/<%= pkg.name %>-<%= builddate %>-debug.js"
            },
            release: {
                src: src,
                dest: "build/<%= pkg.name %>-<%= builddate %>.js"
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
            release: {
            files: [{
                src: "build/<%= pkg.name %>-<%= builddate %>.js",
                dest: "build/<%= pkg.name %>-<%= builddate %>.js"
            }],
            options: {
                replacements: [{
                    pattern: /else{}/g,
                    replacement: ""
                },{
                    pattern: /\(window\)\);/g,
                    replacement: "\(window\)\);\n"
                },{
                    pattern: /\(\)\);\(function\(/g,
                    replacement: "\(\)\);\n(function("
                }]
            }
            }
        },
        copy: {
            latest: {
                files: [
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= builddate %>-debug.js", 
                        dest: "build/<%= pkg.name %>-latest-debug.js", 
                    },
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= builddate %>-debug.min.js", 
                        dest: "build/<%= pkg.name %>-latest-debug.min.js", 
                    },
                    {
                        nonull: true,
                        src: "build/<%= pkg.name %>-<%= builddate %>-debug.min.js.map", 
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
                src: "build/<%= pkg.name %>-<%= builddate %>.js",
                dest: "build/<%= pkg.name %>-<%= builddate %>.min.js"
            },
            min_debug: {
                report: "gzip",
                src: "build/<%= pkg.name %>-<%= builddate %>-debug.js",
                dest: "build/<%= pkg.name %>-<%= builddate %>-debug.min.js"
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
                "./build/<%= pkg.name %>-<%= builddate %>.js"
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
