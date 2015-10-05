/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.cleanupURL()", function() {
	var assert = chai.assert;

	it("Should return an empty string when no argument is given", function() {
		assert.equal(BOOMR.utils.cleanupURL(), "");
	});

	it("Should return an empty string when null is passed as argument", function() {
		assert.equal(BOOMR.utils.cleanupURL(null), "");
	});

	it("Should return an empty string when undefined is passed as argument", function() {
		assert.equal(BOOMR.utils.cleanupURL(undefined), "");
	});

	it("Should return an empty string when an empty string is passed as argument", function() {
		assert.equal(BOOMR.utils.cleanupURL(undefined), "");
	});

	it("Should return an empty string when false is passed as argument", function() {
		assert.equal(BOOMR.utils.cleanupURL(false), "");
	});

	it("Should return an empty string when an array is passed as argument", function() {
		assert.equal(BOOMR.utils.cleanupURL(["a", "b"]), "");
	});

	it("Should return the given URL without a parameters string when a URL with prameters is passed as argument", function() {
		var BOOMR_reset = BOOMR;
		BOOMR.init({
			strip_query_string: true
		});

		var url = "http://www.example.com/?key=value",
		expected = "http://www.example.com/?qs-redacted";
		assert.equal(BOOMR.utils.cleanupURL(url), expected);

		BOOMR = BOOMR_reset;
	});

	it("Should return the given path without parameters when a URL-path with prameters is passed as argument", function() {
		var BOOMR_reset = BOOMR;
		BOOMR.init({
			strip_query_string: true
		});

		var url = "/app/page?key=value",
		    expected = "/app/page?qs-redacted";
		assert.equal(BOOMR.utils.cleanupURL(url), expected);

		BOOMR = BOOMR_reset;
	});

	it("Should return original URL when strip_query_string is false", function() {
		var BOOMR_reset = BOOMR;
		BOOMR.init({
			strip_query_string: false
		});

		var url = "/app/page?key=value",
		    expected = "/app/page?key=value";
		assert.equal(BOOMR.utils.cleanupURL(url), expected);

		BOOMR = BOOMR_reset;
	});
});
