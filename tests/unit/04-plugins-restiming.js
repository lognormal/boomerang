/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.ResourceTiming", function() {
	var assert = chai.assert;

	describe("exports", function() {
		it("Should have a ResourceTiming object", function() {
			assert.isObject(BOOMR.plugins.ResourceTiming);
		});

		it("Should have a is_complete() function", function() {
			assert.isFunction(BOOMR.plugins.ResourceTiming.is_complete);
		});

		it("Should have a is_supported() function", function() {
			assert.isFunction(BOOMR.plugins.ResourceTiming.is_supported);
		});

		it("Should always be complete", function() {
			assert.isTrue(BOOMR.plugins.ResourceTiming.is_complete());
		});

		it("Should always be complete", function() {
			BOOMR.plugins.ResourceTiming.init();
			assert.isTrue(BOOMR.plugins.ResourceTiming.is_complete());
		});
	});

	//
	// .toBase36
	//
	describe("toBase36()", function() {
		it("should return the base 36 equivalent of 100", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(100), "2s");
		});

		it("should return an empty string if the input is not a number", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(), "");
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(""), "");
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36("a"), "");
		});

		it("should return an empty string if the input is 0", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(0), "");
		});
	});

	//
	// .trimTiming
	//
	describe("trimTiming()", function() {
		it("should handle 0", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(0), 0);
		});

		it("should handle undefined", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(), 0);
		});

		it("should handle non-numbers", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming("a"), 0);
		});

		it("should round to the nearest number", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(0, 0), 0);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100, 0), 100);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.5, 0), 101);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.01, 0), 100);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.99, 0), 101);
		});

		it("should round when given a navtiming offset", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100), 100);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100, 1), 99);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.12, 1.12), 99);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100, 100), 0);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100, 101), -1);
		});
	});

	//
	// .convertToTrie
	//
	describe("convertToTrie()", function() {
		it("should convert a single node", function() {
			var data = {"abc": "abc"};
			var expected = {
				"a": {
					"b": {
						"c": "abc"
					}
				}
			};
			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});

		it("should convert a two-node tree whose nodes don't intersect", function() {
			var data = {"abc": "abc", "xyz": "xyz"};
			var expected = {
				"a": {
					"b": {
						"c": "abc"
					}
				},
				"x": {
					"y": {
						"z": "xyz"
					}
				}
			};
			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});

		it("should convert a complex tree", function() {
			var data = {"abc": "abc", "abcd": "abcd", "ab": "ab"};
			var expected = {
				"a": {
					"b": {
						"|": "ab",
						"c": {
							"|": "abc",
							"d": "abcd"
						}
					}
				}
			};
			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});

		it("should should break 'href' for NoScript", function() {
			var data = {"href": "abc"};
			var expected = {
				"h": {
					"\n": {
						"r": {
							"e": {
								"f": "abc"
							}
						}
					}
				}
			};

			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});

		it("should should break 'src' for NoScript", function() {
			var data = {"src": "abc"};
			var expected = {
				"s": {
					"\n": {
						"r": {
							"c": "abc"
						}
					}
				}
			};

			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});

		it("should should break 'action' for NoScript", function() {
			var data = {"action": "abc"};
			var expected = {
				"a": {
					"\n": {
						"c": {
							"t": {
								"i": {
									"o": {
										"n": "abc"
									}
								}
							}
						}
					}
				}
			};

			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});

		it("should update XSS words from config.js", function() {
			BOOMR.init({
				ResourceTiming: {
					enabled: true,
					xssBreakWords:  [
						/(h)(ref)/gi,
						/(s)(rc)/gi,
						/(a)(ction)/gi,
						/(m)(oo)/gi
					]
				}
			});

			var data = {"moo": "abc"};
			var expected = {
				"m": {
					"\n": {
						"o": {
							"o": "abc"
						}
					}
				}
			};

			assert.deepEqual(BOOMR.plugins.ResourceTiming.convertToTrie(data), expected);
		});
	});

	//
	// .optimizeTrie
	//
	describe("optimizeTrie()", function() {
		it("should optimize a single-node tree", function() {
			var data = {"abc": "abc"};
			var expected = {
				"abc": "abc"
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("should optimize a simple tree", function() {
			var data = {"abc": "abc", "xyz": "xyz"};
			var expected = {
				"abc": "abc",
				"xyz": "xyz"
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("should optimize a complex tree", function() {
			var data = {"abc": "abc", "abcd": "abcd", "ab": "ab"};
			var expected = {
				"ab":
				{
					"|": "ab",
					"c": {
						"|": "abc",
						"d": "abcd"
					}
				}
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("should optimize a single-node tree with more characters", function() {
			var data = {"abcde": "abcde"};
			var expected = {
				"abcde": "abcde"
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("should should break 'href' for NoScript", function() {
			var data = {"href": "abc" };
			var expected = {
				"h": {
					"ref": "abc"
				}
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			var optTrie = BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true);
			var optTrieJson = JSON.stringify(optTrie);

			assert.deepEqual(optTrie, expected);

			assert.equal(optTrieJson.indexOf("href"), -1);
		});

		it("should should break 'href', 'action' and 'src' for NoScript", function() {
			var data = {"href": "abc", "123action123": "abc", "_src_abc_action123": "abc" };
			var expected = {
				"_s": {
					"rc_abc_a": {
						"ction123": "abc"
					}
				},
				"123a": {
					"ction123": "abc"
				},
				"h": {
					"ref": "abc"
				}
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			var optTrie = BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true);
			var optTrieJson = JSON.stringify(optTrie);

			assert.deepEqual(optTrie, expected);

			assert.equal(optTrieJson.indexOf("href"), -1);
		});
	});

	describe("findPerformanceEntriesForFrame()", function() {
		it("Should get the correct entries for this page", function() {
			//
			// NOTE: If you change the resources for this test suite (index.html), this test will
			// need to be updated.
			//

			var entries = BOOMR.plugins.ResourceTiming.findPerformanceEntriesForFrame(window, true);

			// NOTE: what is tested depends on the environment, whether it supports ResourceTiming or not
			if (!BOOMR.plugins.ResourceTiming.is_supported()) {
				assert.strictEqual(0, entries.length);
				return;
			}

			// first entry is faked navigationTiming data
			assert.strictEqual(0, entries[0].startTime);
			assert.strictEqual(BOOMR.utils.cleanupURL(document.URL), entries[0].name);

			// we could add more, but this should cover it
			var entriesToFind = [
				{ url: "/tests/vendor/mocha/mocha.css", initiatorType: "link" },
				{ url: "/tests/vendor/mocha/mocha.js", initiatorType: "script" },
				{ url: "/tests/vendor/assertive-chai/dist/assertive-chai.js", initiatorType: "script" }
			];

			// we don't know what order these will come in, so grep thru the list
			for (var i = 0; i < entriesToFind.length; i++) {
				var entryToFind = entriesToFind[i];

				var found = false;
				for (var j = 0; j < entries.length; j++) {
					if (entries[j].name.indexOf(entryToFind.url) &&
						entries[j].initiatorType &&
						entries[j].initiatorType === entryToFind.initiatorType) {
						found = true;
						break;
					}
				}

				assert.isTrue(found);
			}
		});
	});

	describe("getCompressedResourceTiming()", function() {
		it("Should get the ResourceTiming trie", function() {
			//
			// NOTE: If you change the resources for this test suite (test-boomerang.html), this test will
			// need to be updated.
			//

			var trie = BOOMR.plugins.ResourceTiming.getCompressedResourceTiming();

			// NOTE: what is tested depends on the environment, whether it supports ResourceTiming or not
			if (!BOOMR.plugins.ResourceTiming.is_supported()) {
				assert.deepEqual({}, trie);
				return;
			}

			// get the first key, which is our base URL
			var baseUrl = "";
			for (var key in trie) {
				baseUrl = key;
			}

			// first entry is faked navigationTiming data
			assert.isObject(trie[baseUrl]);

			//
			// NOTE: this test doesn't work in Karma in C/IE/FF, only in real C/IE/FF and PhantomJS
			// This is due to different RT entries getting downloaded in the different environment
			//
			if (typeof trie[baseUrl]["build/boomerang-latest-debug.js"] === "string") {
				// build/ boomerang .js file
				assert.isString(trie[baseUrl]["build/boomerang-latest-debug.js"]);
				assert.equal("3", trie[baseUrl]["build/boomerang-latest-debug.js"][0]);

				// other entries will be under vendor
				assert.isObject(trie[baseUrl]["vendor/"]);
			}
		});
	});

	describe("calculateResourceTimingUnion()", function() {
		it("Should return 0 if given an empty list", function() {
			assert.deepEqual(0, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion());
		});

		it("Should return the duration of a single resource", function() {
			assert.deepEqual(100, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}]));
		});

		it("Should return the duration of two resources that don't overlap", function() {
			assert.deepEqual(200, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 120,
				responseEnd: 220
			}]));
		});

		it("Should return the duration of three resources that don't overlap", function() {
			assert.deepEqual(300, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 120,
				responseEnd: 220
			}, {
				fetchStart: 530,
				responseEnd: 630
			}]));
		});

		it("Should return the duration of two resources, one of which is completely within the other one", function() {
			assert.deepEqual(100, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 50,
				responseEnd: 100
			}]));
		});

		it("Should return the duration of two resources, one of which is partially within the other one", function() {
			assert.deepEqual(200, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 100,
				responseEnd: 210
			}]));
		});

		it("Should return the duration of three resources, one of which is partially within the other one", function() {
			assert.deepEqual(300, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 100,
				responseEnd: 210
			}, {
				fetchStart: 300,
				responseEnd: 400
			}]));
		});

		it("Should return the duration of three resources, two of which are completely within the other one", function() {
			assert.deepEqual(300, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 100,
				responseEnd: 210
			}, {
				fetchStart: 300,
				responseEnd: 400
			}]));
		});

		it("Should return the duration of three resources, one of which are completely within the other one, and one of which is completely within the other", function() {
			assert.deepEqual(200, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 50,
				responseEnd: 100
			}, {
				fetchStart: 100,
				responseEnd: 210
			}]));
		});

		it("Should return the duration of three resources, with each overlapping the other", function() {
			assert.deepEqual(300, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 100,
				responseEnd: 210
			}, {
				fetchStart: 200,
				responseEnd: 310
			}]));
		});

		it("Should return the duration of three resources, with the later two overlapping each other partially", function() {
			assert.deepEqual(200, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 210,
				responseEnd: 310
			}, {
				fetchStart: 300,
				responseEnd: 310
			}]));
		});

		it("Should return the duration of three resources, with the later two overlapping each other completely", function() {
			assert.deepEqual(200, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 10,
				responseStart: 110
			}, {
				fetchStart: 210,
				responseEnd: 310
			}, {
				fetchStart: 250,
				responseEnd: 260
			}]));
		});
	});
});
