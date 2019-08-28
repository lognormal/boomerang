/*eslint-env mocha,node*/
/*global browser,by*/

var chai = require("chai");
var assert = chai.assert;

describe("BOOMR Basic Integration test", function() {
	it("Should pass the Mocha unit tests", function(done) {
		browser.driver.get("http://localhost:4002/unit/index.html");

		browser.driver.wait(function() {
			return browser.driver.isElementPresent(by.css("#BOOMR_test_complete"));
		});

		browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete){
			assert.equal(complete, true, "BOOMR_test.isComplete()");
			browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures){
				// log testFailures only if they exist
				if (testFailures.length > 0) {
					console.log("BOOMR_test.getTestFailures():\n" + testFailures);
				}

				assert.equal(testFailures.length, 0);
				done();
			});
		});
	});
});
