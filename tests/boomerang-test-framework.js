/*eslint-env mocha*/
/*global _*/

//
// BOOMR.plugins.TestFramework
//
(function(window) {

    // set our namespace
    var BOOMR = window.BOOMR = window.BOOMR || {};
    BOOMR.plugins = BOOMR.plugins || {};
    if (BOOMR.plugins.TestFramework) {
        return;
    }

    BOOMR.plugins.TestFramework = {
        initialized: false,
        fired_page_ready: false,
        fired_onbeacon: false,
        fired_before_unload: false,
        beacons: [],
        page_ready: function() {
            this.fired_page_ready = true;
        },
        onbeacon: function(data) {
            this.beacons.push(_.clone(data));
            this.fired_onbeacon = true;
        },
        lastBeacon: function() {
            if (this.beacons.length === 0) {
                return false;
            }

            return this.beacons[this.beacons.length - 1];
        },
        before_unload: function() {
            this.fired_before_unload = true;
        },
        init: function() {
            if (this.initialized) {
                return this;
            }

            BOOMR.subscribe("page_ready", this.page_ready, null, this);
            BOOMR.subscribe("onbeacon", this.onbeacon, null, this);
            BOOMR.subscribe("before_unload", this.before_unload, null, this);

            this.initialized = true;

            return this;
        },
        is_complete: function() {
            return true;
        }
    };
})(window);

//
// BOOMR_test
//
(function(window) {
    "use strict";

    var t = {};

    var complete = false;
    var initialized = false;
    var testFailures = [];
    var testPasses = [];

    var beaconsSeen = 0;

    // test framework
    var assert;

    //
    // Constants
    //
    t.BEACON_URL = "/e2e/beacon-blackhole";
    t.MAX_RESOURCE_WAIT = 500;

    //
    // Exports
    //
    t.isComplete = function() {
        return complete;
    };

    t.isInitialized = function() {
        return initialized;
    };

    t.getTestFailures = function() {
        return complete ? testFailures : [];
    };

    t.getTestFailureMessages = function() {
        if (!complete) {
            return [];
        }

        var messages = [];
        for (var i = 0; i < testFailures.length; i++) {
            messages.push({
                title: testFailures[i].test.title,
                name: testFailures[i].err.name,
                message: testFailures[i].err.message
            });
        }

        return messages;
    };

    t.getTestPasses = function() {
        return complete ? testPasses: [];
    };

    t.CONFIG_DEFAULTS = {
        beacon_url: t.BEACON_URL,
        ResourceTiming: {
            enabled: false
        }
    };

    t.runTests = function() {
        window.mocha.run(function(){
            complete = true;

            // convenient way for selenium to wait
            var competeDiv = document.createElement("div");
            competeDiv.id = "BOOMR_test_complete";
            document.body.appendChild(competeDiv);
        })
        .on("pass", function(test){
            testPasses.push({
                test: test
            });
        }).on("fail", function(test, err){
            testFailures.push({
                test: test,
                err: err
            });
        });
    };

    t.init = function(config) {
        if (initialized) {
            return;
        }

        if (!window.BOOMR || !window.BOOMR.version) {
            if (window.document.addEventListener) {
                window.document.addEventListener("onBoomerangLoaded", function() {
                    t.init(config);
                });
            }
            else if (window.document.attachEvent) {
                window.document.attachEvent("onBoomerangLoaded", function() {
                    t.init(config);
                });
            }

            return;
        }

        config = _.merge({}, t.CONFIG_DEFAULTS, config);

        // initialize boomerang
        BOOMR.init(config);

        // fake session details so beacons send
        BOOMR.addVar({
            "h.key": "aaaaa-bbbbb-ccccc-ddddd-eeeee",
            "h.d": "localhost",
            "h.t": new Date().getTime(),
            "h.cr": "abc"
        });

        // setup Mocha
        window.mocha.globals(["BOOMR", "PageGroupVariable"]);
        window.mocha.checkLeaks();

        // set globals
        assert = window.assert = window.chai.assert;

        if (config.testAfterOnBeacon) {
            // default to waiting until one beacon was sent, otherwise use
            // the number passed in
            if (typeof config.testAfterOnBeacon !== "number") {
                config.testAfterOnBeacon = 1;
            }

            BOOMR.subscribe("onbeacon", function() {
                if (++beaconsSeen === config.testAfterOnBeacon) {
                    // wait a few more ms so the beacon fires
                    // TODO: Trim this timing down if we can make it more reliable
                    setTimeout(t.runTests, 1000);
                }
            });
        }
        else {
            BOOMR.setImmediate(t.runTests);
        }

        initialized = true;
    };

    t.findResourceTimingBeacon = function() {
        if (!t.isResourceTimingSupported()) {
            return null;
        }

        var entries = BOOMR.window.performance.getEntriesByType("resource");
        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (e.name && e.name.indexOf(t.BEACON_URL) !== -1) {
                return e;
            }
        }

        return null;
    };

    t.isResourceTimingSupported = function() {
        return (window.performance && typeof window.performance.getEntriesByType === "function");
    };

    t.validateBeaconWasImg = function(done) {
        // look for #beacon_form in the BOOMR window's IFRAME
        var form = BOOMR.boomerang_frame ? BOOMR.boomerang_frame.document.getElementById("beacon_form") : null;
        assert.isNull(form);

        if (!t.isResourceTimingSupported()) {
            // can't also validate via RT
            return done();
        }

        done();
    };

    t.validateBeaconWasForm = function(done) {
        // look for #beacon_form in the BOOMR window's IFRAME
        var form = BOOMR.boomerang_frame ? BOOMR.boomerang_frame.document.getElementById("beacon_form") : null;
        assert.isNotNull(form);
        assert.equal(form.enctype, "application/x-www-form-urlencoded");
        assert.include(form.action, t.BEACON_URL);

        done();
    };

    t.validateBeaconWasSent = function(done) {
        var tf = BOOMR.plugins.TestFramework;

        // ensure we fired a beacon ('onbeacon')
        assert.isTrue(tf.fired_onbeacon);

        // ensure the data was sent to 'onbeacon'
        assert.isObject(tf.lastBeacon());

        // ensure the beacon has basic properties
        assert.isString(tf.lastBeacon().v);

        done();
    };

    t.canSetCookies = function() {
        var testCookieName = "test_cookie";

        // set a cookie
        document.cookie = [testCookieName + "=true", "path=/", "domain=" + location.hostname].join("; ");

        // determine if it was set OK
        return (" " + document.cookie + ";").indexOf(" " + testCookieName + "=") !== -1;
    };

    window.BOOMR_test = t;

}(window));
