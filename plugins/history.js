/*global BOOMR*/
(function() {
	var hooked = false,
	    routeHooked = false,
	    enabled = true,
	    hadMissedRouteChange = false


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

	function hook(history) {
		var orig_history = {
			listen: history.listen,
			transitionTo: history.transitionTo,
			pushState: history.pushState,
			replaceState: history.replaceState,
			go: history.go
		};

		history.listen = function() {
			log("listen");
			BOOMR.plugins.SPA.route_change();
			orig_history.listen.apply(this, arguments);
		}

		history.transitionTo = function() {
			log("transitionTo");
			BOOMR.plugins.SPA.route_change();
			orig_history.transitionTo.apply(this, arguments);
		}

		history.pushState = function() {
			log("pushState");
			console.log(arguments);
			if (!enabled) {
				hadMissedRouteChange = true;
				return;
			}
			BOOMR.plugins.SPA.route_change();
			orig_history.pushState.apply(this, arguments);
		}

		history.replaceState = function() {
			log("pushState");
			if (!enabled) {
				hadMissedRouteChange = true;
				return;
			}
			BOOMR.plugins.SPA.route_change();
			orig_history.replaceState.apply(this, arguments);
		}


		history.go = function() {
			log("go");
			BOOMR.plugins.SPA.route_change();
			orig_history.go.apply(this, arguments);
		}

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
