/*eslint-env mocha,node*/
/*global browser,by*/

//
// Imports
//
var chai = require("chai");
var assert = chai.assert;

var tests = require("./e2e.json");
var disabledTests = require("./e2e.disabled.json");

//
// Functions
//
function run(path, file) {
	describe(path, function() {
		var fileName = file + ".html";
		it("Should pass " + path + "/" + fileName, function(done) {
			browser.driver.get("http://localhost:4002/pages/" + path + "/" + fileName);

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
