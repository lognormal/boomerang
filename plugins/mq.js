/**
\file mq.js
Plugin to implement the method queue pattern
http://www.lognormal.com/blog/2012/12/12/the-script-loader-pattern/#the_method_queue_pattern
*/

(function() {
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

	var mq = BOOMR.window.BOOMR_mq;
	if (BOOMR.utils.isArray(mq)) {
		processEntries(mq);
	}
	BOOMR.window.BOOMR_mq = {
		push: function() {
			processEntries(arguments);
		}
	};
})();
