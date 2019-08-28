/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/10-img-srcset", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	var issupported = !!document.createElement("PICTURE").constructor.toString().match(/HTMLPictureElement/);

	function getExpectedImage() {
		var img = document.getElementsByTagName("img")[0];
		var src = img.currentSrc.replace(/^.*\/(support\/)/, "$1");

		var srcset = img.srcset.split(/\s*,\s*/m).map(function(x) { return x.split(/ +/)[0]; });

		for (var s = 0; s < srcset.length - 1; s++) {
			if (src === srcset[s]) {
				return [src, widths[s], img.clientWidth || img.offsetWidth];
			}
		}

		return [src, widths[s], img.clientWidth || img.offsetWidth];
	}

	function findSrcSetImage(resources) {
		var imgtuple = getExpectedImage();

		for (var i = 0; i < resources.length; i++) {
			if (resources[i].name.indexOf(imgtuple[0]) !== -1) {
				return resources[i];
			}
		}

		return undefined;
	}

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should find the IMG element for screen width " + screen.width + "px and dpr " + window.devicePixelRatio, function() {
		if (t.isResourceTimingSupported() && screen.width && issupported) {
			var b = tf.beacons[0];

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSrcSetImage(resources);
			assert.isDefined(img, "Image is undefined");
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the IMG element width for screen width " + screen.width + "px and dpr " + window.devicePixelRatio, function() {
		if (t.isResourceTimingSupported() && screen.width && issupported) {
			var b = tf.beacons[0];

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSrcSetImage(resources);
			assert.equal(img.width, getExpectedImage()[2]);
		}
		else {
			this.skip();
		}
	});

	it("Should have captured the IMG element naturalWidth for screen width " + screen.width + "px and dpr " + window.devicePixelRatio, function() {
		if (t.isResourceTimingSupported() && screen.width && issupported) {
			var b = tf.beacons[0];

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var img = findSrcSetImage(resources);
			assert.equal(img.naturalWidth, getExpectedImage()[1]);
		}
		else {
			this.skip();
		}
	});
});
