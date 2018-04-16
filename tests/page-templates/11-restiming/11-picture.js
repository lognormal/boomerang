/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/11-picture", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	var issupported = !!document.createElement("PICTURE").constructor.toString().match(/HTMLPictureElement/);

	function findSrcSetImage(resources, width) {
		for (var i = 0; i < resources.length; i++) {
			if (resources[i].name.indexOf("/support/09-" + width + ".jpg") !== -1 && resources[i].hasOwnProperty("width")) {
				return resources[i];
			}
		}

		return undefined;
	}

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should find the PICTURE elements", function() {
		if (t.isResourceTimingSupported() && issupported) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSrcSetImage(resources, 320);
			assert.isDefined(img, "Image 320 is undefined");

			img = findSrcSetImage(resources, 480);
			assert.isDefined(img, "Image 480 is undefined");

			img = findSrcSetImage(resources, 800);
			assert.isDefined(img, "Image 800 is undefined");
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the PICTURE element width", function() {
		if (t.isResourceTimingSupported() && issupported) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSrcSetImage(resources, 320);
			assert.equal(img.width, 320);

			img = findSrcSetImage(resources, 480);
			assert.equal(img.width, 480);

			img = findSrcSetImage(resources, 800);
			assert.equal(img.width, 800);
		}
		else {
			this.skip();
		}
	});
});
