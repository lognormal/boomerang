/*eslint-env mocha,node*/
/*global browser,by*/

//
// Imports
//
var chai = require("chai");
var assert = chai.assert;
var path = require("path");

var testsFile = path.join(__dirname, "e2e-debug.json");
var tests = require(testsFile).tests;
var servers = require(testsFile).server;
var ports = require(testsFile).ports;

//
// Functions
//
function run(testPath, file) {
	describe(testPath, function() {
		var fileName = file + ".html";

		it("Should pass " + testPath + "/" + fileName, function(done) {
			if (typeof browser.waitForAngularEnabled === "function") {
				browser.waitForAngularEnabled(false);
			}

			console.log(
				"Navigating to",
				"http://" + servers.main + ":" + ports.main + "/pages/" + testPath + "/" + fileName
			);

			browser.driver.executeScript("return navigator.userAgent;").then(function(ua) {
				console.log("User-Agent:", ua);
			});

			browser.driver.get("http://" + servers.main + ":" + ports.main + "/pages/" + testPath + "/" + fileName);

			// poll every 100ms for new logs or the test framework to note we're complete
			(function poll() {
				// get browser logs
				browser.manage().logs().get("browser").then(function(browserLog) {
					browserLog.forEach(function(log) {
						console.log("[" + new Date(log.timestamp).toLocaleTimeString() + "] " + log.message);
					});
				});

				// check if our element is there
				browser.isElementPresent(by.css("#BOOMR_test_complete"))
					.then(function(present) {
						if (!present) {
							setTimeout(poll, 100);

							return;
						}

						// get error messages
						browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete) {
							assert.equal(complete, true, "BOOMR_test.isComplete()");

							console.log("Navigation complete");

							browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures) {
								if (testFailures.length > 0) {
									throw new Error(testFailures);
								}

								done();
							});
						});
					});
			})();
		});
	});
}

// NOTE: To use this, create a file e2e-debug.json (in this directory), the same format
// as e2e.json for the tests you want to run

//
// Run the tests in e2e-debug.json
//
for (var i = 0; i < tests.length; i++) {
	var data = tests[i];

	console.log("Running " + data.path + "/" + data.file);

	run(data.path, data.file);
}
