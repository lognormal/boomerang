/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/06-bugs/96883", function() {
	var t = BOOMR_test;

	it("Should only have a single regular config.js node after 10 seconds", function(done) {
		if (BOOMR.plugins.LOGN.isJson) {
			// config.json mode doesn't use SCRIPT nodes
			return done();
		}

		var timerId = t.timeout(this, 15000, 10000);

		t.runRepeatedly(function() {
			assert.equal(1, t.elementsWithAttribute("script", "src", /\/config\?.*plugins=.*/));
		}, 10, 1000, function() {
			t.clearTimeout(timerId);
			done();
		});
	});

	it("Should only have one or two (depending on the timing) refresh config.js[on] nodes after 10 seconds", function(done) {
		if (BOOMR.plugins.LOGN.isJson) {
			// config.json mode doesn't use SCRIPT nodes
			return done();
		}

		var timerId = t.timeout(this, 15000, 10000);

		t.runRepeatedly(function() {
			assert.isTrue(t.elementsWithAttribute("script", "src", /\/config\?.*&r=.*/) <= 2);
		}, 10, 1000, function() {
			t.clearTimeout(timerId);
			done();
		});
	});
});
