/*eslint-env node*/
/*global jasmine*/
exports.config = {
	seleniumAddress: "http://localhost:4444/wd/hub",
	specs: ["e2e/e2e-debug.js"],
	baseUrl: "http://localhost:4002/",
	capabilities: {
		"browserName": "phantomjs",
		"phantomjs.binary.path": require("phantomjs").path
	},
	onPrepare: function() {
		// The require statement must be down here, since jasmine-reporters
		// needs jasmine to be in the global and protractor does not guarantee
		// this until inside the onPrepare function.
		require("jasmine-reporters");

		jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
	}
};
