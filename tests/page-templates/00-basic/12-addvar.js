/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/12-addvar", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	function getBeaconDataByName(name, url) {
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
		var results = regex.exec(url);

		if (!results) {
			return;
		}

		if (!results[2]) {
			return "";
		}

		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	function getBeaconData(n, param) {
		// get all ResourceTiming entries
		var entries = window.performance.getEntriesByType("resource");

		// filter to just beacons
		entries = BOOMR.utils.arrayFilter(entries, function(e) {
			return e.name.indexOf(BOOMR_test.BEACON_URL) !== -1;
		});

		if (!entries[n]) {
			return;
		}

		return getBeaconDataByName(param, entries[n].name);
	}

	it("Should have sent 3 beacons", function(done) {
		t.ensureBeaconCount(done, 3);
	});

	//
	// Tests of impl.vars (internal data)
	//
	describe("impl.vars data", function() {
		it("Should have added var1 = 1 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var1, 1);
			}
		});

		it("Should have added var2 = abc to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var2, "abc");
			}
		});

		it("Should have added var3 = 10 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var3, 0);
			}
		});

		it("Should have added var4 = undefined to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.isUndefined(b.var4);
			}
		});

		it("Should have added var5 = undefined to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.isUndefined(b.var5, "");
			}
		});

		it("Should have added var6 = null to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var6, null);
			}
		});

		it("Should have added var7 = '' to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var7, "");
			}
		});

		it("Should have added var8 = { a: 1 } to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.deepEqual(b.var8, { a: 1});
			}
		});

		it("Should have added var9 = 1.1111111 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var9, 1.1111111);
			}
		});

		it("Should have added var10 = 2 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var10, 2);
			}
		});

		it("Should have added var11 = single on the first beacon", function() {
			var b = tf.beacons[0];
			assert.strictEqual(b.var11, "single");
		});

		it("Should not have added var11 = single on the second beacon", function() {
			var b = tf.beacons[1];
			assert.isUndefined(b.var11);
		});

		it("Should not have added var11 = single on the third beacon", function() {
			var b = tf.beacons[1];
			assert.isUndefined(b.var11);
		});

		it("Should not have added var12 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.isUndefined(b.var12);
			}
		});

		it("Should have added var13 = 1 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var13, 1);
			}
		});

		it("Should have added var14 = 2 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.strictEqual(b.var14, 2);
			}
		});

		it("Should not have added var15 to impl.vars on all beacons", function() {
			for (var i = 0; i < tf.beacons.length; i++) {
				var b = tf.beacons[i];
				assert.isUndefined(b.var15);
			}
		});
	});

	//
	// Tests of what strings end up on the beacon URL
	//
	describe("Beacon URL data", function() {
		it("Should have set var1 = 1 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var1"), "1");
			}
		});

		it("Should have set var2 = abc in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var2"), "abc");
			}
		});

		it("Should have set var3 = 10 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var3"), "0");
			}
		});

		it("Should have set var4 = '' in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var4"), "");
			}
		});

		it("Should have set var5 = '' in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var5"), "");
			}
		});

		it("Should have set var6 = '' in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var6"), "");
			}
		});

		it("Should have set var7 = '' in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var7"), "");
			}
		});

		it("Should have set var8 = ~(a~1) in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var8"), "~(a~1)");
			}
		});

		it("Should have set var9 = 1.1111111 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var9"), "1.1111111");
			}
		});

		it("Should have set var10 = 2 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var10"), "2");
			}
		});

		it("Should have set var11 = single on the first beacon", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			assert.strictEqual(getBeaconData(0, "var11"), "single");
		});

		it("Should not have set var11 = single on the second beacon", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			assert.isUndefined(getBeaconData(1, "var11"));
		});

		it("Should not have set var11 = single on the third beacon", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			assert.isUndefined(getBeaconData(2, "var11"));
		});

		it("Should not have set var12 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.isUndefined(getBeaconData(i, "var12"));
			}
		});

		it("Should have set var13 = 1 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var13"), "1");
			}
		});

		it("Should have set var14 = 2 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.strictEqual(getBeaconData(i, "var14"), "2");
			}
		});

		it("Should not have set var15 in the beacon data on all beacons", function() {
			if (!t.isResourceTimingSupported()) {
				return this.skip();
			}

			for (var i = 0; i < tf.beacons.length; i++) {
				assert.isUndefined(getBeaconData(i, "var15"));
			}
		});
	});
});
