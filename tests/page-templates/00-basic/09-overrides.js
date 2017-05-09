/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/09-overrides", function() {
	var tf = BOOMR.plugins.TestFramework;
	var windowUnderTest = window;

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	// if window is already hijacked (phantomjs, i'm looking at you), punt
	if (!((typeof document.all) !== "function" && (typeof document.all) === "function")) {
		describe("clean window", function() {
			it("Should return an empty array", function() {
				var overrides = BOOMR.checkWindowOverrides(windowUnderTest);
				assert.isTrue(BOOMR.utils.isArray(overrides));
				assert.lengthOf(overrides, 0);
			});
		});

		if (typeof Object.defineProperty === "function") {
			describe("window with overrides", function() {
				var _ = {};
				var testMethods = [
					"EventTarget.prototype.addEventListener",
					"XMLHttpRequest.prototype.open"
				];
				before(function() {
					BOOMR.utils.forEach(testMethods, function(method) {
						_[method] = eval(method); // eslint-disable-line no-eval
						eval(method + " = function() {};"); // eslint-disable-line no-eval
					});
				});
				after(function() {
					BOOMR.utils.forEach(testMethods, function(method) {
						eval(method + " = _[method]"); // eslint-disable-line no-eval
					});
				});
				it("Should identify non-native methods found starting at `window`", function() {
					var overrides = BOOMR.checkWindowOverrides(windowUnderTest);
					assert.isTrue(BOOMR.utils.isArray(overrides));
					assert.lengthOf(overrides, testMethods.length);
					assert.includeMembers(overrides, testMethods);
				});
			});
		}
	}

	// if document is already hijacked (phantomjs, i'm looking at you), punt
	if (!document.hasOwnProperty("readyState")) {
		describe("clean document", function() {
			it("Should return an empty array", function() {
				var overrides = BOOMR.checkDocumentOverrides(document);
				assert.isTrue(BOOMR.utils.isArray(overrides));
				assert.lengthOf(overrides, 0);
			});
		});

		describe("document with overrides", function() {
			var _ = {};
			before(function() {
				BOOMR.utils.forEach(["readyState", "domain", "hidden", "URL", "cookie"], function(prop) {
					_[prop] = document[prop];
					Object.defineProperty(document, prop, {
						value: "foo"
					});
				});
			});
			after(function() {
				BOOMR.utils.forEach(Object.keys(_), function(prop) {
					document[prop] = _[prop];
				});
			});
			it("Should identify non-native properties on `document`", function() {
				var overrides = BOOMR.checkDocumentOverrides(document);
				assert.isTrue(BOOMR.utils.isArray(overrides));
				assert.lengthOf(overrides, Object.keys(_).length);
				assert.includeMembers(overrides, Object.keys(_));
			});
		});
	}

});
