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
          function test(href, expected)
          {
            anchor.href = href;
            assert.equal(
              BOOMR.plugins.AutoXHR.getPathname(anchor),
              expected);
          }

          test("path/file.js", "/unit/path/file.js");
          test("/path/file.js", "/path/file.js");
          test("//path/file.js", "/file.js");
          test("./path/file.js", "/unit/path/file.js");
          test("../path/file.js", "/path/file.js");
          test("#ref", "/unit/");
          test("?val=1", "/unit/");
          test("", "/unit/");
          test("../../../../file.js", "/file.js");
        });
    });
});
