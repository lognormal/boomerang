/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.Errors", function() {
	var assert = chai.assert;

	describe("exports", function() {
		it("Should have a Errors object", function() {
			assert.isObject(BOOMR.plugins.Errors);
		});

		it("Should have a is_complete() function", function() {
			assert.isFunction(BOOMR.plugins.Errors.is_complete);
		});

		it("Should be complete at this point", function() {
			assert.isTrue(BOOMR.plugins.Errors.is_complete());
		});
	});

	describe("findDuplicateError()", function() {
		it("Should return a null when not given an array", function() {
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError(null, {}));
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError(undefined, {}));
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError(false, {}));
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError(1, {}));
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError("s", {}));
		});

		it("Should return a null when not given an object", function() {
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError([]));
			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError([], undefined));
		});

		it("Should find the same BoomerangError object in the array", function() {
			var be = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var ary = [be];

			assert.equal(BOOMR.plugins.Errors.findDuplicateError(ary, be), be);
		});

		it("Should find a BoomerangError object with the same properties", function() {
			var be1 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var be2 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var ary = [be1];

			assert.equal(BOOMR.plugins.Errors.findDuplicateError(ary, be2), be1);
		});

		it("Should not find anything when a BoomerangError objects have different properties", function() {
			var be1 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var be2 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error1",
				functionName: "foo"
			});
			var ary = [be1];

			assert.isUndefined(BOOMR.plugins.Errors.findDuplicateError(ary, be2));
		});
	});

	describe("mergeDuplicateErrors()", function() {
		it("Should not throw an error when not given an array", function() {
			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(null, {}));
			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(undefined, {}));
			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(false, {}));
			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(1, {}));
			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors("s", {}));
		});

		it("Should not modify the array when not given an object", function() {
			var ary = [];

			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(ary));
			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(ary, undefined));

			assert.deepEqual(ary, []);
		});

		it("Should increment the count of the same BoomerangError object in the array", function() {
			var be = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var ary = [be];

			assert.equal(be.count, 1);

			assert.isDefined(BOOMR.plugins.Errors.mergeDuplicateErrors(ary, be, true));

			assert.equal(be.count, 2);
		});

		it("Should increment the count of a BoomerangError object with the same properties", function() {
			var be1 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var be2 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var ary = [be1];

			assert.equal(be1.count, 1);

			assert.isDefined(BOOMR.plugins.Errors.mergeDuplicateErrors(ary, be2, true));

			assert.equal(be1.count, 2);
		});

		it("Should not increment the count when a BoomerangError objects ahve different properties", function() {
			var be1 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error",
				functionName: "foo"
			});
			var be2 = new BOOMR.plugins.Errors.BoomerangError({
				code: 1,
				message: "error1",
				functionName: "foo"
			});
			var ary = [be1];

			assert.equal(be1.count, 1);

			assert.isUndefined(BOOMR.plugins.Errors.mergeDuplicateErrors(ary, be2));

			assert.equal(be1.count, 1);
			assert.equal(be2.count, 1);
		});
	});

	describe("compressErrors()", function() {
		it("Should minimize a BoomerangError that has no data", function() {
			var err = new BOOMR.plugins.Errors.BoomerangError();

			var c = BOOMR.plugins.Errors.compressErrors([err])[0];

			assert.isUndefined(c.n);
			assert.isUndefined(c.f);
			assert.isUndefined(c.e);
			assert.isUndefined(c.s);
			assert.isUndefined(c.v);
			assert.isUndefined(c.t);
			assert.isUndefined(c.m);
			assert.isUndefined(c.c);
		});

		it("Should minimize a BoomerangError that has defaults for via, source and type", function() {
			var err = new BOOMR.plugins.Errors.BoomerangError({
				via: BOOMR.plugins.Errors.VIA_APP,
				source: BOOMR.plugins.Errors.SOURCE_APP,
				type: "Error"
			});

			var c = BOOMR.plugins.Errors.compressErrors([err])[0];

			assert.isUndefined(c.n);
			assert.isUndefined(c.f);
			assert.isUndefined(c.e);
			assert.isUndefined(c.s);
			assert.isUndefined(c.v);
			assert.isUndefined(c.t);
			assert.isUndefined(c.m);
			assert.isUndefined(c.c);
		});

		it("Should minimize a BoomerangError that has values for everything", function() {
			var now = BOOMR.now();

			var err = new BOOMR.plugins.Errors.BoomerangError({
				count: 2,
				frames: [{
					functionName: "Foo",
					lineNumber: 10,
					columnNumber: 10,
					fileName: "/foo.html"
				}],
				via: BOOMR.plugins.Errors.VIA_CONSOLE,
				source: BOOMR.plugins.Errors.SOURCE_BOOMERANG,
				type: "TypeError",
				message: "OHNO",
				code: 10,
				timestamp: now
			});

			var c = BOOMR.plugins.Errors.compressErrors([err])[0];

			assert.equal(c.n, 2);

			var frame = c.f[0];
			assert.equal(frame.f, "Foo");
			assert.equal(frame.l, 10);
			assert.equal(frame.c, 10);
			assert.equal(frame.w, "/foo.html");

			assert.equal(c.s, BOOMR.plugins.Errors.SOURCE_BOOMERANG);
			assert.equal(c.v, BOOMR.plugins.Errors.VIA_CONSOLE);
			assert.equal(c.t, "TypeError");
			assert.equal(c.m, "OHNO");
			assert.equal(c.c, 10);
			assert.equal(c.d, now.toString(36));
		});
	});

	describe("decompressErrors()", function() {
		it("Should decompress a BoomerangError that has no data", function() {
			var err = new BOOMR.plugins.Errors.BoomerangError();

			var c = BOOMR.plugins.Errors.compressErrors([err])[0];
			var d = BOOMR.plugins.Errors.decompressErrors([c])[0];

			assert.equal(d.count, 1);
			assert.equal(d.events.length, 0);
			assert.equal(d.frames.length, 0);
			assert.equal(d.source, BOOMR.plugins.Errors.SOURCE_APP);
			assert.equal(d.stack, "");
			assert.equal(d.type, "Error");
			assert.equal(d.via, BOOMR.plugins.Errors.VIA_APP);
		});

		it("Should decompress a BoomerangError that has values for everything", function() {
			var err = new BOOMR.plugins.Errors.BoomerangError({
				count: 2,
				frames: [{
					functionName: "Foo",
					lineNumber: 10,
					columnNumber: 10,
					fileName: "/foo.html"
				}],
				via: BOOMR.plugins.Errors.VIA_CONSOLE,
				source: BOOMR.plugins.Errors.SOURCE_BOOMERANG,
				type: "TypeError",
				message: "OHNO",
				code: 10
			});

			var c = BOOMR.plugins.Errors.compressErrors([err])[0];
			var d = BOOMR.plugins.Errors.decompressErrors([c])[0];

			assert.equal(d.count, 2);
			assert.equal(d.events.length, 0);
			assert.equal(d.frames.length, 1);
			assert.equal(d.frames[0].functionName, "Foo");
			assert.equal(d.frames[0].lineNumber, 10);
			assert.equal(d.frames[0].columnNumber, 10);
			assert.equal(d.frames[0].fileName, "/foo.html");
			assert.equal(d.source, BOOMR.plugins.Errors.SOURCE_BOOMERANG);
			assert.include(d.stack, "OHNO");
			assert.include(d.stack, "/foo.html");
			assert.include(d.stack, "Foo");
			assert.include(d.stack, "10:10");
			assert.equal(d.type, "TypeError");
			assert.equal(d.message, "OHNO");
			assert.equal(d.code, 10);
			assert.equal(d.via, BOOMR.plugins.Errors.VIA_CONSOLE);
		});
	});

	describe("normalizeToString()", function() {
		it("Should return 'undefined' for undefined", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(), "undefined");
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(undefined), "undefined");
		});

		it("Should return 'null' for null", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(null), "null");
		});

		it("Should return '(empty string)' for an empty string", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(""), "(empty string)");
		});

		it("Should return the string for a string", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString("a"), "a");
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString("abc"), "abc");
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString("abc123"), "abc123");
		});

		it("Should return a number for a number", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(1), "1");
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(1.2), "1.2");
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(1000), "1000");
		});

		it("Should return '0' for 0", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(0), "0");
		});

		it("Should return 'false' for false", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(false), "false");
		});

		it("Should return 'NaN' for NaN", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(NaN), "NaN");
		});

		it("Should return '(function)' for a function", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(function(){}), "(function)");
		});

		it("Should return '' for an empty array", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString([]), "");
		});

		it("Should return '1' for an array with one element", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString([1]), "1");
		});

		it("Should return '1,2' for a an array with two elements", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString([1, 2]), "1,2");
		});

		it("Should return 'a' for a a string array", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(["a"]), "a");
		});

		it("Should return 'a,bc' for a a string array with two elements", function() {
			assert.strictEqual(BOOMR.plugins.Errors.normalizeToString(["a", "bc"]), "a,bc");
		});
	});

	describe("BoomerangError", function() {
		it("Should create an empty object when given no properties", function() {
			var be = new BOOMR.plugins.Errors.BoomerangError();

			assert.isUndefined(be.code);
			assert.isUndefined(be.message);
			assert.isUndefined(be.functionName);
			assert.isUndefined(be.fileName);
			assert.isUndefined(be.lineNumber);
			assert.isUndefined(be.columnNumber);
			assert.isUndefined(be.stack);
			assert.isUndefined(be.type);
			assert.isUndefined(be.via);

			// defaults
			assert.strictEqual(be.source, BOOMR.plugins.Errors.SOURCE_APP);
			assert.deepEqual(be.events, []);
			assert.strictEqual(be.count, 1);
		});

		it("Should have the same properites as given", function() {
			var config = {
				code: 1,
				message: "a",
				functionName: "b",
				fileName: "c",
				lineNumber: 2,
				columnNumber: 3,
				stack: "d",
				type: "Error",
				via: 4,
				source: 5,
				events: [1, 2, 3]
			};

			var be = new BOOMR.plugins.Errors.BoomerangError(config);

			assert.strictEqual(be.code, 1);
			assert.strictEqual(be.message, "a");
			assert.strictEqual(be.functionName, "b");
			assert.strictEqual(be.fileName, "c");
			assert.strictEqual(be.lineNumber, 2);
			assert.strictEqual(be.columnNumber, 3);
			assert.strictEqual(be.stack, "d");
			assert.strictEqual(be.type, "Error");
			assert.strictEqual(be.via, 4);
			assert.strictEqual(be.source, 5);
			assert.deepEqual(be.events, [1, 2, 3]);
			assert.strictEqual(be.count, 1);
		});

		describe("equals()", function() {
			it("Should return true for two objects with the same properties", function() {
				var config = {
					code: 1,
					message: "a",
					functionName: "b",
					fileName: "c",
					lineNumber: 2,
					columnNumber: 3,
					stack: "d",
					type: 4,
					via: 5,
					source: 6,
					events: [1, 2, 3]
				};

				var be1 = new BOOMR.plugins.Errors.BoomerangError(config);
				var be2 = new BOOMR.plugins.Errors.BoomerangError(config);

				assert.strictEqual(be1.equals(be2), true);
				assert.strictEqual(be2.equals(be1), true);
			});

			it("Should return false if one property differs", function() {
				var config = {
					code: 1,
					message: "a",
					functionName: "b",
					fileName: "c",
					lineNumber: 2,
					columnNumber: 3,
					stack: "d",
					type: 4,
					via: 5,
					source: 6,
					events: [1, 2, 3]
				};

				var be1 = new BOOMR.plugins.Errors.BoomerangError(config);

				// change 1 property
				config.code = 2;
				var be2 = new BOOMR.plugins.Errors.BoomerangError(config);

				assert.strictEqual(be1.equals(be2), false);
				assert.strictEqual(be2.equals(be1), false);
			});

			it("Should return true if just the counts differ", function() {
				var config = {
					code: 1
				};

				var be1 = new BOOMR.plugins.Errors.BoomerangError(config);
				var be2 = new BOOMR.plugins.Errors.BoomerangError(config);

				be1.count = 2;

				assert.strictEqual(be1.equals(be2), true);
				assert.strictEqual(be2.equals(be1), true);
			});

			it("Should return true if just the events differ", function() {
				var config = {
					code: 1,
					events: []
				};

				var be1 = new BOOMR.plugins.Errors.BoomerangError(config);

				config.events = [1];
				var be2 = new BOOMR.plugins.Errors.BoomerangError(config);

				assert.strictEqual(be1.equals(be2), true);
				assert.strictEqual(be2.equals(be1), true);
			});
		});

		describe("fromError()", function() {
			it("Should return null if not given an error", function() {
				assert.strictEqual(BOOMR.plugins.Errors.BoomerangError.fromError(), null);
				assert.strictEqual(BOOMR.plugins.Errors.BoomerangError.fromError(null), null);
				assert.strictEqual(BOOMR.plugins.Errors.BoomerangError.fromError(undefined), null);
			});

			it("Should return an object if given an Error", function() {
				var err;
				var ln = 0;

				try {
					throw new Error("Test");
				}
				catch (err2) {
					err = err2;

					// 6 lines up
					ln = err.lineNumber ? (err.lineNumber - 6) : 0;
				}

				var be = BOOMR.plugins.Errors.BoomerangError.fromError(err, BOOMR.plugins.Errors.VIA_APP, BOOMR.plugins.Errors.SOURCE_APP);

				// character count may differ amongst browsers
				if (be.columnNumber) {
					assert.closeTo(be.columnNumber, 15, 15);
				}

				assert.strictEqual(be.count, 1);

				if (be.fileName) {
					assert.include(be.fileName, "04-plugins-errors");
				}

				// not all browsers will emit functionName
				if (be.functionName) {
					assert.isTrue(be.functionName.indexOf("Context.<anonymous>") !== -1 ||
						be.functionName.indexOf("context.<anonymous>") !== -1 ||
						be.functionName.indexOf("Anonymous") !== -1);
				}

				if (ln !== 0 && be.lineNumber) {
					assert.closeTo(be.lineNumber, ln, 10);
				}

				assert.strictEqual(be.message, "Test");
				assert.strictEqual(be.source, BOOMR.plugins.Errors.SOURCE_APP);
				assert.strictEqual(be.type, "Error");

				if (be.stack) {
					assert.include(be.stack, "Test");
				}
			});
		});
	});
});
