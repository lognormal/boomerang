/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/00-onload", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('onbeacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have fired onbeacon with a beacon payload", function() {
		// ensure the data was sent to 'onbeacon'
		assert.isObject(tf.lastBeaconData);
	});

	it("Should have set basic beacon properties", function() {
		assert.isString(tf.lastBeaconData.v);
	});

	it("Should have set dom.* properties", function() {
		assert.isNumber(tf.lastBeaconData["dom.img"], "dom.img");
		assert.isNumber(tf.lastBeaconData["dom.ln"], "dom.ln");
		assert.isNumber(tf.lastBeaconData["dom.script"], "dom.script");
		assert.isNumber(tf.lastBeaconData["dom.sz"], "dom.sz");

		if (BOOMR_test.isResourceTimingSupported()) {
			assert.isNumber(tf.lastBeaconData["dom.doms"], "dom.doms");
			assert.isNumber(tf.lastBeaconData["dom.res"], "dom.res");
		} else {
			assert.isUndefined(tf.lastBeaconData["dom.doms"], "dom.doms undefined");
			assert.isUndefined(tf.lastBeaconData["dom.res"], "dom.res undefined");
		}
	});

	it("Should have set mem.* properties", function() {
		var p = window.performance;
		var c = window.console;
		var m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

		if (m) {
			// they should exist
			assert.isNumber(tf.lastBeaconData["mem.total"], "mem.total");
			assert.isNumber(tf.lastBeaconData["mem.used"], "mem.used");
		} else {
			// they shouldn't exist, not supported by the Browser
			assert.isUndefined(tf.lastBeaconData["mem.total"], "mem.total undefined");
			assert.isUndefined(tf.lastBeaconData["mem.used"], "mem.total undefined");
		}
	});

	it("Should have set RT properties", function() {
		assert.isString(tf.lastBeaconData.r, "r");

		assert.isString(tf.lastBeaconData.u, "u");

		assert.isNumber(tf.lastBeaconData["rt.bstart"], "rt.bstart");
		assert.isNumber(tf.lastBeaconData["rt.end"], "rt.end");
		assert.isString(tf.lastBeaconData["rt.si"], "rt.si");
		assert.isNumber(tf.lastBeaconData["rt.sl"], "rt.sl");
		assert.isNumber(tf.lastBeaconData["rt.ss"], "rt.ss");
		assert.isString(tf.lastBeaconData["rt.start"], "rt.start");

		// optional
		if (typeof tf.lastBeaconData["rt.tstart"] !== "undefined") {
			assert.isNumber(tf.lastBeaconData["rt.tstart"], "rt.tstart");
		}
	});

	it("Should have set scr.* properties", function() {
		var s = window.screen;
		assert.isString(tf.lastBeaconData["scr.bpp"], "scr.bpp");
		assert.isString(tf.lastBeaconData["scr.xy"], "scr.xy");

		// only if we have orientation
		if(s && s.orientation) {
			assert.isString(tf.lastBeaconData["scr.orn"], "scr.orn");
		} else {
			assert.isUndefined(tf.lastBeaconData["scr.orn"], "scr.orn undefined");
		}

		// only if we have pixel ratio
		if(window.devicePixelRatio && window.devicePixelRatio > 1) {
			assert.isNumber(tf.lastBeaconData["scr.dpx"], "scr.dpx");
		} else {
			assert.isUndefined(tf.lastBeaconData["scr.dpx"], "scr.dpx undefined");
		}
	});

	it("Should have set LOGN / SOASTA properties", function() {
		assert.isString(tf.lastBeaconData["h.key"], "h.key");
	});

	it("Should have set vis.* properties", function() {
		assert.isString(tf.lastBeaconData["vis.st"], "vis.st");
	});
});
