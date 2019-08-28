/*eslint-env mocha,node*/
/*global browser,by*/

//
// Imports
//
var chai = require("chai");
var assert = chai.assert;
var path = require("path");

var testsFile = path.join(__dirname, "e2e.json");
var tests = require(testsFile).tests;
var servers = require(testsFile).server;
var ports = require(testsFile).ports;

var disabledTests = require("./e2e.disabled.json");

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

			browser.driver.get("http://" + servers.main + ":" + ports.main + "/pages/" + testPath + "/" + fileName);

			browser.driver.wait(function() {
				return element(by.css("#BOOMR_test_complete")).isPresent();
			});

			browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete) {
				assert.equal(complete, true, "BOOMR_test.isComplete()");

				browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures) {
					if (testFailures.length > 0) {
						throw new Error(testFailures);
					}

					done();
				});
			});
		});
	});
}

var disabledTestLookup = {};
for (var i = 0; i < disabledTests.length; i++) {
	var key = disabledTests[i].path + "-" + disabledTests[i].file;
	disabledTestLookup[key] = 1;
}

//
// Run the tests in e2e.json
//
for (i = 0; i < tests.length; i++) {
	var data = tests[i];
	key = data.path + "-" + data.file;
	if (disabledTestLookup[key]) {
		continue;
	}

	run(data.path, data.file);
}
