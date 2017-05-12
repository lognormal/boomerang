/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/13-logn/02-config-json-reload", function() {
	var t = BOOMR_test;

	it("Should have left h.key after 5 seconds", function(done) {
		var timerId = t.timeout(this, 15000, 10000);

		setTimeout(function() {
			assert.isDefined(BOOMR.getVar("h.key"));
			done();
		}, 5000);
	});
});
