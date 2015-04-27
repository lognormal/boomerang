/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.AutoXHR", function() {
    var assert = chai.assert;

    describe("exports", function() {
        it("Should have a getPathname() function", function() {
            assert.isFunction(BOOMR.plugins.AutoXHR.getPathname);
        });

        var anchor = document.createElement("a");
        function test(href, expected) {
            anchor.href = href;
            assert.equal(
                BOOMR.plugins.AutoXHR.getPathname(anchor),
                expected);
        }

        var pathName = window.location.pathname, shortPathName = pathName;
        if (pathName === "/context.html" || //unit tests (local)
            pathName === "/unit/index.html") { //unit tests (build)
            shortPathName = "/";
        }

        it("getPathname test - A", function() {
            test("path/file.js", shortPathName + "path/file.js");
        });

        it("getPathname test - B", function() {
            test("path/file.js", shortPathName + "path/file.js");
        });

        it("getPathname test - C", function() {
            test("/path/file.js", "/path/file.js");
        });

        it("getPathname test - D", function() {
            test("//path/file.js", "/file.js");
        });

        it("getPathname test - E", function() {
            test("./path/file.js", shortPathName + "path/file.js");
        });

        it("getPathname test - F", function() {
            test("../path/file.js", "/path/file.js");
        });

        it("getPathname test - G", function() {
            test("#ref", pathName);
        });

        it("getPathname test - H", function() {
            test("?val=1", pathName);
        });

        it("getPathname test - I", function() {
            test("", pathName);
        });

        it("getPathname test - J", function() {
            test("../../../../file.js", "/file.js");
        });
    });
});
