/*eslint-env mocha,node*/
/*global browser,by*/

var chai = require("chai");
var expect = chai.expect;

describe("BOOMR Beacon Type", function() {
    it("Should pass 01-beacon-type/01-resourcetiming-disabled", function(done) {
        browser.driver.get("http://localhost:4002/pages/01-beacon-type/01-resourcetiming-disabled.html");

        browser.driver.wait(function() {
            return browser.driver.isElementPresent(by.css("#BOOMR_test_complete"));
        });

        browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete){
            expect(complete).to.be.equal(true, "BOOMR_test.isComplete()");
            browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures){
                expect(testFailures.length).to.be.equal(0, "BOOMR_test.getTestFailures(): " + JSON.stringify(testFailures));
                done();
            });
        });
    });

    it("Should pass 01-beacon-type/01-resourcetiming-enabled-browser-supports", function(done) {
        browser.driver.get("http://localhost:4002/pages/01-beacon-type/01-resourcetiming-enabled-browser-supports.html");

        browser.driver.wait(function() {
            return browser.driver.isElementPresent(by.css("#BOOMR_test_complete"));
        });

        browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete){
            expect(complete).to.be.equal(true, "BOOMR_test.isComplete()");
            browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures){
                expect(testFailures.length).to.be.equal(0, "BOOMR_test.getTestFailures(): " + JSON.stringify(testFailures));
                done();
            });
        });
    });

    it("Should pass 01-beacon-type/01-resourcetiming-enabled-browser-unsupported", function(done) {
        browser.driver.get("http://localhost:4002/pages/01-beacon-type/01-resourcetiming-enabled-browser-unsupported.html");

        browser.driver.wait(function() {
            return browser.driver.isElementPresent(by.css("#BOOMR_test_complete"));
        });

        browser.driver.executeScript("return BOOMR_test.isComplete()").then(function(complete){
            expect(complete).to.be.equal(true, "BOOMR_test.isComplete()");
            browser.driver.executeScript("return BOOMR_test.getTestFailureMessages()").then(function(testFailures){
                expect(testFailures.length).to.be.equal(0, "BOOMR_test.getTestFailures(): " + JSON.stringify(testFailures));
                done();
            });
        });
    });
});
