/**
 * Plugin to implement the method queue pattern for Boomerang:
 *
 * {@link http://www.lognormal.com/blog/2012/12/12/the-script-loader-pattern/#the_method_queue_pattern}
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds no parameters to the beacon.
 *
 * ## Usage
 *
 * The `BOOMR_mq` plugin can be used to call {@link BOOMR} methods before boomerang.js
 * has fully loaded on the page.
 *
 * If Boomerang is already on the page when `BOOMR_mq.push()` is used, the
 * specified function will be called immediatley.
 *
 * Otherwise, the specified function will be called as soon as Boomerang has
 * loaded.
 *
 * ## Example
 *
 * `BOOMR_mq` is a global array that lives on the `window` object.  If it doesn't
 * exist, you should create it.
 *
 * To queue {@link BOOMR} methods, simply `push()` arrays onto the object.
 *
 * The first parameter in the array is the {@link BOOMR} method name.
 *
 * The rest of the parameters will be passed to that method.
 *
 * @example
 * window.BOOMR_mq = window.BOOMR_mq || [];
 *
 * // add two variables to the beacon once Boomerang has loaded
 * window.BOOMR_mq.push(
 *   ["addVar", "var1", "value1"],
 *   ["addVar", "var2", "value2"]
 * );
 *
 * @class BOOMR_mq
 */
(function() {
	BOOMR = window.BOOMR || {};

	/**
	 * Process a single `BOOMR_mq` entry.
	 *
	 * @param {string[]} args Entry arguments
	 * @param {function} callback Callback function
	 * @param {object} thisArg The 'this'
	 */
	function processEntry(args, callback, thisArg) {
		var methodName = args.shift();
		if (typeof methodName !== "string") {
			return;
		}

		var split = methodName.split("."), method = BOOMR, _this = BOOMR;
		if (split[0] === "BOOMR") {
			// the BOOMR namespace is inferred, remove it if it was specified
			split.shift();
		}

		// loop through all of `split`, stepping into only objects and functions
		while (split.length &&
			method && // `null` is an object, skip it
			(typeof method === "object" || typeof method === "function")) {
			var word = split.shift();
			method = method[word];
			if (split.length) {
				_this = _this[word]; // the `this` is everything up until the method name
			}
		}

		// if we've used all of `split`, and have resolved to a function, call it
		if (!split.length && typeof method === "function") {
			var returnValue = method.apply(_this, args);

			// pass the return value of the resolved function as the only argument to the
			// optional `callback`
			if (typeof callback === "function") {
				callback.call(thisArg, returnValue);
			}
		}
	}

	/**
	 * Processes a list of `BOOMR_mq` entries
	 *
	 * @param {string[][]} entries Entries
	 */
	function processEntries(entries) {
		for (var i = 0; i < entries.length; i++) {
			var params = entries[i];
			if (!params) {
				continue;
			}

			if (BOOMR.utils.isArray(params)) {
				processEntry(params);
			}
			else if (typeof params === "object" && BOOMR.utils.isArray(params.arguments)) {
				processEntry(params.arguments, params.callback, params.thisArg);
			}
		}
	}

	// process the window's current queue'd entries
	var mq = BOOMR.window.BOOMR_mq;
	if (BOOMR.utils.isArray(mq)) {
		processEntries(mq);
	}

	// replace the queue with an immediate processor now that we're loaded
	BOOMR.window.BOOMR_mq = {
		push: function() {
			processEntries(arguments);
		}
	};
})();
