/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-mobile/01-mobile-variable-mapping", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should map type to ct when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "type" in connection) {
				assert.isTrue("mob.ct" in b);
				assert.isTrue(b["mob.ct"] === connection.type);
			}
		}
	});

	it("Should map bandwidth to bw when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "bandwidth" in connection) {
				assert.isTrue("mob.bw" in b);
				assert.isTrue(b["mob.bw"] === connection.bandwidth);
			}
		}
	});

	it("Should map metered to mt when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "metered" in connection) {
				assert.isTrue("mob.mt" in b);
				assert.isTrue(b["mob.mt"] === connection.metered);
			}
		}
	});

	it("Should map effectiveType to etype when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "effectiveType" in connection) {
				assert.isTrue("mob.etype" in b);
				assert.isTrue(b["mob.etype"] === connection.effectiveType);
			}
		}
	});

	it("Should map downlinkMax to lm when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "downlinkMax" in connection) {
				assert.isTrue("mob.lm" in b);
				assert.isTrue(b["mob.lm"] === connection.downlinkMax);
			}
		}
	});

	it("Should map downlink to dl when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "downlink" in connection) {
				assert.isTrue("mob.dl" in b);
				assert.isTrue(b["mob.dl"] === connection.downlink);
			}
		}
	});

	it("Should map rtt to rtt when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "rtt" in connection) {
				assert.isTrue("mob.rtt" in b);
				assert.isTrue(b["mob.rtt"] === connection.rtt);
			}
		}
	});

	it("Should map saveData to sd when available", function() {
		if (t.isNetworkAPISupported()) {
			var connection, b = tf.beacons[0];

			if (typeof navigator === "object") {
				connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
			}

			if (connection && "saveData" in connection) {
				assert.isTrue("mob.sd" in b);
				assert.isTrue(b["mob.sd"] === connection.saveData);
			}
		}
	});
});
