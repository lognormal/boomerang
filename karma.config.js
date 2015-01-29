module.exports = function(config) {
    config.set({
        basePath: "./",

        port: 4000,
        runnerPort: 4001,
        logLevel: config.LOG_INFO,

        colors: true,
        autoWatch: false,

        frameworks: ["mocha"],
        reporters: ["progress", "coverage", "tap"],
        browsers: ["PhantomJS"],

        coverageReporter: {
            type: "html",
            dir: "tests/coverage/"
        },

        tapReporter: {
            outputFile: 'tests/results/unit.tap'
        }
    });
};
