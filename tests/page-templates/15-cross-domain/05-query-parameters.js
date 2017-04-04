/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/15-cross-domain/00-post-message-beacon", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have \"rt.sstr_dur\" beacon param with the duration for the session to be transferred in under 500 miliseconds", function() {
		var b = tf.lastBeacon();
		assert.closeTo(b["rt.sstr_dur"], 0, 500);
	});

	it("Should not include a the session transfer timed out flag ", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["rt.sstr_to"]);
	});

	it("Should have only one ? in the iframe URL", function() {
		if (t.isResourceTimingSupported()) {
			var resource = t.findFirstResource("frameScript");
			assert.isDefined(resource);
			var resourceURL = resource.name;
			assert.equal(resourceURL.match(/\?/g).length, 1, "Number of '?'s in URL was not 1.");
		}
	});

});
