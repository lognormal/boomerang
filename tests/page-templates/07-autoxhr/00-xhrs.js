/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/00-xhrs", function() {
	var tf = BOOMR.plugins.TestFramework;
	var bXhr = false;
	if (window.XMLHttpRequest && (new XMLHttpRequest()).addEventListener) {
		bXhr = true;
	}

	it("Should get 5 beacons: 1 onload, 4 xhr (XMLHttpRequest !== null)", function(done) {
		if (!bXhr) {
			return done();
		}

		tf.waitForBeaconCount(done, 5);
	});

	it("Should get 1 beacon: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		if (bXhr) {
			return done();
		}

		setTimeout(function(){
			assert.equal(tf.beaconCount(), 1);
			done();
		}, 500);
	});

});
