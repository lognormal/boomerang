/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/92560", function() {
	function test(href, expected) {
		var anchor = document.createElement("a");
		anchor.href = href;
		assert.equal(
			BOOMR.plugins.AutoXHR.getPathname(anchor),
			expected);
	}

	var t = BOOMR_test;

	it("Should get only 2 beacons: 1 onload, 1 xhr (2nd xhr should be excluded)", function(done) {
		// because the XHRs might take over a second
		this.timeout(10000);

		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done,  2);
			});
	});

	it("getPathname test - path/file.js", function() {
		t.ifAutoXHR(null, function() { test("path/file.js", "/pages/06-bugs/path/file.js"); });
	});

	it("getPathname test - /path/file.js", function() {
		t.ifAutoXHR(null, function() { test("/path/file.js", "/path/file.js"); });
	});

	it("getPathname test - //path/file.js", function() {
		t.ifAutoXHR(null, function() { test("//path/file.js", "/file.js"); });
	});

	it("getPathname test - ./path/file.js", function() {
		t.ifAutoXHR(null, function() { test("./path/file.js", "/pages/06-bugs/path/file.js"); });
	});

	it("getPathname test - ../path/file.js", function() {
		t.ifAutoXHR(null, function() { test("../path/file.js", "/pages/path/file.js"); });
	});

	it("getPathname test - #ref", function() {
		t.ifAutoXHR(null, function() { test("#ref", "/pages/06-bugs/92560.html"); });
	});

	it("getPathname test - ?val=1", function() {
		t.ifAutoXHR(null, function() { test("?val=1", "/pages/06-bugs/92560.html"); });
	});

	it("getPathname test - ../../../../file.js", function() {
		t.ifAutoXHR(null, function() { test("../../../../file.js", "/file.js"); });
	});

});
