/**
 * The History plugin allows you to automatically monitor Single Page
 * App (SPA) navigations that change their routes via the
 * [`window.history`](https://developer.mozilla.org/en-US/docs/Web/API/Window/history)
 * object.
 *
 * The History plugin can be used for any SPA, though if you are using
 * {@link BOOMR.plugins.Angular AngularJS}, {@link BOOMR.plugins.Ember Ember.js}
 * or {@link BOOMR.plugins.Backbone Backbone.js}, it is advised to use those
 * specific plugins instead.
 *
 * The History plugin should be used for React apps.
 *
 * **Note**: This plugins requires the {@link BOOMR.plugins.SPA} and
 * {@link BOOMR.plugins.AutoXHR} plugin as well.
 *
 * For details on how Boomerang Single Page App instrumentation works, see the
 * {@link BOOMR.plugins.SPA} documentation.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Compatibility
 *
 * This plugin should work with any Single Page App, by instrumenting the
 * [`window.history`](https://developer.mozilla.org/en-US/docs/Web/API/Window/history)
 * object to monitor for route changes.
 *
 * If you're using {@link BOOMR.plugins.Angular AngularJS}, {@link BOOMR.plugins.Ember Ember.js}
 * or {@link BOOMR.plugins.Backbone Backbone.js}, you are advised to use those
 * plugins instead, as they listen to other app lifecycle events.
 *
 * For React apps, you should use this plugin (with {@link BOOMR.plugins.History.init auto=false}
 * mode).
 *
 * ## Beacon Parameters
 *
 * This plugin does not add any additional beacon parameters beyond the
 * {@link BOOMR.plugins.SPA} plugin.
 *
 * ## Usage
 *
 * First, include the {@link BOOMR.plugins.SPA}, {@link BOOMR.plugins.History}
 * and {@link BOOMR.plugins.AutoXHR} plugins.  See {@tutorial building} for details.
 *
 * If you're using a SPA framework that utilizes the
 * [`window.history`](https://developer.mozilla.org/en-US/docs/Web/API/Window/history)
 * object, you should configure it with {@link BOOMR.plugins.History.init auto=true}.
 * This configures Boomerang to instrument the `window.history` object, and
 * nothing else needs to be done.
 *
 * If you are using React, you should configure this plugin with
 * {@link BOOMR.plugins.History.init auto=false}, and ensure you use the React
 * snippet below.  This configures Boomerang to instrument the React-specific
 * history object instead of `window.history`.
 *
 * ## React Configuration
 *
 * React exposes a history-like object that Boomerang instruments to listen for
 * lifecycle events.
 *
 * To configure React, you ewill need to export the `history` object from
 * React-Router:
 *
 * ```
 * import { useBasename } from "history";
 * import createHashHistory from "history/lib/createHashHistory";
 * import createBrowserHistory from "history/lib/createBrowserHistory";
 *
 * var history, hadRouteChange;
 *
 * // NOTE: Use only one of the two options below
 *
 * // If the browser supports native HTML5 routing via history:
 * history = useBasename(createBrowserHistory)({
 *   basename: location.pathname
 * });
 *
 * // If the browser only supports Hash-based routing:
 * history = createHashHistory();
 * ```
 *
 * After the `history` variable has been setup, include the following snippet:
 *
 * ```
 * function hookHistoryBoomerang() {
 *   if (window.BOOMR && BOOMR.version) {
 *     if (BOOMR.plugins && BOOMR.plugins.History) {
 *       BOOMR.plugins.History.hook(history, hadRouteChange);
 *     }
 *     return true;
 *   }
 * }
 *
 * if (!hookHistoryBoomerang()) {
 *   if (document.addEventListener) {
 *     document.addEventListener("onBoomerangLoaded", hookHistoryBoomerang);
 *   } else if (document.attachEvent) {
 *     document.attachEvent("onpropertychange", function(e) {
 *       e = e || window.event;
 *       if (e && e.propertyName === "onBoomerangLoaded") {
 *         hookHistoryBoomerang();
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @class BOOMR.plugins.History
 */
(function() {
	var impl = {
		auto: false,
		enabled: true,
		hooked: false,
		routeHooked: false,
		hadMissedRouteChange: false,
		routeChangeInProgress: false,
		disableHardNav: false
	};

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	// Checking for Plugins required and if already integrated
	if (BOOMR.plugins.History ||
	    typeof BOOMR.plugins.SPA === "undefined" ||
	    typeof BOOMR.plugins.AutoXHR === "undefined") {
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
	 * Called on route change
	 */
	function routeChange() {
		if (!impl.enabled) {
			log("Not enabled - we've missed a routeChange");
			impl.hadMissedRouteChange = true;
			impl.routeChangeInProgress = false;
		}
		else {
			// don't track the SPA route change until the onload (page_ready)
			// has fired
			if (impl.disableHardNav && !BOOMR.onloadFired()) {
				return;
			}

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
	 * Hook into History Object: either custom to your application or `window.history`
	 *
	 * This function will override the following functions if available:
	 *   - listen
	 *   - transitionTo
	 *   - pushState
	 *   - setState
	 *   - replaceState
	 *   - go
	 *
	 * @param {object} history Custom or global History object instance
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

		/**
		 * Initialize the SPA route
		 *
		 * @param {string} title Route title
		 * @param {string} url Route URL
		 */
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

		//
		// History overrides
		//
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

		// also listen for hash changes
		BOOMR.window.addEventListener("hashchange", function(event) {
			log("hashchange");
			if (!impl.routeChangeInProgress && event) {
				BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), event.newURL]);
			}
			routeChange();
		});

		// listen for a beacon
		BOOMR.subscribe("beacon", function() {
			log("Beacon sending, resetting routeChangeInProgress.");
			impl.routeChangeInProgress = false;
		});

		return true;
	}

	//
	// Exports
	//
	BOOMR.plugins.History = {
		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.History
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Hooks Boomerang into the History events.
		 *
		 * @param {object} history History object
		 * @param {boolean} [hadRouteChange] Whether or not there was a route change
		 * event prior to this `hook()` call
		 * @param {object} [options] Options
		 *
		 * @returns {@link BOOMR.plugins.History} The History plugin for chaining
		 * @memberof BOOMR.plugins.History
		 */
		hook: function(history, hadRouteChange, options) {
			options = options || {};
			options.disableHardNav = impl.disableHardNav;

			if (impl.hooked) {
				return this;
			}

			if (hook(history)) {
				BOOMR.plugins.SPA.hook(hadRouteChange, options);
				impl.hooked = true;
			}

			return this;
		},

		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {boolean} config.History.auto Whether or not to automatically
		 * instrument the `window.history` object.
		 *
		 * If set to `false`, the React snippet should be used.
		 *
		 * @returns {@link BOOMR.plugins.History} The History plugin for chaining
		 * @example
		 * BOOMR.init({
		 *   History: {
		 *     auto: true
		 *   });
		 * });
		 * @memberof BOOMR.plugins.History
		 */
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "History", ["auto", "enabled", "disableHardNav"]);

			if (impl.auto && impl.enabled) {
				this.hook(undefined, true, {});
			}
		},

		/**
		 * Disables the History plugin
		 *
		 * @returns {@link BOOMR.plugins.History} The History plugin for chaining
		 * @memberof BOOMR.plugins.History
		 */
		disable: function() {
			impl.enabled = false;
			return this;
		},

		/**
		 * Enables the History plugin
		 *
		 * @returns {@link BOOMR.plugins.History} The History plugin for chaining
		 * @memberof BOOMR.plugins.History
		 */
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
