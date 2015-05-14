/*eslint-env mocha,node*/
/*global browser,by*/

//
// Imports
//
var chai = require("chai");
var assert = chai.assert;

var tests = require("./e2e.json");

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
					assert.equal(testFailures.length, 0, "BOOMR_test.getTestFailures(): " + JSON.stringify(testFailures));
					done();
				});
			});
		});
	});
}

//
// Run the tests in e2e.json
//
for (var i = 0; i < tests.length; i++) {
	var data = tests[i];
	run(data.path, data.file);
}
