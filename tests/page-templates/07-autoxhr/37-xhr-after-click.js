/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/37-xhr-after-click", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	it("Should have sent at least 2 beacons, 1x onload, 1x xhr", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.lengthOf(tf.beacons, 2);
				done();
			}
		);
	});

	it("Should have a first beacon have the URL of the page", function(done){
		if (t.isMutationObserverSupported()) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[0].u, "37-xhr-after-click.html");
					done();
				});
		}
		else {
			done();
		}
	});

	it("Should have a second beacon with the XHR URL in it", function(done){
		if (t.isMutationObserverSupported()) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1].u, "img.jpg");
					done();
				});
		}
		else {
			done();
		}
	});
});
