/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/09-overrides", function() {
	var tf = BOOMR.plugins.TestFramework;
	var windowUnderTest = window;

	// overrides which are commonly seen in browsers or extensions
	var KNOWN_OVERRIDES = [
		"webkitRTCPeerConnection.prototype.setConfiguration", // Chrome
		"RTCPeerConnection.prototype.setConfiguration",       // Chrome
		"WebAssembly.Module",                                 // Edge
		"WebAssembly.Instance"                                // Edge
	];

	function cleanOverridesList(overrides) {
		var result = [];

		for (var i = 0; i < overrides.length; i++) {
			if (overrides[i].indexOf("content.") === 0) {
				// seen in Firefox
				continue;
			}

			if (KNOWN_OVERRIDES.indexOf(overrides[i]) === -1) {
				result.push(overrides[i]);
			}
		}

		return result;
	}

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	var hasGetOwnPropertyName = Object.getOwnPropertyNames;
	var hasReadyState = document.hasOwnProperty && !document.hasOwnProperty("readyState");
	var hasDocumentAll = !((typeof document.all) !== "function" && (typeof document.all) === "function");

	// if window is already hijacked (phantomjs, i'm looking at you), punt
	describe("clean window", function() {
		it("Should return an empty array", function() {
			if (!hasGetOwnPropertyName || !hasDocumentAll) {
				return this.skip();
			}

			var overrides = cleanOverridesList(BOOMR.checkWindowOverrides(windowUnderTest));

			assert.isTrue(BOOMR.utils.isArray(overrides));
			assert.lengthOf(overrides, 0);
		});
	});

	describe("window with overrides", function() {
		var _ = {};
		var testMethods = [
			"EventTarget.prototype.addEventListener",
			"XMLHttpRequest.prototype.open"
		];

		var validTestMethods = [];

		before(function() {
			if (!hasGetOwnPropertyName || !hasDocumentAll || !Object.defineProperty) {
				return;
			}

			BOOMR.utils.forEach(testMethods, function(method) {
				try {
					_[method] = eval(method); // eslint-disable-line no-eval
					eval(method + " = function() {};"); // eslint-disable-line no-eval
					validTestMethods.push(method);
				}
				catch (e) {
					// ignore
				}
			});
		});

		after(function() {
			if (!hasGetOwnPropertyName || !hasDocumentAll || !Object.defineProperty) {
				return;
			}

			BOOMR.utils.forEach(validTestMethods, function(method) {
				eval(method + " = _[method]"); // eslint-disable-line no-eval
			});
		});

		it("Should identify non-native methods found starting at `window`", function() {
			if (!hasGetOwnPropertyName || !hasDocumentAll || !Object.defineProperty) {
				return this.skip();
			}

			var overrides = cleanOverridesList(BOOMR.checkWindowOverrides(windowUnderTest));
			assert.isTrue(BOOMR.utils.isArray(overrides));
			assert.lengthOf(overrides, validTestMethods.length);
			assert.includeMembers(overrides, validTestMethods);
		});
	});

	// if document is already hijacked (phantomjs, i'm looking at you), punt
	describe("clean document", function() {
		it("Should return an empty array", function() {
			if (!hasGetOwnPropertyName || !hasReadyState) {
				return this.skip();
			}

			var overrides = BOOMR.checkDocumentOverrides(document);
			assert.isTrue(BOOMR.utils.isArray(overrides));
			assert.lengthOf(overrides, 0);
		});
	});

	describe("document with overrides", function() {
		var _ = {};
		before(function() {
			if (!hasGetOwnPropertyName || !hasReadyState) {
				return;
			}

			BOOMR.utils.forEach(["readyState", "domain", "hidden", "URL", "cookie"], function(prop) {
				_[prop] = document[prop];
				Object.defineProperty(document, prop, {
					value: "foo"
				});
			});
		});

		after(function() {
			if (!hasGetOwnPropertyName || !hasReadyState) {
				return;
			}

			BOOMR.utils.forEach(Object.keys(_), function(prop) {
				document[prop] = _[prop];
			});
		});

		it("Should identify non-native properties on `document`", function() {
			if (!hasGetOwnPropertyName || !hasReadyState) {
				return this.skip();
			}

			var overrides = BOOMR.checkDocumentOverrides(document);
			assert.isTrue(BOOMR.utils.isArray(overrides));
			assert.lengthOf(overrides, Object.keys(_).length);
			assert.includeMembers(overrides, Object.keys(_));
		});
	});
});
