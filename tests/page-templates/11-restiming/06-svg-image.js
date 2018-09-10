/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/06-svg-image", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	function findSvgImage(resources) {
		for (var i = 0; i < resources.length; i++) {
			if (resources[i].name.indexOf("/assets/img.jpg") !== -1) {
				return resources[i];
			}
		}

		return undefined;
	}

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should found the SVG:image element", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSvgImage(resources);
			assert.isDefined(img, "Image is not null");
		}
		else {
			this.skip();
		}
	});

	it("Should have set the SVG:image initiatorType to IMAGE (or IMG, OTHER)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSvgImage(resources);


			if (t.isFirefox()) {
				// Firefox initiator type may change depending on cache?
				// Looks to be `other` (soft reload), `img` (first hit) or `image` (hard reload)
				assert.isTrue(BOOMR.utils.inArray(img.initiatorType, ["image", "img", "other"]));
			}
			else if (t.isIE() || t.isEdge()) {
				assert.equal(img.initiatorType, "img");
			}
			else {
				// Chrome, Safari
				assert.equal(img.initiatorType, "image");
			}
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the SVG:image element height", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSvgImage(resources);
			assert.equal(img.height, 200);
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the SVG:image element width", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSvgImage(resources);
			assert.equal(img.width, 400);
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the SVG:image element top", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSvgImage(resources);
			assert.operator(img.y, ">=", 20);
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the SVG:image element left", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSvgImage(resources);
			assert.operator(img.x, ">=", 10);
		}
		else {
			this.skip();
		}
	});
});
