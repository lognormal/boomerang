/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/07-page-ready-held", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should include img.jpg in the ResourceTiming data", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			var found = false;
			for (var i = 0; i < resources.length; i++) {
				if (resources[i].name.indexOf("/assets/img.jpg") !== -1) {
					found = true;
					break;
				}
			}

			assert.isTrue(found, "Found img.jpg");
		}
	});
});
