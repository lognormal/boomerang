/*
 * Copyright (c), Log-Normal, Inc.
 */

/**
\file memory.js
Plugin to collect memory metrics when available.
see: http://code.google.com/p/chromium/issues/detail?id=43281
*/

(function() {
	var w, p = {}, d, m, s, n, b, impl;
	// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
	// you'll need this.
	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.Memory) {
		return;
	}

	/**
	 * Count elements of a given type and return the count or an object with the `key` mapped to the `count` if a `key` is specified.
	 * If one or more filters are included, apply them incrementally to the `element` array, assigning each intermediate count to the
	 * corresponding `key` in the return object
	 *
	 * @param {string} type Element type to search DOM for
	 *
	 * @param {string[]} [keys] List of keys for return object
	 * If not included, just the tag count is returned.
	 * If included then an object is returned with each element in this array as a key, and the element count as the value.
	 * For keys[1] onwards, the element count is the number of elements returned from each corresponding filter function.
	 *
	 * @param {function} [filter] List of filters to apply incrementally to element array
	 * This is NOT an array
	 * The input to each function in the argument list is the array returned by the previous function
	 * The first function receives the array returned by the `getElementsByTagName` function
	 * Each function MUST return a NodeList or an Array with a `length` property
	 *
	 * @returns {number|object}
	 * If only one argument is passed in, returns a nodeCount matching that element type
	 * If multiple arguments are passed in, returns an object with key to count mapping based on the rules above
	 */
	function nodeCount(type, keys /*, filter...*/) {
		var tags, r, o, i, filter;
		try {
			tags = d.getElementsByTagName(type);
			r = tags.length;

			if (keys && keys.length) {
				o = {};
				o[keys[0]] = r;

				// Iterate through all remaining arguments checking for filters
				// Remember that keys.length will be at least 1 and arguments.length will be at least 2
				// so the first key we use is keys[1] for arguments[2]
				for (i = 2; r > 0 && i < arguments.length && i - 1 < keys.length; i++) {
					filter = arguments[i];

					if (typeof filter !== "function") {
						continue;
					}

					try {
						tags = BOOMR.utils.arrayFilter(tags, filter);
						// Only add this if different from the previous
						if (tags.length !== r) {
							r = tags.length;
							o[keys[i - 1]] = r;
						}
					}
					catch (err) {
						BOOMR.addError(err, "Memory.nodeList." + type + ".filter[" + (i - 2) + "]");
					}
				}

			}
			return o || r;
		}
		catch (err) {
			BOOMR.addError(err, "Memory.nodeList." + type);
			return 0;
		}
	}

	function errorWrap(condition, callback, component) {
		if (condition) {
			try {
				callback();
			}
			catch (err) {
				BOOMR.addError(err, "Memory.done." + component);
			}
		}
	}

	// A private object to encapsulate all your implementation details
	impl = {
		done: function() {
			if (!w) {
				return;		// this can happen for an unload beacon
			}

			// If we have resource timing, get number of resources
			BOOMR.removeVar("dom.res");
			errorWrap(true,
				function() {
					var res, doms = {}, a;

					if (!p || typeof p.getEntriesByType !== "function") {
						return;
					}

					res = p.getEntriesByType("resource");
					if (!res || !res.length) {
						return;
					}

					BOOMR.addVar("dom.res", res.length);

					a = BOOMR.window.document.createElement("a");

					[].forEach.call(res, function(r) {
						a.href = r.name;
						doms[a.hostname] = true;
					});

					BOOMR.addVar("dom.doms", Object.keys(doms).length);
				},
				"resources"
			);

			if (m) {
				BOOMR.addVar({
					"mem.total": m.totalJSHeapSize,
					"mem.limit": m.jsHeapSizeLimit,
					"mem.used": m.usedJSHeapSize
				});
			}

			errorWrap(s,
				function() {
					var sx, sy;
					BOOMR.addVar({
						"scr.xy": s.width + "x" + s.height,
						"scr.bpp": s.colorDepth + "/" + (s.pixelDepth || "")
					});
					if (s.orientation) {
						BOOMR.addVar("scr.orn", s.orientation.angle + "/" + s.orientation.type);
					}
					if (w.devicePixelRatio > 1) {
						BOOMR.addVar("scr.dpx", w.devicePixelRatio);
					}
					if (w.scrollX || w.scrollY) {
						// Apparently some frameworks set scrollX and scrollY to functions that return the actual values
						sx = typeof w.scrollX === "function" ? w.scrollX() : w.scrollX;
						sy = typeof w.scrollY === "function" ? w.scrollY() : w.scrollY;

						if (typeof sx === "number" && typeof sy === "number") {
							BOOMR.addVar("scr.sxy", sx + "x" + sy);
						}
					}
				},
				"screen"
			);

			errorWrap(n,
				function() {
					if (n.hardwareConcurrency) {
						BOOMR.addVar("cpu.cnc", n.hardwareConcurrency);
					}
					if (n.maxTouchPoints) {
						BOOMR.addVar("scr.mtp", n.maxTouchPoints);
					}
				},
				"navigator"
			);

			errorWrap(b,
				function() {
					BOOMR.addVar("bat.lvl", b.level);
				},
				"battery"
			);

			errorWrap(true,
				function() {
					var uniqUrls;

					BOOMR.addVar({
						"dom.ln": nodeCount("*"),
						"dom.sz": d.documentElement.innerHTML.length
					});

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"img",
						["dom.img", "dom.img.ext", "dom.img.uniq"],
						function(el) {
							return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|data:|#)/);
						},
						function(el) {
							return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
						}
					));

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"script",
						["dom.script", "dom.script.ext", "dom.script.uniq"],
						function(el) {
							return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|#)/);
						},
						function(el) {
							return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
						}
					));

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"iframe",
						["dom.iframe", "dom.iframe.ext", "dom.iframe.uniq"],
						function(el) {
							return el.src && !el.src.toLowerCase().match(/^(?:about:|javascript:|#)/);
						},
						function(el) {
							return !(uniqUrls[el.src] = uniqUrls.hasOwnProperty(el.src));
						}
					));

					uniqUrls = {};
					BOOMR.addVar(nodeCount(
						"link",
						["dom.link", "dom.link.css", "dom.link.css.uniq"],
						function(link) {
							return link.rel && link.rel.toLowerCase() === "stylesheet" &&
								link.href && !link.href.toLowerCase().match(/^(?:about:|javascript:|#)/);
						},
						function(link) {
							return !(uniqUrls[link.href] = uniqUrls.hasOwnProperty(link.href));
						}
					));
				},
				"dom"
			);

			// no need to call BOOMR.sendBeacon because we're called when the beacon is being sent
		}
	};

	BOOMR.plugins.Memory = {
		init: function() {
			var c;

			try {
				w = BOOMR.window;
				d = w.document;
				p = BOOMR.getPerformance();
				c = w.console;
				s = w.screen;
				n = w.navigator;
				if (n && n.battery) {
					b = n.battery;
				}
				// There are cases where getBattery exists but is not a function
				// No need to check for existence because typeof will return undefined anyway
				else if (n && typeof n.getBattery === "function") {
					var batPromise = n.getBattery();

					// some UAs implement getBattery without a promise
					if (batPromise && typeof batPromise.then === "function") {
						batPromise.then(function(battery) {
							b = battery;
						});
					}
					// If batPromise is an object and it has a `level` property, then it's probably the battery object
					else if (typeof batPromise === "object" && batPromise.hasOwnProperty("level")) {
						b = batPromise;
					}
					// else do nothing
				}
			}
			catch (err) {
				BOOMR.addError(err, "Memory.init");
			}

			m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

			if (impl.initialized) {
				return this;
			}

			impl.initialized = true;

			// we do this before sending a beacon to get the snapshot when the beacon is sent
			BOOMR.subscribe("before_beacon", impl.done, null, impl);
			return this;
		},

		is_complete: function() {
			// Always true since we run on before_beacon, which happens after the check
			return true;
		}
	};

}());
