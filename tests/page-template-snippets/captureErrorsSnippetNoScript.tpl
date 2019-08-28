(function(w){
	w.BOOMR = w.BOOMR || {};

	w.BOOMR.globalOnErrorOrig = w.BOOMR.globalOnError = w.onerror;
	w.BOOMR.globalErrors = [];

	var now = (function() {
		try {
			if ("performance" in w) {
				return function() {
					return Math.round(w.performance.now() + performance.timing.navigationStart);
				};
			}
		}
		catch (ignore) {}

		return Date.now || function() {
			return new Date().getTime();
		};
	})();

	w.onerror = function BOOMR_plugins_errors_onerror(message, fileName, lineNumber, columnNumber, error) {
		if (w.BOOMR.version) {
			// If Boomerang has already loaded, the only reason this function would still be alive would be if
			// we're in the chain from another handler that overwrote window.onerror.  In that case, we should
			// run globalOnErrorOrig which presumably hasn't been overwritten by Boomerang.
			if (typeof w.BOOMR.globalOnErrorOrig === "function") {
				w.BOOMR.globalOnErrorOrig.apply(w, arguments);
			}

			return;
		}

		if (typeof error !== "undefined" && error !== null) {
			error.timestamp = now();
			w.BOOMR.globalErrors.push(error);
		}
		else {
			w.BOOMR.globalErrors.push({
				message: message,
				fileName: fileName,
				lineNumber: lineNumber,
				columnNumber: columnNumber,
				noStack: true,
				timestamp: now()
			});
		}

		if (typeof w.BOOMR.globalOnError === "function") {
			w.BOOMR.globalOnError.apply(w, arguments);
		}
	};

	// make it easier to detect this is our wrapped handler
	w.onerror._bmr = true;
})(window);
