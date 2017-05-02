/*global BOOMR*/
(function() {
	var impl = {
		auto: false,
		enabled: true,
		hooked: false,
		routeHooked: false,
		hadMissedRouteChange: false,
		routeChangeInProgress: false
	};

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
	 * If enabled and another route change is not in progress send a route_change() event
	 * Otherwise log a warning and set hadMissed a routeChange as missed
	 */
	function routeChange() {
		if (!impl.enabled) {
			log("Not enabled - we've missed a routeChange");
			impl.hadMissedRouteChange = true;
			impl.routeChangeInProgress = false;
		}
		else {
			if (!impl.routeChangeInProgress) {
				log("routeChange triggered, sending route_change() event");
				impl.routeChangeInProgress = true;
				BOOMR.plugins.SPA.route_change();
			}
			else {
				log("routeChangeInProgress, not triggering");
			}
		}
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
			history = BOOMR.window.history;
		}

		var orig_history = {
			listen: history.listen,
			transitionTo: history.transitionTo,
			pushState: history.pushState,
			setState: history.setState,
			replaceState: history.replaceState,
			go: history.go
		};

		function spa_init(title, url) {
			if (!impl.routeChangeInProgress) {
				if (title && url) {
					BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), url]);
				}
				else if (title && !url) {
					BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), title]);
				}
			}
		}

		history.setState = function() {
			log("setState");
			routeChange();
			orig_history.setState.apply(this, arguments);
		};

		history.listen = function() {
			log("listen");
			routeChange();
			orig_history.listen.apply(this, arguments);
		};

		history.transitionTo = function() {
			log("transitionTo");
			routeChange();
			orig_history.transitionTo.apply(this, arguments);
		};

		history.pushState = function(state, title, url) {
			log("pushState");
			spa_init(title, url);
			routeChange();
			orig_history.pushState.apply(this, arguments);
		};

		history.replaceState = function(state, title, url) {
			log("replaceState");
			spa_init(title, url);
			routeChange();
			orig_history.replaceState.apply(this, arguments);
		};

		history.go = function() {
			log("go");
			routeChange();
			orig_history.go.apply(this, arguments);
		};

		BOOMR.window.addEventListener("hashchange", function(event) {
			log("hashchange");
			if (!impl.routeChangeInProgress && event) {
				BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), event.newURL]);
			}
			routeChange();
		});

		BOOMR.subscribe("onbeacon", function() {
			log("Beacon sending, resetting routeChangeInProgress.");
			impl.routeChangeInProgress = false;
		});

		return true;
	}

	BOOMR.plugins.History = {
		is_complete: function() {
			return true;
		},
		hook: function(history, hadRouteChange, options) {
			if (impl.hooked) {
				return this;
			}

			if (hook(history)) {
				BOOMR.plugins.SPA.hook(hadRouteChange, options);
				impl.hooked = true;
			}

			return this;
		},
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "History", ["auto", "enabled"]);

			if (impl.auto && impl.enabled) {
				this.hook(undefined, true, {});
			}
		},
		disable: function() {
			impl.enabled = false;
			return this;
		},
		enable: function() {
			impl.enabled = true;

			if (impl.hooked && impl.hadMissedRouteChange) {
				impl.hadMissedRouteChange = false;
				BOOMR.plugins.SPA.route_change();
				impl.routeChangeInProgress = true;
				log("Hooked and hadMissedRouteChange sending route_change!");
			}

			return this;
		}
	};
}());
