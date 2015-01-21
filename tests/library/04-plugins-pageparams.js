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

    describe("basic tests", function() {
        it("Should pass a basic test", function() {
            var test = this;
            test.run_assertions = function(vars, data) {
                this.beaconVars = vars;
                this.resume();
            };

            // 1. Define a global variable
            window.PageGroupVariable = "PageGroup";

            // 2. Tell PageParams to look for a basic JavaScript variable
            var o = BOOMR.init({
                autorun: false,
                PageParams: {
                    pageGroups: [
                        {
                            parameter1: "PageGroupVariable"
                        }
                    ],
                },
                log: null
            });

            // 3. Subscribe to the before_beacon method so we can tell if our params are available
            BOOMR.subscribe(
                "before_beacon",
                test.run_assertions,
                null,
                test
            );

            // 4. We'll now fire the page ready event so that boomerang runs the code
            BOOMR.page_ready();

            setTimeout(function() {
                assert.isTrue(BOOMR.plugins.PageParams.is_complete());

                assert.isTrue(test.beaconVars.hasOwnProperty("h.pg"));
                assert.strictEqual("PageGroup", test.beaconVars["h.pg"]);
            }, 1000);
        });
    });
});
