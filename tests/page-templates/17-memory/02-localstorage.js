/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/02-localstorage", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have localstorage count of 2", function() {
		if (window.localStorage) {
			assert.equal(tf.lastBeacon()["mem.lsln"], 2);
		}
	});

	it("Should have localstorage size of 48", function() {
		if (window.localStorage) {
			assert.equal(tf.lastBeacon()["mem.lssz"], 35 + 13);
		}
	});

	it("Should have sessionstorage count of 3", function() {
		if (window.sessionStorage) {
			assert.equal(tf.lastBeacon()["mem.ssln"], 3);
		}
	});

	it("Should have sessionstorage size of 41", function() {
		if (window.sessionStorage) {
			assert.equal(tf.lastBeacon()["mem.sssz"], 22 + 19);
		}
	});
});
