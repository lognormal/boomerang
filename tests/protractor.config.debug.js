/*eslint-env node*/
exports.config = {
	seleniumAddress: "http://localhost:4444/wd/hub",
	specs: ["e2e-debug.js"],
	baseUrl: "http://localhost:4002/",
	capabilities: {
		"browserName": "phantomjs",
		"phantomjs.binary.path": require("phantomjs").path
	}
};
