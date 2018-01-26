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

			// reporters
			"karma-tap-reporter",
			"karma-mocha-reporter",

			// launchers
			"karma-chrome-launcher",
			"karma-firefox-launcher",
			"karma-ie-launcher",
			"karma-opera-launcher",
			"karma-phantomjs-launcher",
			"karma-safari-launcher"
		],

		coverageReporter: {
			type: "html",
			dir: "coverage/"
		},

		tapReporter: {
			outputFile: "results/unit.tap"
		}
	});
};
