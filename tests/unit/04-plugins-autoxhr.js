/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.AutoXHR", function() {
    var assert = chai.assert;

    describe("exports", function() {
        it("Should have a getPathname() function", function() {
            assert.isFunction(BOOMR.plugins.AutoXHR.getPathname);
        });

        it("getPathname test", function() {
            var anchor = document.createElement("a");
            function test(href, expected) {
                anchor.href = href;
                assert.equal(
                    BOOMR.plugins.AutoXHR.getPathname(anchor),
                    expected);
            }

            var pathName = window.location.pathname, shortPathName = pathName;
            if (pathName === "/context.html") { //unit tests
                shortPathName = "/";
            }

            test("path/file.js", shortPathName + "path/file.js");
            test("/path/file.js", "/path/file.js");
            test("//path/file.js", "/file.js");
            test("./path/file.js", shortPathName + "path/file.js");
            test("../path/file.js", "/path/file.js");
            test("#ref", pathName);
            test("?val=1", pathName);
            test("", pathName);
            test("../../../../file.js", "/file.js");
        });
    });
});
