/*eslint-env mocha*/
/*eslint-disable no-loop-func*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/08-cross-origin", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have a restiming parameter on the beacon (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isDefined(b.restiming);
		}
		else {
			this.skip();
		}
	});

	it("Should have all of the resouces on the page", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
			var pageResources = window.performance.getEntriesByType("resource");

			for (var i = 0; i < pageResources.length; i++) {
				var url = pageResources[i].name;

				// skip beacon, boomerang, & config URLs
				if (url.indexOf(BOOMR.getBeaconURL()) !== -1 || url === BOOMR.url || url === BOOMR.config_url) {
					continue;
				}

				// skip favicon
				if (url.indexOf("favicon.ico") !== -1) {
					continue;
				}

				// skip about:blank (IE 11)
				if (url.indexOf("about:blank") !== -1) {
					continue;
				}

				assert.isDefined(BOOMR.utils.arrayFind(resources, function(r) {
					return r.name === url;
				}), "Finding " + url);
			}
		}
		else {
			this.skip();
		}
	});

	it("Should have the same-origin IFRAME", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			assert.isDefined(BOOMR.utils.arrayFind(resources, function(r) {
				return r.name.indexOf("support/iframe.html?same-origin") !== -1;
			}), "Finding support/iframe.html?same-origin");
		}
		else {
			this.skip();
		}
	});

	it("Should have the IMG from the same-origin IFRAME", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			assert.isDefined(BOOMR.utils.arrayFind(resources, function(r) {
				return r.name.indexOf("/assets/img.jpg?iframe") !== -1;
			}), "Finding /assets/img.jpg?iframe in the IFRAME");
		}
		else {
			this.skip();
		}
	});

	it("Should have the cross-origin IFRAME", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			assert.isDefined(BOOMR.utils.arrayFind(resources, function(r) {
				return r.name.indexOf("support/iframe.html?cross-origin") !== -1;
			}), "Finding support/iframe.html?cross-origin");
		}
		else {
			this.skip();
		}
	});

	it("Should not have the IMG from the cross-origin IFRAME", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			assert.isUndefined(BOOMR.utils.arrayFind(resources, function(r) {
				return r.name.indexOf("/assets/img.jpg?iframe") !== -1 &&
				       r.name.indexOf(window.crossOriginHost) !== -1;
			}), "Not finding /assets/img.jpg?iframe from cross-origin iframe");
		}
		else {
			this.skip();
		}
	});
});
