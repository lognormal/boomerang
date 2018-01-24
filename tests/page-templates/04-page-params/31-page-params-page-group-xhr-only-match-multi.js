/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/04-page-params/31-page-params-page-group-xhr-only-match-multi", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	function hasBeaconWithPageGroup(pageGroup) {
		for (var i = 0; i < tf.beacons.length; i++) {
			if (tf.beacons[i]["xhr.pg"] === pageGroup) {
				return;
			}
		}

		assert.fail("No XHR beacon with Page Group: " + pageGroup);
	}

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 4 beacons", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 4);
			},
			this.skip.bind(this));
	});

	it("Should send XHR with xhr.pg as XHR Test Page", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				hasBeaconWithPageGroup("XHR Test Page");
				done();
			},
			this.skip.bind(this));
	});

	it("Should send XHR with xhr.pg as XHR Test Page 2", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				hasBeaconWithPageGroup("XHR Test Page 2");
				done();
			},
			this.skip.bind(this));
	});

	it("Should send XHR with xhr.pg as XHR Do Not Ignore", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				hasBeaconWithPageGroup("XHR Test Do Not Ignore");
				done();
			},
			this.skip.bind(this));
	});

});
