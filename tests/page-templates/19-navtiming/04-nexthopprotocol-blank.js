/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-navtiming/04-nextHopProtocol-blank", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have fired 'beacon' with a beacon payload", function() {
		// ensure the data was sent to 'beacon'
		assert.isObject(tf.lastBeacon());
	});

	it("Should have set basic beacon properties", function() {
		assert.isString(tf.lastBeacon().v);
	});

	it("Should not have set nt_protocol", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon().nt_protocol, "nt_protocol");
	});

	it("Should not have set chromeTimes if nt_protocol is not set", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		assert.isFalse(loadTimesCalled, "chromeTimes");
	});

});

