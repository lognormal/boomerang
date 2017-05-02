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
		assert.isObject(tf.lastBeacon());
	});

	it("Should have set basic beacon properties", function() {
		assert.isString(tf.lastBeacon().v);
	});

	it("Should have set dom.* properties", function() {
		assert.isNumber(tf.lastBeacon()["dom.img"], "dom.img");
		assert.isNumber(tf.lastBeacon()["dom.ln"], "dom.ln");
		assert.isNumber(tf.lastBeacon()["dom.script"], "dom.script");
		assert.isNumber(tf.lastBeacon()["dom.sz"], "dom.sz");

		if (BOOMR_test.isResourceTimingSupported()) {
			assert.isNumber(tf.lastBeacon()["dom.doms"], "dom.doms");
			assert.isNumber(tf.lastBeacon()["dom.res"], "dom.res");
		}
	});

	it("Should have set mem.* properties", function() {
		if ((window.performance && window.performance.memory) ||
			(window.console && window.console.memory)) {
			assert.isNumber(tf.lastBeacon()["mem.total"], "mem.total");
			assert.isNumber(tf.lastBeacon()["mem.used"], "mem.used");

			// Might not exist except recent builds
			if (tf.lastBeacon()["mem.limit"]) {
				assert.isNumber(tf.lastBeacon()["mem.limit"], "mem.limit");
			}
		}
	});

	it("Should have set RT properties", function() {
		assert.isString(tf.lastBeacon().u, "u");

		assert.isNumber(tf.lastBeacon()["rt.bstart"], "rt.bstart");
		assert.isNumber(tf.lastBeacon()["rt.end"], "rt.end");
		assert.isString(tf.lastBeacon()["rt.start"], "rt.start");

		// optional
		if (typeof tf.lastBeacon()["rt.tstart"] !== "undefined") {
			assert.isNumber(tf.lastBeacon()["rt.tstart"], "rt.tstart");
		}
	});

	it("Should have set scr.* properties", function() {
		var s = window.screen;
		assert.isString(tf.lastBeacon()["scr.bpp"], "scr.bpp");
		assert.isString(tf.lastBeacon()["scr.xy"], "scr.xy");

		// only if we have orientation
		if (s && s.orientation) {
			assert.isString(tf.lastBeacon()["scr.orn"], "scr.orn");
		}

		// only if we have pixel ratio
		if (window.devicePixelRatio && window.devicePixelRatio > 1) {
			assert.isNumber(tf.lastBeacon()["scr.dpx"], "scr.dpx");
		}
	});

	it("Should have set LOGN / SOASTA properties", function() {
		assert.isString(tf.lastBeacon()["h.key"], "h.key");
	});

	it("Should have set vis.* properties", function() {
		assert.isString(tf.lastBeacon()["vis.st"], "vis.st");
	});

	it("Should have set Page ID (pid)", function() {
		assert.isString(tf.lastBeacon().pid, "pid");
	});
});
