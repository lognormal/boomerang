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
		it("Should return the base 36 equivalent of 100", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(100), "2s");
		});

		it("Should return an empty string if the input is not a number or a number", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(), "");
		});

		it("Should return the input string if given a string", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(""), "");
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36("a"), "a");
		});

		it("Should return an empty string if the input is 0", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.toBase36(0), "");
		});
	});

	//
	// .trimTiming
	//
	describe("trimTiming()", function() {
		it("Should handle 0", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(0), 0);
		});

		it("Should handle undefined", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(), 0);
		});

		it("Should handle non-numbers", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming("a"), 0);
		});

		it("Should round to the nearest number", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(0, 0), 0);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100, 0), 100);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.5, 0), 101);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.01, 0), 100);
			assert.equal(BOOMR.plugins.ResourceTiming.trimTiming(100.99, 0), 101);
		});

		it("Should round when given a navtiming offset", function() {
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
		it("Should convert a single node", function() {
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

		it("Should convert a two-node tree whose nodes don't intersect", function() {
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

		it("Should convert a complex tree", function() {
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

		it("Should should break 'href' for NoScript", function() {
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

		it("Should should break 'src' for NoScript", function() {
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

		it("Should should break 'action' for NoScript", function() {
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

		it("Should update XSS words from config", function() {
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
		it("Should optimize a single-node tree", function() {
			var data = {"abc": "abc"};
			var expected = {
				"abc": "abc"
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("Should optimize a simple tree", function() {
			var data = {"abc": "abc", "xyz": "xyz"};
			var expected = {
				"abc": "abc",
				"xyz": "xyz"
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("Should optimize a complex tree", function() {
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

		it("Should optimize a single-node tree with more characters", function() {
			var data = {"abcde": "abcde"};
			var expected = {
				"abcde": "abcde"
			};

			var trie = BOOMR.plugins.ResourceTiming.convertToTrie(data);

			assert.deepEqual(BOOMR.plugins.ResourceTiming.optimizeTrie(trie, true), expected);
		});

		it("Should should break 'href' for NoScript", function() {
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

		it("Should should break 'href', 'action' and 'src' for NoScript", function() {
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
				assert.deepEqual({}, trie.restiming);
				return;
			}

			// get the first key, which is our base URL
			var baseUrl = "";
			for (var key in trie.restiming) {
				baseUrl = key;
			}

			// first entry is faked navigationTiming data
			assert.isObject(trie.restiming[baseUrl]);

			//
			// NOTE: this test doesn't work in Karma in C/IE/FF, only in real C/IE/FF and PhantomJS
			// This is due to different RT entries getting downloaded in the different environment
			//
			if (typeof trie.restiming[baseUrl]["build/boomerang-latest-debug.js"] === "string") {
				// build/ boomerang .js file
				assert.isString(trie.restiming[baseUrl]["build/boomerang-latest-debug.js"]);
				assert.equal("3", trie.restiming[baseUrl]["build/boomerang-latest-debug.js"][0]);

				// other entries will be under vendor
				assert.isObject(trie.restiming[baseUrl]["vendor/"]);
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

		it("Should return the duration of three resources of the same duration", function() {
			assert.deepEqual(1, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 1
			}, {
				fetchStart: 0,
				responseEnd: 1
			}, {
				fetchStart: 0,
				responseEnd: 1
			}]));
		});

		it("Should return the duration of 6 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}]));
		});

		it("Should return the duration of 7 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}, {
				fetchStart: 1,
				responseEnd: 44
			}]));
		});

		it("Should return the duration of 8 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}, {
				fetchStart: 1,
				responseEnd: 44
			}, {
				fetchStart: 2,
				responseEnd: 43
			}]));
		});

		it("Should return the duration of 9 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}, {
				fetchStart: 1,
				responseEnd: 44
			}, {
				fetchStart: 2,
				responseEnd: 43
			}, {
				fetchStart: 3,
				responseEnd: 42
			}]));
		});

		it("Should return the duration of 10 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}, {
				fetchStart: 1,
				responseEnd: 44
			}, {
				fetchStart: 2,
				responseEnd: 43
			}, {
				fetchStart: 3,
				responseEnd: 42
			}, {
				fetchStart: 4,
				responseEnd: 44
			}]));
		});

		it("Should return the duration of 10 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}, {
				fetchStart: 1,
				responseEnd: 44
			}, {
				fetchStart: 2,
				responseEnd: 43
			}, {
				fetchStart: 3,
				responseEnd: 42
			}, {
				fetchStart: 4,
				responseEnd: 44
			}, {
				fetchStart: 1,
				responseEnd: 40
			}]));
		});

		it("Should return the duration of 12 resources", function() {
			assert.deepEqual(74, BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion([{
				fetchStart: 0,
				responseStart: 45
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 103
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 102
			}, {
				fetchStart: 100,
				responseEnd: 129
			}, {
				fetchStart: 1,
				responseEnd: 44
			}, {
				fetchStart: 2,
				responseEnd: 43
			}, {
				fetchStart: 3,
				responseEnd: 42
			}, {
				fetchStart: 4,
				responseEnd: 41
			}, {
				fetchStart: 4,
				responseEnd: 44
			}, {
				fetchStart: 1,
				responseEnd: 40
			}]));
		});
	});

	describe("reduceFetchStarts()", function() {
		it("Should return [] if given an empty list", function() {
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts([]));
		});

		it("Should return [] if given not a list", function() {
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts());
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(null));
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(false));
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(true));
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(1));
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(1.0));
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(-1));
			assert.deepEqual([], BOOMR.plugins.ResourceTiming.reduceFetchStarts(0));
		});

		it("Should return a single resource if given a single resource", function() {
			assert.deepEqual([{
				fetchStart: 10,
				responseEnd: 10
			}], BOOMR.plugins.ResourceTiming.reduceFetchStarts([{
				fetchStart: 10,
				responseEnd: 10
			}]));
		});

		it("Should return two non-same-start resources", function() {
			assert.deepEqual(
				[{ fetchStart: 0, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }],
				BOOMR.plugins.ResourceTiming.reduceFetchStarts([
					{ fetchStart: 0, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }
				]));
		});

		it("Should return a single resource from two with the same start time", function() {
			assert.deepEqual(
				[{ fetchStart: 1, responseEnd: 10 }],
				BOOMR.plugins.ResourceTiming.reduceFetchStarts([
					{ fetchStart: 1, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }
				]));
		});

		it("Should return a single resource from two with the same start time where the second one is longer", function() {
			assert.deepEqual(
				[{ fetchStart: 1, responseEnd: 15 }],
				BOOMR.plugins.ResourceTiming.reduceFetchStarts([
					{ fetchStart: 1, responseEnd: 10 }, { fetchStart: 1, responseEnd: 15 }
				]));
		});

		it("Should return a single resource from 3 with the same start time", function() {
			assert.deepEqual(
				[{ fetchStart: 1, responseEnd: 10 }],
				BOOMR.plugins.ResourceTiming.reduceFetchStarts([
					{ fetchStart: 1, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }
				]));
		});

		it("Should return two resources from two with the same start time and one with a different", function() {
			assert.deepEqual(
				[{ fetchStart: 0, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }],
				BOOMR.plugins.ResourceTiming.reduceFetchStarts([
					{ fetchStart: 0, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }, { fetchStart: 1, responseEnd: 10 }
				]));
		});
	});

	describe("compressSize()", function() {
		it("Should return an empty string if ResourceTiming2 is not supported", function() {
			assert.equal("", BOOMR.plugins.ResourceTiming.compressSize({}));
		});

		// X-O: [0, 0, 0] -> [0, 0, 0] -> [empty]
		it("Should return an empty string for cross-origin resources", function() {
			assert.equal("", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 0,
				encodedBodySize: 0,
				decodedBodySize: 0
			}));
		});

		// 204: [t, 0, 0] -> [t, 0, 0] -> [e, t-e]
		it("Should return [e, t-e, d-e] -> [0, t, 0] -> ',t,0' -> ',t' for 204 responses", function() {
			assert.equal(",a", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 10,
				encodedBodySize: 0,
				decodedBodySize: 0
			}));
		});

		// 304: [t: t <=> e, e, d: d>=e] -> [e, t-e, d-e]
		it("Should return [e, t-e, d-e] -> [e, dt, dd] -> 'e,dt,0' -> 'e,dt' for 304 responses (t > e, d = e)", function() {
			assert.equal("a,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 15,
				encodedBodySize: 10,
				decodedBodySize: 10
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, dd] -> 'e,-dt,0' -> 'e,-dt' for 304 responses (t < e, d = e)", function() {
			assert.equal("a,-5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 5,
				encodedBodySize: 10,
				decodedBodySize: 10
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, dd] -> 'e,0,0' -> 'e' for 304 responses (t = e, d = e)", function() {
			assert.equal("a", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 10
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, dd] -> 'e,dt,dd' for 304 responses (t > e, d > e)", function() {
			assert.equal("a,a,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 20,
				encodedBodySize: 10,
				decodedBodySize: 15
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, dd] -> 'e,-dt,dd' for 304 responses (t < e, d > e)", function() {
			assert.equal("a,-5,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 5,
				encodedBodySize: 10,
				decodedBodySize: 15
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, dd] -> 'e,0,dd' -> 'e,,dd' for 304 responses (t = e, d > e)", function() {
			assert.equal("a,,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 15
			}));
		});

		// 200 non-gzipped: [t: t>=e, e, d: d=e] -> [e, t-e]
		it("Should return [e, t-e, d-e] -> [e, dt, 0] -> 'e,0' -> 'e' for 200 non-gzipped responses (t = e)", function() {
			assert.equal("a", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 10
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, 0] -> 'e,dt' for 200 non-gzipped responses (t > e)", function() {
			assert.equal("a,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 15,
				encodedBodySize: 10,
				decodedBodySize: 10
			}));
		});

		// 200 gzipped: [t: t>=e, e, d: d>=e] -> [e, t-e, d-e]
		it("Should return [e, t-e, d-e] -> [e, dt, 0] -> 'e,0,dd' -> 'e,,dd' for 200 gzipped responses (t = e, d > e)", function() {
			assert.equal("a,,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 15
			}));
		});

		it("Should return [e, t-e, d-e] -> [e, dt, 0] -> 'e,dt,dd' for 200 gzipped responses (t > e, d > e)", function() {
			assert.equal("a,5,a", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 15,
				encodedBodySize: 10,
				decodedBodySize: 20
			}));
		});

		// retrieved from cache non-gzipped: [0, e, d: d=e] -> [e]
		it("Should return [e, t-e, d-e] -> [e, _, dd] -> 'e,_,0' -> 'e,_' for cached non-gzipped responses", function() {
			assert.equal("a,_", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 0,
				encodedBodySize: 10,
				decodedBodySize: 10
			}));
		});

		// retrieved from cache gzipped: [0, e, d: d>=e] -> [e, _, d-e]
		it("Should return [e, t-e, d-e] -> [e, _, dd] -> 'e,_,dd' -> 'e,_,dd' for cached gzipped responses", function() {
			assert.equal("a,_,5", BOOMR.plugins.ResourceTiming.compressSize({
				transferSize: 0,
				encodedBodySize: 10,
				decodedBodySize: 15
			}));
		});
	});

	describe("decompressSize()", function() {
		// X-O: [0, 0, 0] -> [0, 0, 0] -> [empty]
		it("Should reverse cross-origin resources", function() {
			assert.deepEqual({
				transferSize: 0,
				encodedBodySize: 0,
				decodedBodySize: 0
			}, BOOMR.plugins.ResourceTiming.decompressSize(""));
		});

		// 204: [t, 0, 0] -> [t, 0, 0] -> [e, t-e]
		it("Should reverse [e, t-e, d-e] -> [0, t, 0] -> ',t,0' -> ',t' for 204 responses", function() {
			assert.deepEqual({
				transferSize: 10,
				encodedBodySize: 0,
				decodedBodySize: 0
			}, BOOMR.plugins.ResourceTiming.decompressSize(",a"));
		});

		// 304: [t: t <=> e, e, d: d>=e] -> [e, t-e, d-e]
		it("Should reverse [e, t-e, d-e] -> [e, dt, dd] -> 'e,dt,0' -> 'e,dt' for 304 responses (t > e, d = e)", function() {
			assert.deepEqual({
				transferSize: 15,
				encodedBodySize: 10,
				decodedBodySize: 10
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,5"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, dd] -> 'e,-dt,0' -> 'e,-dt' for 304 responses (t < e, d = e)", function() {
			assert.deepEqual({
				transferSize: 5,
				encodedBodySize: 10,
				decodedBodySize: 10
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,-5"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, dd] -> 'e,0,0' -> 'e' for 304 responses (t = e, d = e)", function() {
			assert.deepEqual({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 10
			}, BOOMR.plugins.ResourceTiming.decompressSize("a"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, dd] -> 'e,dt,dd' for 304 responses (t > e, d > e)", function() {
			assert.deepEqual({
				transferSize: 20,
				encodedBodySize: 10,
				decodedBodySize: 15
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,a,5"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, dd] -> 'e,-dt,dd' for 304 responses (t < e, d > e)", function() {
			assert.deepEqual({
				transferSize: 5,
				encodedBodySize: 10,
				decodedBodySize: 15
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,-5,5"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, dd] -> 'e,0,dd' -> 'e,,dd' for 304 responses (t = e, d > e)", function() {
			assert.deepEqual({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 15
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,,5"));
		});

		// 200 non-gzipped: [t: t>=e, e, d: d=e] -> [e, t-e]
		it("Should reverse [e, t-e, d-e] -> [e, dt, 0] -> 'e,0' -> 'e' for 200 non-gzipped responses (t = e)", function() {
			assert.deepEqual({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 10
			}, BOOMR.plugins.ResourceTiming.decompressSize("a"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, 0] -> 'e,dt' for 200 non-gzipped responses (t > e)", function() {
			assert.deepEqual({
				transferSize: 15,
				encodedBodySize: 10,
				decodedBodySize: 10
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,5"));
		});

		// 200 gzipped: [t: t>=e, e, d: d>=e] -> [e, t-e, d-e]
		it("Should reverse [e, t-e, d-e] -> [e, dt, 0] -> 'e,0,dd' -> 'e,,dd' for 200 gzipped responses (t = e, d > e)", function() {
			assert.deepEqual({
				transferSize: 10,
				encodedBodySize: 10,
				decodedBodySize: 15
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,,5"));
		});

		it("Should reverse [e, t-e, d-e] -> [e, dt, 0] -> 'e,dt,dd' for 200 gzipped responses (t > e, d > e)", function() {
			assert.deepEqual({
				transferSize: 15,
				encodedBodySize: 10,
				decodedBodySize: 20
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,5,a"));
		});

		// retrieved from cache non-gzipped: [0, e, d: d=e] -> [e]
		it("Should reverse [e, t-e, d-e] -> [e, _, dd] -> 'e,_,0' -> 'e,_' for cached non-gzipped responses", function() {
			assert.deepEqual({
				transferSize: 0,
				encodedBodySize: 10,
				decodedBodySize: 10
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,_"));
		});

		// retrieved from cache gzipped: [0, e, d: d>=e] -> [e, _, d-e]
		it("Should reverse [e, t-e, d-e] -> [e, _, dd] -> 'e,_,dd' -> 'e,_,dd' for cached gzipped responses", function() {
			assert.deepEqual({
				transferSize: 0,
				encodedBodySize: 10,
				decodedBodySize: 15
			}, BOOMR.plugins.ResourceTiming.decompressSize("a,_,5"));
		});
	});

	describe("trimUrl()", function() {
		it("Should not change the URL if given an empty second argument", function() {
			assert.equal("http://foo.com/bar", BOOMR.plugins.ResourceTiming.trimUrl("http://foo.com/bar"));
		});

		it("Should not change the URL if given no URLs to trim", function() {
			assert.equal("http://foo.com/bar", BOOMR.plugins.ResourceTiming.trimUrl("http://foo.com/bar", []));
		});

		it("Should not change the URL if the list of URLs to trim doesn't contain a match", function() {
			assert.equal("http://foo.com/bar", BOOMR.plugins.ResourceTiming.trimUrl("http://foo.com/bar", ["http://other.com"]));
		});

		it("Should trim a URL that is contained as a string in the trim list", function() {
			assert.equal("http://foo.com/...", BOOMR.plugins.ResourceTiming.trimUrl("http://foo.com/bar", ["http://foo.com/"]));
		});

		it("Should trim a URL that is contained as a regex in the trim list", function() {
			assert.equal("http://foo.com/...", BOOMR.plugins.ResourceTiming.trimUrl("http://foo.com/bar", [/(http:\/\/foo.com\/).*/]));
		});
	});

	describe("getVisibleEntries()", function() {
		it("Should get all visible entries for this page", function() {
			//
			// NOTE: If you change the resources for this test suite (index.html), this test will
			// need to be updated.
			//

			var entries = BOOMR.plugins.ResourceTiming.getVisibleEntries(window);

			// Running on the command line, so no images on the page
			if (document.getElementsByTagName("img").length === 0) {
				assert.strictEqual(Object.keys(entries).length, 0);
				return;
			}

			var host = location.protocol + "//" + location.host;
			var entriesToFind = [
				{ url: "/assets/img.jpg?0", top: 50, left: 50, height: 107, width: 107, naturalHeight: 742, naturalWidth: 2000 },
				{ url: "/assets/img.jpg?1", top: 120, left: 120, height: 201, width: 201, naturalHeight: 742, naturalWidth: 2000 },
				{ url: "/assets/img.jpg?2", top: 400, left: -15, height: 742, width: 2000 }
			];

			assert.strictEqual(Object.keys(entries).length, entriesToFind.length);

			for (var i = 0; i < entriesToFind.length; i++) {
				var entryToFind = entriesToFind[i];

				assert.isTrue(entries.hasOwnProperty(host + entryToFind.url));

				var foundEntry = entries[host + entryToFind.url];

				assert.strictEqual(foundEntry[0], entryToFind.height);
				assert.strictEqual(foundEntry[1], entryToFind.width);
				assert.strictEqual(foundEntry[2], entryToFind.top);
				assert.strictEqual(foundEntry[3], entryToFind.left);
				if (entryToFind.naturalHeight) {
					assert.strictEqual(foundEntry[4], entryToFind.naturalHeight);
					assert.strictEqual(foundEntry[5], entryToFind.naturalWidth);
				}
				else {
					assert.strictEqual(foundEntry.length, 4);
				}
			}
		});
	});

	describe("getResourceLatestTime()", function() {
		it("Should get the latest available timestamp for the resource", function() {
			var resources = [
				{ expected: 125, responseEnd: 125 },
				{ expected: 100110.4, responseEnd: 0, responseStart: 100092, startTime: 100000 },
				{ expected: Infinity, responseEnd: 0, responseStart: 0, startTime: 100050 },
				{ expected: Infinity,  responseEnd: 0, responseStart: 0, startTime: 0 }
			];

			for (var i = 0; i < resources.length; i++) {
				var res = resources[i];
				var lat = BOOMR.plugins.ResourceTiming.getResourceLatestTime(res);

				if (res.expected < 0) {
					assert.closeTo(lat, window.performance.now(), Math.abs(res.expected));
				}
				else {
					assert.strictEqual(lat, res.expected);
				}
			}
		});
	});

	describe("mergePixels()/countPixels()", function() {
		var currentPixels;
		var resourceGroups = [
			[
				[ 100, 100, 50, 50 ],
				[ 100, 100, 75, 75 ]
			],
			[
				[ 150, 100, 250, 50 ],
				[ 100, 150, 275, 75 ]
			],
			[
				[ 300, 100, 450, 50 ],
				[ 100, 300, 475, 75 ]
			],
			[
				[ 600, 50, 75, 80 ]
			]
		];

		var pixelCounts = [ 14375, 36875, 89375, 95625 ];
		var finalCounts = [  9375, 24375, 65625, 95625 ];

		it("Should set pixels based on the passed in resources", function() {
			var scr = BOOMR.window.screen;
			BOOMR.window.screen = { height: 768, width: 1024 };

			assert.isUndefined(currentPixels, undefined);

			for (var i = 0; i < resourceGroups.length; i++) {
				currentPixels = BOOMR.plugins.ResourceTiming.mergePixels(currentPixels, resourceGroups[i], i + 1);
				var npixels = BOOMR.plugins.ResourceTiming.countPixels(currentPixels);

				assert.strictEqual(npixels, pixelCounts[i]);
			}

			BOOMR.window.screen = scr;
		});

		it("Should count finalized pixels for each timePoint", function() {
			for (var i = 0; i < finalCounts.length; i++) {
				var npixels = BOOMR.plugins.ResourceTiming.countPixels(currentPixels, 0, i + 1);

				assert.strictEqual(npixels, finalCounts[i]);
			}
		});

	});

	describe("getOptimizedTimepoints", function() {
		var timePoints = {
			10: [
				[ 100, 100, 50, 50 ],
				[ 100, 100, 75, 75 ]
			],
			"200.1": [
				[ 150, 100, 250, 50 ]
			],
			"200.2": [
				[ 100, 150, 275, 75 ]
			],
			350: [
				[ 300, 100, 450, 50 ],
				[ 100, 300, 475, 75 ]
			],
			400: [
				[ 600, 50, 75, 80 ]
			],
			450: [
				[ 600, 50, 75, 80 ]
			],
			Infinity: [
				[ 10, 10, 10, 400 ]
			]
		};

		var pixelCounts = [ 14375, 36875, 89375, 95625, 95625, 95725 ];
		var finalCounts = [  9375, 24375, 65625, 65625, 95625, 95725 ];

		var opt;

		it("Should get compressed & optimized timepoints", function() {
			opt = BOOMR.plugins.ResourceTiming.getOptimizedTimepoints(timePoints);

			assert.strictEqual(opt, "a~b3b~3uw!5a~hd0~9n8!46~14ic~ibq!1e~4tm~n5c!1e-!~2s");
		});

		it("Should decompress optimized timings", function() {
			var tp = BOOMR.plugins.ResourceTiming.decompressTimePoints(opt);

			var uks = {};

			Object.keys(timePoints).forEach(function(t) { uks[Math.round(Number(t))] = true; });

			var ks = Object.keys(uks);

			assert.strictEqual(Object.keys(tp).length, ks.length);

			for (var i = 0; i < ks.length; i++) {
				var k = ks[i];

				assert.isTrue(tp.hasOwnProperty(k));

				assert.strictEqual(tp[k][0], pixelCounts[i]);
				assert.strictEqual(tp[k][1], finalCounts[i]);
			}
		});
	});

	describe("accumulateServerTimingEntries", function() {
		it("Should increment our count collector", function() {
			var serverTimingCollection = {};
			BOOMR.plugins.ResourceTiming.accumulateServerTimingEntries(serverTimingCollection, [{name: "n1", description: "d1"}, {name: "n2", description: "d1"}]);
			BOOMR.plugins.ResourceTiming.accumulateServerTimingEntries(serverTimingCollection, [{name: "n2", description: "d1"}, {name: "n2", description: "d2"}]);
			assert.deepEqual(serverTimingCollection, {
				n1: {
					count: 1,
					counts: {
						d1: 1
					}
				},
				n2: {
					count: 3,
					counts: {
						d1: 2,
						d2: 1
					}
				}
			});
		});
	});

	describe("compressServerTiming", function() {
		it("Should create a lookup from our count collector", function() {
			assert.deepEqual(BOOMR.plugins.ResourceTiming.compressServerTiming({
				m0: {
					count: 0,
				    counts: {}
				},
				m1: {
					count: 1,
					counts: {
						d1: 1
					}
				}, m2: {
					count: 5,
					counts: {
						d2a: 3,
						d2b: 2
					}
				}
			}), [
				["m2", "d2a", "d2b"],
				["m1", "d1"],
				["m0"]
			]);
		});
		it("Should special case exactly one empty description", function() {
			assert.deepEqual(BOOMR.plugins.ResourceTiming.compressServerTiming({
				m0: {
					count: 1,
					counts: {
						"": 1
					}
				}
			}), [
				"m0"
			]);
		});
	});

	describe("indexServerTiming", function() {
		it("Should index a lookup", function() {
			assert.deepEqual(BOOMR.plugins.ResourceTiming.indexServerTiming([
				["metric0", "d1"],
				["metric1", "d2a", "d2b"]
			]), {
				metric0: {
					index: 0,
					descriptions: {
						d1: 0
					}
				},
				metric1: {
					index: 1,
					descriptions: {
						d2a: 0,
						d2b: 1
					}
				}
			});
		});

		it("Should special case exactly one empty description", function() {
			assert.deepEqual(BOOMR.plugins.ResourceTiming.indexServerTiming([
				"metric0"
			]), {
				metric0: {
					index: 0,
					descriptions: {
						"": 0
					}
				}
			});
		});
	});

	describe("identifyServerTimingEntry", function() {
		it("Should create identifiers", function() {
			assert.equal(BOOMR.plugins.ResourceTiming.identifyServerTimingEntry(0, 0), "");
			assert.equal(BOOMR.plugins.ResourceTiming.identifyServerTimingEntry(0, 1), ":.1");
			assert.equal(BOOMR.plugins.ResourceTiming.identifyServerTimingEntry(1, 0), ":1");
			assert.equal(BOOMR.plugins.ResourceTiming.identifyServerTimingEntry(1, 1), ":1.1");
		});
	});

	describe("decompressServerTiming", function() {
		var optimized = [["m0", "d0a", "d0b"], ["m1", "d1a", "d1b"], "m2"];
		it("Should resolve to m0-d0a", function() {
			["123", "123:0", "123:.0", "123:0.0"].forEach(function(compressed) {
				assert.deepEqual(BOOMR.plugins.ResourceTiming.decompressServerTiming(optimized, compressed), {
					name: "m0",
					description: "d0a",
					duration: 123
				});
			});
		});
		it("Should resolve to m0-d0b", function() {
			["123:.1", "123:0.1"].forEach(function(compressed) {
				assert.deepEqual(BOOMR.plugins.ResourceTiming.decompressServerTiming(optimized, compressed), {
					name: "m0",
					description: "d0b",
					duration: 123
				});
			});
		});
		it("Should resolve to m1-d1a", function() {
			["123:1", "123:1.0"].forEach(function(compressed) {
				assert.deepEqual(BOOMR.plugins.ResourceTiming.decompressServerTiming(optimized, compressed), {
					name: "m1",
					description: "d1a",
					duration: 123
				});
			});
		});
		it("Should resolve to m1-d1b", function() {
			["123:1.1"].forEach(function(compressed) {
				assert.deepEqual(BOOMR.plugins.ResourceTiming.decompressServerTiming(optimized, compressed), {
					name: "m1",
					description: "d1b",
					duration: 123
				});
			});
		});
		it("Should resolve to m1-<empty string>", function() {
			["123:2"].forEach(function(compressed) {
				assert.deepEqual(BOOMR.plugins.ResourceTiming.decompressServerTiming(optimized, compressed), {
					name: "m2",
					description: "",
					duration: 123
				});
			});
		});
	});
});
