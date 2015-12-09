/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/02-resource-dimensions", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should have dimensions for the IMG on the page (if ResourceTiming is supported)", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			// 200 height = 5k
			// 400 width  = b4
			// 500 y      = dw
			// 100 x      = 2s
			assert.include(b.restiming, "*05k,b4,dw,2s");
		}
	});

	it("Should have dimensions for the IFRAME on the page (if ResourceTiming is supported)", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			// 50 height = 1e
			// 50 width  = 1e
			// 800 y     = m8
			// 200 x     = 5k
			assert.include(b.restiming, "*01e,1e,m8,5k");
		}
	});
});
