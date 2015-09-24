/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/06-bugs/96883", function() {
	var t = BOOMR_test;

	it("Should only have a single regular config.js node after 10 seconds", function(done) {
		var timerId = t.timeout(this, 15000, 10000);

		t.runRepeatedly(function() {
			assert.equal(1, t.elementsWithAttribute("script", "src", /\/config\?.*plugins=.*/));
		}, 10, 1000, function() {
			t.clearTimeout(timerId);
			done();
		});
	});

	it("Should only have a single refresh config.js node after 10 seconds", function(done) {
		var timerId = t.timeout(this, 15000, 10000);

		t.runRepeatedly(function() {
			assert.equal(1, t.elementsWithAttribute("script", "src", /\/config\?.*&r=.*/));
		}, 10, 1000, function() {
			t.clearTimeout(timerId);
			done();
		});
	});
});
