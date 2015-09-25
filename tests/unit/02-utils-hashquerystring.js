/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.hashQueryString()", function() {
	var assert = chai.assert;

	it("Should return undefined when undefined is passed as argument", function() {
		assert.isUndefined(BOOMR.utils.hashQueryString());
	});

	it("Should return null when null is passed as argument", function() {
		assert.isNull(BOOMR.utils.hashQueryString(null));
	});

	it("Should return an empty string when an empty string is passed as argument", function() {
		assert.strictEqual(BOOMR.utils.hashQueryString(""), "");
	});

	it("Should return an empty string when a non-URL is passed as an argument", function() {
		assert.strictEqual(BOOMR.utils.hashQueryString("foo"), "");
	});

	it("Should return an empty string when an a non-string is passed as argument", function() {
		assert.strictEqual(BOOMR.utils.hashQueryString(true), "");
		assert.strictEqual(BOOMR.utils.hashQueryString({}), "");
		assert.strictEqual(BOOMR.utils.hashQueryString([]), "");
		assert.strictEqual(BOOMR.utils.hashQueryString(1), "");
	});

	it("Should return the URL untouched when passed with second argument false", function() {
		var url = "http://www.example.org/page#/app";
		assert.equal(BOOMR.utils.hashQueryString(url, false), url);
	});

	it("Should return the URL untouched when passed with second argument false when there is a query string in it", function() {
		var url = "http://www.example.org/page?foo=1#app";
		assert.equal(BOOMR.utils.hashQueryString(url, false), url);
	});

	it("Should return cleaned URL when passed with second argument true", function() {
		var url = "http://www.example.org/page#/app";
		var expected = "http://www.example.org/page";
		assert.equal(BOOMR.utils.hashQueryString(url, true), expected);
	});

	it("Should return empty URL when URL starts with \"/\"", function() {
		var url = "/page",
		expected = "";
		assert.equal(BOOMR.utils.hashQueryString(url), expected);
	});

	it("Should return empty URL when URL starts with \"/\" and second argument is true", function() {
		var url = "/page",
		expected = "";
		assert.equal(BOOMR.utils.hashQueryString(url, true), expected);
	});

	it("Should append a protocol string to the URL when URL starts with \"//\" and second argument is true", function() {
		var url = "//page",
		expected = window.location.protocol + url;
		assert.equal(BOOMR.utils.hashQueryString(url, true), expected);
	});

	it("Should hash the parameters in the URL but retain the hash when the second argument is false and 'MD5' was built into BOOMR.utils", function() {
		var url = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page",
		expected = "http://www.example.org/app/page?458b9ebff2b935135a62cb9decd803dd#page";

		assert.equal(BOOMR.utils.hashQueryString(url, false), expected);
	});

	it("Should hash the parameters in the URL and remove the hash when the second argument is true and 'MD5' was built into BOOMR.utils", function() {
		var url = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page",
		expected = "http://www.example.org/app/page?458b9ebff2b935135a62cb9decd803dd";

		assert.equal(BOOMR.utils.hashQueryString(url, true), expected);
	});

	it("Should return the URL when MD5 was not built into BOOMR.utils", function() {
		var MD5 = BOOMR.utils.MD5;
		BOOMR.utils.MD5 = false;

		var url = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page",
		expected = "http://www.example.org/app/page?key1=value&key2=value&key3=value&key4=value&key5=value#page";
		assert.equal(BOOMR.utils.hashQueryString(url, false), expected);

		BOOMR.utils.MD5 = MD5;
	});
});
