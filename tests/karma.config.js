/*eslint-env node*/

var url = require("url");

module.exports = function(config) {
	var remoteSelenium = false, u, webdriverConfig;
	if (config.SELENIUM_ADDRESS) {
		remoteSelenium = true;
		u = url.parse(config.SELENIUM_ADDRESS, true);
		webdriverConfig = {
			hostname: u.hostname,
			port: u.port
		};
	}

	config.set({
		basePath: "./",

		port: 4000,

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
			"karma-mocha-reporter"
		],

		coverageReporter: {
			type: "html",
			dir: "coverage/"
		},

		tapReporter: {
			outputFile: "results/unit.tap"
		}
	});

	if (!remoteSelenium) {
		config.runnerPort = 4001;

		// launchers
		config.plugins.push(
			"karma-chrome-launcher",
			"karma-firefox-launcher",
			"karma-ie-launcher",
			"karma-opera-launcher",
			"karma-safari-launcher");
	}
	else {
		// launchers
		config.plugins.push("karma-webdriver-launcher");

		config.set({
			customLaunchers: {
				"ChromeHeadless": {
					base: "WebDriver",
					config: webdriverConfig,
					browserName: "chrome",
					flags: ["--headless", "--disable-gpu", "--window-size=1024,768"],
					platform: "ANY",
					version: "ANY"
				},
				"FirefoxHeadless": {
					base: "WebDriver",
					config: webdriverConfig,
					browserName: "firefox",
					flags: ["--headless"],
					platform: "ANY",
					version: "ANY"
				},
				"PhantomJS": {
					base: "WebDriver",
					config: webdriverConfig,
					browserName: "phantomjs",
					flags: [],
					platform: "ANY",
					version: "ANY"
				}
			},

			browsers: ["ChromeHeadless", "FirefoxHeadless", "PhantomJS"]
		});
	}
};
