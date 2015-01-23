exports.config = {
    seleniumAddress: "http://localhost:4444/wd/hub",
    specs: ["tests/e2e/*.js"],
    baseUrl: "http://localhost:4002/",
    capabilities: {
        "browserName": "phantomjs",
        "phantomjs.binary.path": require("phantomjs").path
    }
};