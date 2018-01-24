/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/00-custom-metrics", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom metric 1 - JavaScript var", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet1, 111);
	});

	it("Should have the custom metric 2 - JavaScript function", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet2, 222);
	});

	it("Should be missing custom metric 3 - undefined JavaScript var", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet3, undefined);
	});

	it("Should have the custom metric 4 - XPath with ID (single quote)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet4, 444.44);
	});

	it("Should have the custom metric 5 - URL", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet5, undefined);
	});

	it("Should have the custom metric 6 - QuerySelector if QuerySelector is supported", function() {
		if (t.isQuerySelectorSupported()) {
			var b = tf.lastBeacon();
			assert.equal(b.cmet6, 444.44);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom metric 6 - QuerySelector undefined if QuerySelector is not supported", function() {
		if (!t.isQuerySelectorSupported()) {
			var b = tf.lastBeacon();
			assert.equal(b.cmet6, undefined);
		}
	});

	it("Should have the custom metric 7 - XPath with ID (double quote)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet7, 444.44);
	});

	it("Should have the custom metric 8 - XPath rooted at an ID (double quote) with another element name following", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet8, 444.44);
	});

	it("Should have the custom metric 9 - XPath with ID (single quote) where the ID has a a letter, number, hyphen, underscore, colon and a period", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet9, 555.55);
	});

	it("Should have the custom metric 10 - No XPath and No QuerySelector given but matching \"parameter1\" set", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet10, "1");
	});

	it("Should have the custom metric 11 - Length of the current document.cookie varying based on later running rt.js", function() {
		var b = tf.lastBeacon();
		assert.closeTo(parseInt(b.cmet11), document.cookie.length, 50);
	});

	it("Should be missing custom metric 12 - URL pattern does not match", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet12, undefined);
	});

	it("Should have custom metric 13 - URL pattern does match", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet13, 111);
	});

	it("Should have the custom metric 14 - XPath with hidden input element", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet14, 3.14);
	});

	it("Should have the custom metric 15 - XPath with hidden input checkbox element", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.cmet15);
	});

	it("Should have the custom metric 16 - XPath with hidden input radio element", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.cmet16);
	});

	it("Should have the custom metric 17 - XPath with hidden input checkbox element with no value specified", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet17, "1");
	});

	it("Should have the custom metric 18 - XPath with hidden input radio element with no value specified", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet18, "1");
	});

	it("Should have the custom metric 19 - XPath rooted at a class (double quote) with another element name following", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet19, 444.44);
	});

	it("Should have the custom metric 20 - A javascript variable matched as boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet20, 1);
	});

	it("Should have the custom metric 21 - An element and it's content matched as boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet21, 1);
	});

	it("Should have the custom metric 22 - A custom variable matched as boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet22, 1);
	});

	it("Should have the custom metric 23 - A string matched as a boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet23, 1);
	});

	it("Should NOT have the custom metric 24 - A missing metric matched as a boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet24, undefined);
	});

	it("Should have the custom metric 25 - A numeric metric with a positive value matched as a boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet25, 1);
	});

	it("Should have the custom metric 26 - A numeric metric with a negative value matched as a boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet26, 1);
	});

	it("Should have the custom metric 27 - A numeric metric with a 0 value matched as a boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet27, undefined);
	});

	it("Should have the custom metric 28 - A NULL value metric matched as a boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet28, undefined);
	});

	it("Should have the custom metric 29 - A boolean false value metric matched as a boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet29, undefined);
	});

	it("Should have the custom metric 30 - A empty string value metric matched as a boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet30, undefined);
	});

	it("Should have the custom metric 31 - CSS selector with a value of '$123,45.67' when using comma ',' for the decimal separator and period '.' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet31, 123.45);
	});

	it("Should have the custom metric 32 - CSS selector with a value of '$123,45.67' when using period '.' for the decimal separator and comma ',' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet32, 12345.67);
	});

	it("Should have the custom metric 33 - CSS selector with a value of '$12,345.67' when using comma ',' for the decimal separator and period '.' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet33, 12.345);
	});

	it("Should have the custom metric 34 - CSS selector with a value of '$12,345.67' when using period '.' for the decimal separator and comma ',' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet34, 12345.67);
	});

	it("Should have the custom metric 35 - JavaScript variable with a value of '12,345.67' when using comma ',' for the decimal separator and period '.' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet35, 12.345);
	});

	it("Should have the custom metric 36 - JavaScript variable with a value of '12,345.67' when using period '.' for the decimal separator and comma ',' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet36, 12345.67);
	});

	it("Should have the custom metric 37 - JavaScript variable with a value of 12345.67 when using comma ',' for the decimal separator and period '.' for the thousands separator", function() {
		var b = tf.lastBeacon();
		// note if they were using 1.000,00 format and they gave us a number like 12345.67, we should assume
		// it's a whole number with just a weird place for the thousands separator
		assert.equal(b.cmet37, 1234567);
	});

	it("Should have the custom metric 38 - JavaScript variable with a value of 12345.67 when using period '.' for the decimal separator and comma ',' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet38, 12345.67);
	});

	it("Should have the custom metric 39 - JavaScript variable with a value of '123,456,789.01' when using period '.' for the decimal separator and comma ',' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet39, 123456789.01);
	});

	it("Should have the custom metric 40 - JavaScript variable with a value of '12 345,67' when using comma ',' for the decimal separator and space ' ' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet40, 12345.67);
	});

	it("Should have the custom metric 41 - JavaScript variable with a value of '12 345.67' when using period '.' for the decimal separator and space ' ' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet41, 12345.67);
	});

	it("Should have the custom metric 42 - JavaScript variable with a value of \"12'345,67\" when using comma ',' for the decimal separator and space ' ' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet42, 12345.67);
	});

	it("Should have the custom metric 43 - JavaScript variable with a value of \"12'345.67\" when using period '.' for the decimal separator and space ' ' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet43, 12345.67);
	});

	it("Should have the custom metric 44 - JavaScript variable with a value of '123.456.789,01' when using comma ',' for the decimal separator and period '.' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet44, 123456789.01);
	});

	it("Should have the custom metric 45 - JavaScript variable with a value of '123.456.789,01' when using perdiod '.' for the decimal separator and comma ',' for the thousands separator", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet45, 123.456);
	});

	it("Should have the custom metric 46 - JavaScript variable with a value of 'abcdef' be undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet46, undefined);
	});

	it("Should have the custom metric 47 - JavaScript variable with a value of '12,.34' be 12", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet47, 12);
	});

	it("Should have the custom metric 48 - JavaScript variable with a value of ',' be undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet48, undefined);
	});

	it("Should have the custom metric 49 - JavaScript variable with a value of '12,345.6.78' be 12345.6", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet49, 12345.6);
	});

	it("Should have the custom metric 50 - JavaScript variable with a value of '12-34,567.89' be 12", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet50, 12);
	});

	it("Should have the custom metric 51 - A javascript variable with value of '   ' matched as boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet51, undefined);
	});

	it("Should have the custom metric 52 - A javascript variable with value of '0' matched as boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet52, undefined);
	});

	it("Should have the custom metric 53 - A javascript variable with value of 'False' matched as boolean set to undefined", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet53, undefined);
	});

	it("Should have the custom metric 54 - A javascript variable with value of 'abcdef' matched as boolean", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet54, 1);
	});
});
