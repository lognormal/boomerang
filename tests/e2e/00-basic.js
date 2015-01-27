/*eslint-env mocha*/
/*global browser*/

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
                assert.equal(testFailures.length, 0, "BOOMR_test.getTestFailures(): " + JSON.stringify(testFailures));
                done();
            });
        });
    });
});
