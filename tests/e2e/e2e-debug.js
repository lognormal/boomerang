/*eslint-env mocha,node*/
/*global browser,by*/

//
// Imports
//
var fs = require("fs");
var chai = require("chai");
var assert = chai.assert;
var path = require("path");

var testsFile = path.join(__dirname, "e2e-debug.json");

var tests = [];

if (fs.existsSync(testsFile)) {
	tests = require(testsFile);
}

var i;

//
// Functions
//
function run(testPath, file) {
	describe(testPath, function() {
		var fileName = file + ".html";
		it("Should pass " + testPath + "/" + fileName, function(done) {
			var logCount = 0;

			browser.driver.get("http://localhost:4002/pages/" + testPath + "/" + fileName);

			setInterval(function() {
				browser.manage().logs().get("browser").then(function(browserLog) {
					if (browserLog.length > logCount) {
						for (i = logCount; i < browserLog.length; i++) {
							var log = browserLog[i];
							console.log("[" + new Date(log.timestamp).toLocaleTimeString() + "] " + log.message);
						}

						logCount = browserLog.length;
					}
				});
			}, 1000);

			browser.driver.wait(function() {
				return browser.driver.isElementPresent(by.css("#BOOMR_test_complete"));
			});

			browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete){
				assert.equal(complete, true, "BOOMR_test.isComplete()");
				browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures){
					if (testFailures.length > 0) {
						throw new Error(testFailures);
					}

					done();
				});
			});
		});
	});
}

// NOTE: To use this, create a file e2e-debug.json (in this directory), the same format
// as e2e.json for the tests you want to run

//
// Run the tests in e2e-debug.json
//
for (i = 0; i < tests.length; i++) {
	var data = tests[i];

	console.log("Running " + data.path + "/" + data.file);

	run(data.path, data.file);
}
