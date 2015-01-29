exports.config = {
    seleniumAddress: "http://localhost:4444/wd/hub",
    specs: ["tests/e2e/*.js"],
    baseUrl: "http://localhost:4002/",
    capabilities: {
        "browserName": "phantomjs",
        "phantomjs.binary.path": require("phantomjs").path
    },
    onPrepare: function() {
        // The require statement must be down here, since jasmine-reporters
        // needs jasmine to be in the global and protractor does not guarantee
        // this until inside the onPrepare function.
        require('jasmine-reporters');

        var tapReporter = new jasmine.TapReporter({
            savePath: "tests/results/e2e.tap"
        });

        var junitReporter = new jasmine.JUnitXmlReporter("tests/results", false);

        jasmine.getEnv().addReporter(tapReporter);
        jasmine.getEnv().addReporter(junitReporter);
    },
};