/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.mq", function() {
	var assert = chai.assert;

	describe("exports", function() {
		it("Should have a BOOMR_mq object", function() {
			assert.isObject(BOOMR.window.BOOMR_mq);
		});

		it("Should have a push() function", function() {
			assert.isFunction(BOOMR.window.BOOMR_mq.push);
		});
	});

	describe("push()", function() {
		it("Should handle degenerate cases", function() {
			assert.doesNotThrow(function() {
				BOOMR_mq.push(
					null,
					undefined,
					false,
					true,
					"null",
					"undefined",
					"false",
					"true",
					"",
					0,
					1,
					27,
					[],
					{},
					["foo"],
					["foo.bar"],
					["foo.bar.baz"]
				);
			});
		});

		describe("array pattern", function() {
			it("Should call methods on BOOMR", function(done) {
				BOOMR.method = function() {
					done();
				};
				BOOMR_mq.push(["method"]);
			});

			it("Should call namespaced methods on BOOMR", function(done) {
				BOOMR.method = function() {
					done();
				};
				BOOMR_mq.push(["BOOMR.method"]);
			});

			it("Should pass all arguments", function(done) {
				BOOMR.method = function() {
					assert.lengthOf(arguments, 3);
					assert.equal(arguments[0], 0);
					assert.equal(arguments[1], 1);
					assert.equal(arguments[2], 2);
					done();
				};
				BOOMR_mq.push(["method", 0, 1, 2]);
			});

			it("Should support `push` with multiple arguments", function(done) {
				var results = [];
				BOOMR.method1 = function() {
					results.push("method1");
				};
				BOOMR.method2 = function() {
					results.push("method2");
				};
				BOOMR.method3 = function() {
					assert.lengthOf(results, 2);
					assert.equal(results[0], "method1");
					assert.equal(results[1], "method2");
					done();
				};
				BOOMR_mq.push(
						["method1"],
						["method2"],
						["method3"]
				);
			});

			it("Should step into objects on BOOMR", function(done) {
				BOOMR.obj = {
					method: function() {
						done();
					}
				};
				BOOMR_mq.push(["obj.method"]);
			});

			it("Should step into functions on BOOMR", function(done) {
				BOOMR.func = function() {};
				BOOMR.func.method = function() {
					done();
				};
				BOOMR_mq.push(["func.method"]);
			});

			it("Should use appropriate context", function(done) {
				BOOMR.obj = {
					method1: function() {
						this.method2();
					},
					method2: function() {
						done();
					}
				};
				BOOMR_mq.push(["obj.method1"]);
			});
		});

		describe("object pattern", function() {
			it("Should support `arguments`", function(done) {
				BOOMR.method = function() {
					done();
				};
				BOOMR_mq.push({
					arguments: ["method"]
				});
			});
			it("Should support `callback`", function(done) {
				BOOMR.method = function() {
					return 123;
				};
				BOOMR_mq.push({
					arguments: ["method"],
					callback: function() {
						assert.lengthOf(arguments, 1);
						assert.equal(arguments[0], 123);
						done();
					}
				});
			});
			it("Should support `thisArg`", function(done) {
				function Item(value) {
					this.value = value;
				}
				Item.prototype.callback = function() {
					assert.equal(this.value, 123);
					done();
				};

				BOOMR.method = function() {};
				BOOMR_mq.push({
					arguments: ["method"],
					callback: Item.prototype.callback,
					thisArg: new Item(123)
				});
			});
		});
	});

});
