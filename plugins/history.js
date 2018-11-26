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
 * **Note**: This plugin requires the {@link BOOMR.plugins.AutoXHR} and
 * {@link BOOMR.plugins.SPA} plugins to be loaded first (in that order).
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
 * To configure React, you will need to export the `history` object from
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
		routeChangeInProgress: false,  // will store the setTimeout id when set
		disableHardNav: false,

		/**
		 * Clears routeChangeInProgress flag
		 */
		resetRouteChangeInProgress: function() {
			log("resetting routeChangeInProgress");
			if (impl.routeChangeInProgress) {
				clearTimeout(impl.routeChangeInProgress);
			}
			impl.routeChangeInProgress = false;
		},

		/**
		 * Sets routeChangeInProgress flag and sets up timer to clear it later
		 */
		setRouteChangeInProgress: function() {
			if (impl.routeChangeInProgress) {
				clearTimeout(impl.routeChangeInProgress);
			}
			// reset our routeChangeInProgress flag as soon as the browser is free.
			// Current browser behavior favors sending internal events over calling
			// timeout callbacks. If for example the back button is clicked and a replaceState
			// is called then the popstate event should be triggered to extend this timeout before
			// the callback is called.
			impl.routeChangeInProgress = setTimeout(impl.resetRouteChangeInProgress, 50);
		},

		/**
		 * Fire SPA route init event
		 *
		 * @param {string} title Route title
		 * @param {string} url Route URL
		 */
		spaInit: function(title, url) {
			if (url) {
				BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), url]);
			}
			else if (title) {
				BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), title]);
			}
			else {
				BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), BOOMR.window.document.URL]);
			}
		},

		/**
		 * Called on route change
		 */
		routeChange: function(title, url) {
			if (!impl.enabled) {
				log("Not enabled - we've missed a routeChange");
				impl.hadMissedRouteChange = true;
				impl.resetRouteChangeInProgress();
			}
			else {
				// don't track the SPA route change until the onload (page_ready)
				// has fired
				if (impl.disableHardNav && !BOOMR.onloadFired()) {
					return;
				}

				if (!impl.routeChangeInProgress) {
					log("routeChange triggered, sending route_change() event");
					impl.spaInit(title, url);
					BOOMR.plugins.SPA.route_change();
				}
				else {
					log("routeChangeInProgress, not triggering");
				}
			}
		}
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
	};

	/**
	 * Hook into `window.history` Object
	 *
	 * This function will override the following functions if available:
	 *   - pushState
	 *   - replaceState
	 *   - go
	 *   - back
	 *   - forward
	 * And listen to event:
	 *   - hashchange
	 *   - popstate
	 */
	function hook() {
		var history = BOOMR.window.history;

		/**
		 * Add event listener for `popstate`
		 */
		function aelPopstate() {
			BOOMR.window.addEventListener("popstate", function(event) {
				log("popstate");
				impl.routeChange();
			});
		}

		//
		// History API overrides
		//

		if (typeof history.pushState === "function") {
			history.pushState = (function(_pushState) {
				return function(state, title, url) {
					log("pushState, title: " + title + " url: " + url);
					impl.routeChange(title, url);
					return _pushState.apply(this, arguments);
				};
			})(history.pushState);
		}

		if (typeof history.replaceState === "function") {
			history.replaceState = (function(_replaceState) {
				return function(state, title, url) {
					log("replaceState, title: " + title + " url: " + url);
					impl.routeChange(title, url);
					return _replaceState.apply(this, arguments);
				};
			})(history.replaceState);
		}

		// we instrument go, back and forward because they are called earlier than the
		// popstate event which gives AutoXHR a chance to setup the MO
		if (typeof history.go === "function") {
			history.go = (function(_go) {
				return function(index) {
					var res;
					log("go");
					impl.routeChange();  // spa_init url will be the url before `go` runs
					return _go.apply(this, arguments);
				};
			})(history.go);
		}

		if (typeof history.back === "function") {
			history.back = (function(_back) {
				return function() {
					var res;
					log("back");
					impl.routeChange();  // spa_init url will be the url before `back` runs
					return _back.apply(this, arguments);
				};
			})(history.back);
		}

		if (typeof history.forward === "function") {
			history.forward = (function(_forward) {
				return function() {
					var res;
					log("forward");
					impl.routeChange();  // spa_init url will be the url before `forward` runs
					return _forward.apply(this, arguments);
				};
			})(history.forward);
		}

		// listen for hash changes
		BOOMR.window.addEventListener("hashchange", function(event) {
			var url = (event || {}).newURL;
			log("hashchange " + url);
			impl.routeChange(null, url);
		});

		// add listener for popstate after page load has occured so that we don't receive an unwanted popstate
		// event at onload
		if (BOOMR.hasBrowserOnloadFired()) {
			aelPopstate();
		}
		else {
			// the event listener will be registered early enough to to get an unwanted event if we don't use setTimeout
			BOOMR.window.addEventListener("load", function() { setTimeout(aelPopstate, 0); });
		}

		// listen for a beacon
		BOOMR.subscribe("beacon", impl.resetRouteChangeInProgress);

		// listen for spa cancellations
		BOOMR.subscribe("spa_cancel", impl.resetRouteChangeInProgress);

		// listent for spa inits. We're adding this to catch the event sent by the SPA plugin
		BOOMR.subscribe("spa_init", impl.setRouteChangeInProgress);

		return true;
	};

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
		 * @param {object} history No longer used
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

			if (hook()) {
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

			return this;
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
				impl.setRouteChangeInProgress();
				log("Hooked and hadMissedRouteChange sending route_change!");
			}

			return this;
		}
	};
}());
