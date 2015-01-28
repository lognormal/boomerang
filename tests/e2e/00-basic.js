/*eslint-env mocha,node*/
/*global browser,by*/

var chai = require("chai");
var assert = chai.assert;

describe("BOOMR Beacon Type", function() {
	it("Should pass 00-basic/00-onload", function(done) {
		browser.driver.get("http://localhost:4002/pages/00-basic/00-onload.html");

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

	it("Should pass 00-basic/01-onunload", function(done) {
		browser.driver.get("http://localhost:4002/pages/00-basic/01-onunload.html");

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
