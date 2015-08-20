/*eslint-env node*/
exports.config = {
	seleniumAddress: "http://localhost:4444/wd/hub",
	specs: ["e2e/*.js"],
	baseUrl: "http://localhost:4002/"
};
