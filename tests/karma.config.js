/*eslint-env node*/
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
		plugins: [
			"karma-coverage",
			"karma-mocha",
			"karma-tap-reporter",
			"karma-mocha-reporter",
			"karma-phantomjs-launcher"
		],
		browsers: ["PhantomJS"],

		coverageReporter: {
			type: "html",
			dir: "coverage/"
		},

		tapReporter: {
			outputFile: "results/unit.tap"
		}
	});
};
