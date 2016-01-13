/*global BOOMR*/
(function() {
	var hooked = false,
	    routeHooked = false,
	    enabled = true,
	    hadMissedRouteChange = false;

	// Checking for Plugins required and if already integrated
	if (BOOMR.plugins.History || typeof BOOMR.plugins.SPA === "undefined" || typeof BOOMR.plugins.AutoXHR === "undefined") {
		return;
	}

	// History object not available on the window object
	if (!BOOMR.window || !BOOMR.window.history) {
		return;
	}

	// register as a SPA plugin
	BOOMR.plugins.SPA.register("History");

	/**
	 * Debug logging for this instance
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(msg, "History");
	}

	/**
	 * @method
	 * @desc
	 * Hook into History Object either custom to your application or general on the window object
	 *
	 * This function will override the following functions if available:
	 *   - listen
	 *   - transitionTo
	 *   - pushState
	 *   - setState
	 *   - replaceState
	 *   - go
	 *
	 * @param {object} history - Custom or global History object instance
	 */
	function hook(history) {
		if (!history) {
			history = window.history;
		}

		var orig_history = {
			listen: history.listen,
			transitionTo: history.transitionTo,
			pushState: history.pushState,
			setState: history.setState,
			replaceState: history.replaceState,
			go: history.go
		};

		history.setState = function() {
			log("setState");

			if (!enabled) {
				log("Not enabled - we've missed a routeChange");
				hadMissedRouteChange = true;
			}
			else {
				BOOMR.plugins.SPA.route_change();
			}
			orig_history.setState.apply(this, arguments);
		};

		history.listen = function() {
			log("listen");

			if (!enabled) {
				log("Not enabled - we've missed a routeChange");
				hadMissedRouteChange = true;
			}
			else {
				BOOMR.plugins.SPA.route_change();
			}
			orig_history.listen.apply(this, arguments);
		};

		history.transitionTo = function() {
			log("transitionTo");

			if (!enabled) {
				log("Not enabled - we've missed a routeChange");
				hadMissedRouteChange = true;
			}
			else {
				BOOMR.plugins.SPA.route_change();
			}

			orig_history.setState.apply(this, arguments);
		};

		history.pushState = function(state, title, url) {
			log("pushState");

			if (!enabled) {
				log("Not enabled - we've missed a routeChange");
				hadMissedRouteChange = true;
			}
			else {
				BOOMR.plugins.SPA.route_change();
			}
			orig_history.pushState.apply(this, arguments);
		};

		history.replaceState = function() {
			log("pushState");

			if (!enabled) {
				log("Not enabled - we've missed a routeChange");
				hadMissedRouteChange = true;
			}
			else  {
				BOOMR.plugins.SPA.route_change();
			}

			orig_history.setState.apply(this, arguments);
		};

		history.go = function() {
			log("go");

			if (!enabled) {
				log("Not enabled - we've missed a routeChange");
				hadMissedRouteChange = true;
			}
			else {
				BOOMR.plugins.SPA.route_change();
			}

			orig_history.go.apply(this, arguments);
		};

		return true;
	}

	BOOMR.plugins.History = {
		is_complete: function() {
			return true;
		},
		hook: function(history, hadRouteChange, options) {
			if (hooked) {
				return this;
			}

			if (hook(history)) {
				BOOMR.plugins.SPA.hook(hadRouteChange, options);
				hooked = true;
			}

			return this;
		},
		disable: function() {
			enabled = false;
			return this;
		},
		enable: function() {
			enabled = true;

			if (hooked && hadMissedRouteChange) {
				hadMissedRouteChange = false;
				BOOMR.plugins.SPA.route_change();
			}

			return this;
		}
	};
}());

