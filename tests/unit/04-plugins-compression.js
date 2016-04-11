/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.Compression", function() {
	var assert = chai.assert;

	describe("BOOMR.utils", function() {
		it("Should have a Compression object", function() {
			assert.isObject(BOOMR.utils.Compression);
		});
	});

	describe("jsUrl()", function() {
		//
		// Tests adapted from
		// https://github.com/Sage/jsurl
		//
		function t(value, result) {
			// ensure the value is converted properly
			var valueJsUrl = BOOMR.utils.Compression.jsUrl(value);
			assert.strictEqual(valueJsUrl, result, "stringify " + (typeof value !== "object" ? value : JSON.stringify(value)));

			// round-trip
			assert.strictEqual(BOOMR.utils.Compression.jsUrl(BOOMR.utils.Compression.jsUrlDecompress(valueJsUrl)), result, "roundtrip " + (typeof value !== "object" ? value : JSON.stringify(value)));
		}

		it("Should convert undefined", function() {
			// undefined
			t(undefined, undefined);
		});

		it("Should convert a function", function() {
			// a function
			t(function() {
				foo();
			}, undefined);
		});

		it("Should convert null", function() {
			// null
			t(null, "~null");
		});

		it("Should convert true/false", function() {
			// true/false
			t(false, "~false");
			t(true, "~true");
		});

		it("Should convert 0", function() {
			// numbers
			t(0, "~0");
		});

		it("Should convert 1", function() {
			t(1, "~1");
		});

		it("Should convert -1.5", function() {
			t(-1.5, "~-1.5");
		});

		it("Should convert unicode", function() {
			// a string with unicode characters
			t("hello world\u203c", "~'hello*20world**203c");
		});

		it("Should convert characters that need to be escaped", function() {
			// a string with many different characters that need to be escaped
			t(" !\"#$%&'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~", "~'*20*21*22*23!*25*26*27*28*29*2a*2b*2c-.*2f09*3a*3b*3c*3d*3e*3f*40AZ*5b*5c*5d*5e_*60az*7b*7c*7d*7e");
		});

		it("Should convert NaN, Infinity, etc", function() {
			// JSON.stringify converts special numeric values to null
			t(NaN, "~null");
			t(Infinity, "~null");
			t(-Infinity, "~null");
		});

		it("Should convert a simple array", function() {
			// empty array
			t([], "~(~)");
		});

		it("Should convert a complex array", function() {
			// an array of different values
			t([
				function() {
					foo();
				},
				null,
				false,
				0,
				"hello world\u203c"
			], "~(~null~null~false~0~'hello*20world**203c)");
		});

		it("Should convert an empty object", function() {
			// empty object
			t({}, "~()");
		});

		it("Should convert a complex object", function() {
			// an object with different properties
			t({
				a: undefined,
				b: function() {
					foo();
				},
				c: null,
				d: false,
				e: 0,
				f: "hello world\u203c"
			}, "~(c~null~d~false~e~0~f~'hello*20world**203c)");
		});

		it("Should convert an object with different types of properties", function() {
			t({
				a: [
					[1, 2],
					[], {}],
				b: [],
				c: {
					d: "hello",
					e: {},
					f: []
				}
			}, "~(a~(~(~1~2)~(~)~())~b~(~)~c~(d~'hello~e~()~f~(~)))");
		});
	});
});
