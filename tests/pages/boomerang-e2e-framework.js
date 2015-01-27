/*eslint-env mocha*/
/*global _*/

(function(window) {
    "use strict";

    var t = {};

    var complete = false;
    var initialized = false;
    var testFailures = [];
    var testPasses = [];

    // test framework
    var expect;

    t.BEACON_URL = "/e2e/beacon-blackhole";

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
            } else if (window.document.attachEvent) {
                window.document.attachEvent("onBoomerangLoaded", function() {
                    t.init(config);
                });
            }

            return;
        }

        config = _.merge({}, t.CONFIG_DEFAULTS, config);

        // initialize boomerang
        BOOMR.init(config);

        // setup Mocha
        window.mocha.globals(["BOOMR", "PageGroupVariable"]);
        window.mocha.checkLeaks();

        // set globals
        window.assert = window.chai.assert;
        expect = window.expect = window.chai.expect;

        if (config.onBeacon) {
            BOOMR.subscribe("onbeacon", function() {
                // wait a few more ms so the beacon fires
                // TODO: Trim this timing down if we can make it more reliable
                setTimeout(t.runTests, 1000);
            });
        } else {
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

    t.validateBeaconWasImg = function() {
        // look for #beacon_form in the BOOMR window's IFRAME
        var form = BOOMR.boomerang_frame ? BOOMR.boomerang_frame.document.getElementById("beacon_form") : null;
        expect(form).to.equal(null);

        if (!t.isResourceTimingSupported()) {
            // can't also validate via RT
            return;
        }

        // RT validation
        var e = t.findResourceTimingBeacon();
        expect(e).to.not.equal(null);
        expect(e.initiatorType).to.equal("img");
        expect(e.name).to.contain("beacon-blackhole");
    };

    t.validateBeaconWasForm = function() {
        // look for #beacon_form in the BOOMR window's IFRAME
        var form = BOOMR.boomerang_frame ? BOOMR.boomerang_frame.document.getElementById("beacon_form") : null;
        expect(form).to.not.equal(null);
        expect(form.enctype).to.equal("application/x-www-form-urlencoded");
        expect(form.action).to.contain(t.BEACON_URL);

        if (!t.isResourceTimingSupported()) {
            // can't also validate via RT
            return;
        }

        // RT validation
        var e = t.findResourceTimingBeacon();
        if (e === null) {
            console.error("hi");
        }
        expect(e).to.not.equal(null);
        expect(e.initiatorType).to.equal("iframe");
        expect(e.name).to.contain(t.BEACON_URL);
    };

    window.BOOMR_test = t;

}(window));
