/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.getQueryParamValue()", function() {
	var assert = chai.assert;

	function getA(url) {
		var a = BOOMR.window.document.createElement("a");
		a.href = url;
		return a;
	};

	it("Should return null when undefined is passed as param argument", function() {
		assert.isNull(BOOMR.utils.getQueryParamValue(undefined));
	});

	it("Should return null when null is passed as param argument", function() {
		assert.isNull(BOOMR.utils.getQueryParamValue(null));
	});

	it("Should return null when when an empty string is passed as param argument", function() {
		assert.isNull(BOOMR.utils.getQueryParamValue(""));
	});

	it("Should return the correct parameter value (string url)", function() {
		var url = "http://www.example.com/";
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", url + "?foo=&bar="), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", url + "?foo&bar="), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", url + "?foo=1&bar="), "1");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", url + "?foo=%20a&bar="), " a");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", url + "?foo=bar=1&bar=2"), "bar=1");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", url + "?foo=1&bar"), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", url + "?foo=1&bar="), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", url + "?foo=1&bar=2"), "2");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", url + "?foo=1&bar=#3"), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", url + "?foo=1&bar=2+3"), "2 3");
	});

	it("Should return the correct parameter value (object url)", function() {
		var url = "http://www.example.com/";
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", getA(url + "?foo=&bar=")), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", getA(url + "?foo&bar=")), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", getA(url + "?foo=1&bar=")), "1");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", getA(url + "?foo=%20a&bar=")), " a");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("foo", getA(url + "?foo=bar=1&bar=2")), "bar=1");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", getA(url + "?foo=1&bar")), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", getA(url + "?foo=1&bar=")), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", getA(url + "?foo=1&bar=2")), "2");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", getA(url + "?foo=1&bar=#3")), "");
		assert.strictEqual(BOOMR.utils.getQueryParamValue("bar", getA(url + "?foo=1&bar=2+3")), "2 3");
	});

	it("Should return null when there are no query parameters", function() {
		var url = "http://www.example.com/";
		assert.isNull(BOOMR.utils.getQueryParamValue("bar", url + "#?foo=1&bar=2"));
		assert.isNull(BOOMR.utils.getQueryParamValue("bar", getA(url + "#?foo=1&bar=2")));
	});

	it("Should return null when the param is not in the query parameters", function() {
		var url = "http://www.example.com/";
		assert.isNull(BOOMR.utils.getQueryParamValue("abc", url + "?foo=1&bar=2"));
		assert.isNull(BOOMR.utils.getQueryParamValue("abc", getA(url + "?foo=1&bar=2")));
	});
});
