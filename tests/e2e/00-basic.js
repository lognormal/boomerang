/*eslint-env mocha*/
/*global browser,expect*/

describe("BOOMR Basic Integration test", function() {
    it("Should pass the Mocha tests on the page", function() {
        browser.driver.get("http://localhost:4002/index.html");
        browser.driver.executeScript("return window.mocha_test_failures;").then(function(testFailures){
            expect(testFailures).toBe(0);
        });
    });
});
