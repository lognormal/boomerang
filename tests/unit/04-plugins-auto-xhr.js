/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.AutoXHR", function() {
	var assert = chai.assert;

	describe("exports", function() {
		it("Should have a AutoXHR object", function() {
			assert.isObject(BOOMR.plugins.AutoXHR);
		});

		it("Should have a is_complete() function", function() {
			assert.isFunction(BOOMR.plugins.AutoXHR.is_complete);
		});
	});

	describe("matchesAlwaysSendXhr()", function() {
		it("Should return false if not given a URL", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr(), false);
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr(null), false);
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr(false), false);
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr(undefined), false);
		});

		it("Should return false if configuration is not specified", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://"), false);
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", null), false);
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", false), false);
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", undefined), false);
		});

		it("Should return true if configuration is set to true", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", true), true);
		});

		it("Should return true if configuration is a function that returns true", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", function() { return true; }), true);
		});

		it("Should return false if configuration is a function that returns false", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", function() { return false; }), false);
		});

		it("Should return false if configuration is a function that returns undefined", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", function() { return; }), false);
		});

		it("Should return true if configuration is a list of strings where one matches", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", ["a", "http://", "b"]), true);
		});

		it("Should return false if configuration is a list of strings where none matches", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", ["a", "https://", "b"]), false);
		});

		it("Should return true if configuration is a list of regular expressions where one matches", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", [/a/, /http:\/\//, /b/]), true);
		});

		it("Should return false if configuration is a list of regular expressions where none matches", function() {
			assert.equal(BOOMR.plugins.AutoXHR.matchesAlwaysSendXhr("http://", [/a/, /https:\/\//, /b/]), false);
		});
	});
});
