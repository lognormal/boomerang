/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.PageParams", function() {
    var assert = chai.assert;

    describe("exports", function() {
        it("Should have a PageParams object", function() {
            assert.isObject(BOOMR.plugins.PageParams);
        });

        it("Should have a is_complete() function", function() {
            assert.isFunction(BOOMR.plugins.PageParams.is_complete);
        });

        it("Should be complete at this point", function() {
            assert.isTrue(BOOMR.plugins.PageParams.is_complete());
        });
    });
});
