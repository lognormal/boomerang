/**
 * The `Compression` plugin adds common compression code that other plugins can use.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds no parameters to the beacon.
 *
 * @class BOOMR.utils.Compression
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.utils = BOOMR.utils || {};

	if (BOOMR.utils && BOOMR.utils.Compression) {
		return;
	}

	var self = BOOMR.utils.Compression = {};

	/**
	 * Converts an object to URL-friendly JSON
	 *
	 * Adapted from https://github.com/Sage/jsurl
	 *
	 * Changes:
	 *  Formatting
	 *  Removal of Array.map and Object.map for compat with IE 6-8
	 *  Change of str[i] syntax to str.charAt(i) for compat with IE 6-7
	 *
	 * @param {object} v Object to convert
	 *
	 * @returns {string} URL-friendly JSON
	 * @memberof BOOMR.utils.Compression
	 */
	self.jsUrl = function jsUrl(v) {
		/**
		 * Encodes the specified string
		 *
		 * @param {string} s String
		 *
		 * @returns {string} Encoded string
		 */
		function encode(s) {
			if (!/[^\w-.]/.test(s)) {
				// if the string is only made up of alpha-numeric, underscore,
				// dash or period, we can use it directly.
				return s;
			}

			// we need to escape other characters
			s = s.replace(/[^\w-.]/g, function(ch) {
				if (ch === "$") {
					return "!";
				}

				// use the character code for this one
				ch = ch.charCodeAt(0);

				if (ch < 0x100) {
					// if less than 256, use "*[2-char code]"
					return "*" + ("00" + ch.toString(16)).slice(-2);
				}
				else {
					// use "**[4-char code]"
					return "**" + ("0000" + ch.toString(16)).slice(-4);
				}
			});

			return s;
		}

		var tmpAry = [];

		switch (typeof v) {
		case "number":
			// for finite numbers, return "~[number]"
			return isFinite(v) ? "~" + v : "~null";

		case "string":
			// "~'[encoded string]"
			return "~'" + encode(v);

		case "boolean":
			// "~true" or "~false"
			return "~" + v;

		case "object":
			if (!v) {
				return "~null";
			}

			if (BOOMR.utils.isArray(v)) {
				// iterate instead of Array.map for compat
				for (var i = 0; i < v.length; i++) {
					if (i in v) {
						tmpAry[i] = self.jsUrl(v[i]) || "~null";
					}
				}

				return "~(" + (tmpAry.join("") || "~") + ")";
			}
			else {
				// iterate instead of Object.map for compat
				for (var key in v) {
					if (v.hasOwnProperty(key)) {
						var val = self.jsUrl(v[key]);
						// skip undefined and functions

						if (val) {
							tmpAry.push(encode(key) + val);
						}
					}
				}

				return "~(" + tmpAry.sort().join("~") + ")";
			}

		default:
			// function, undefined
			return undefined;
		}
	};

	/* BEGIN_DEBUG */
	/**
	 * JSURL reserved value map
	 */
	var _true = "true", _false = "false", _null = "null";  // work around uglifyJS minification that breaks in IE8 and quirks mode
	var JSURL_RESERVED = {};
	JSURL_RESERVED[_true] = true;
	JSURL_RESERVED[_false] = false;
	JSURL_RESERVED[_null] = null;

	/**
	 * Converts from JSURL to JSON.
	 *
	 * Adapted from https://github.com/Sage/jsurl
	 *
	 * @param {string} s JSURL string
	 *
	 * @returns {object} Decompressed object
	 * @memberof BOOMR.utils.Compression
	 */
	self.jsUrlDecompress = function(s) {
		if (typeof s !== "string") {
			return s;
		}

		var i = 0;
		var len = s.length;

		/**
		 * Eats the specified character, and throws an exception if another character
		 * was found
		 *
		 * @param {string} expected Expected string
		 */
		function eat(expected) {
			if (s.charAt(i) !== expected) {
				throw new Error("bad JSURL syntax: expected " + expected + ", got " + (s && s.charAt(i)) +
					" from:" + s +
					" length:" + s.length.toString() +
					" char at:" + s.charAt(i));
			}

			i++;
		}

		/**
		 * Decodes the next value
		 *
		 * @returns {string} Next value
		 */
		function decode() {
			var beg = i;
			var ch;
			var r = "";

			// iterate until we reach the end of the string or "~" or ")"
			while (i < len && (ch = s.charAt(i)) !== "~" && ch !== ")") {
				switch (ch) {
				case "*":
					if (beg < i) {
						r += s.substring(beg, i);
					}

					if (s.charAt(i + 1) === "*") {
						// Unicode characters > 0xff (255), which are encoded as "**[4-digit code]"
						r += String.fromCharCode(parseInt(s.substring(i + 2, i + 6), 16));
						beg = (i += 6);
					}
					else {
						// Unicode characters <= 0xff (255), which are encoded as "*[2-digit code]"
						r += String.fromCharCode(parseInt(s.substring(i + 1, i + 3), 16));
						beg = (i += 3);
					}
					break;

				case "!":
					if (beg < i) {
						r += s.substring(beg, i);
					}

					r += "$";
					beg = ++i;
					break;

				default:
					i++;
				}
			}

			return r + s.substring(beg, i);
		}

		return (function parseOne() {
			var result, ch, beg;

			eat("~");

			switch (ch = s.charAt(i)) {
			case "(":
				i++;
				if (s.charAt(i) === "~") {
					// this is an Array
					result = [];

					if (s.charAt(i + 1) === ")") {
						i++;
					}
					else {
						do {
							result.push(parseOne());
						} while (s.charAt(i) === "~");
					}
				}
				else {
					// this is an object
					result = {};

					if (s.charAt(i) !== ")") {
						do {
							var key = decode();
							result[key] = parseOne();
						} while (s.charAt(i) === "~" && ++i);
					}
				}
				eat(")");
				break;

			case "'":
				i++;
				result = decode();
				break;

			default:
				beg = i++;
				while (i < len && /[^)~]/.test(s.charAt(i))) {
					i++;
				}

				var sub = s.substring(beg, i);

				if (/[\d\-]/.test(ch)) {
					result = parseFloat(sub);
				}
				else {
					result = JSURL_RESERVED[sub];

					if (typeof result === "undefined") {
						throw new Error("bad value keyword: " + sub);
					}
				}
			}

			return result;
		}());
	};
	/* END_DEBUG */
}());
