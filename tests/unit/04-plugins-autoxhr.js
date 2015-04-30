/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.AutoXHR", function() {
    var assert = chai.assert;

    describe("exports", function() {
        it("Should have a getPathname() function", function() {
            assert.isFunction(BOOMR.plugins.AutoXHR.getPathname);
        });

        function test(href, expected) {
            var anchor = document.createElement("a");
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

        it("getPathname test - path/file.js", function() {
            test("path/file.js", shortPathName + "path/file.js");
        });

        it("getPathname test - /path/file.js", function() {
            test("/path/file.js", "/path/file.js");
        });

        it("getPathname test - //path/file.js", function() {
            test("//path/file.js", "/file.js");
        });

        it("getPathname test - ./path/file.js", function() {
            test("./path/file.js", shortPathName + "path/file.js");
        });

        it("getPathname test - ../path/file.js", function() {
            test("../path/file.js", "/path/file.js");
        });

        it("getPathname test - #ref", function() {
            test("#ref", pathName);
        });

        it("getPathname test - ?val=1", function() {
            test("?val=1", pathName);
        });

        it("getPathname test - (empty string))", function() {
            test("", pathName);
        });

        it("getPathname test - ../../../../file.js", function() {
            test("../../../../file.js", "/file.js");
        });
    });
});
