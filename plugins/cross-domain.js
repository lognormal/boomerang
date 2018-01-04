/**
 * This plugin enables cross-domain session tracking.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Setup
 *
 * The primary domain needs to host a known HTML file that will load Boomerang
 * and can communicate via `postMessage()` to other domains so session information
 * such as ID and length can be coordianted between all of the domains.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `rt.sstr_dur`: Session transfer duration (ms)
 * * `rt.sstr_to`:  The session transfer timed out (`1` or missing)
 *
 * @class BOOMR.plugins.CrossDomain
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.CrossDomain) {
		return;
	}

	var w = BOOMR.window;

	// fail if BOOMR window was not assigned
	if (!w) {
		return;
	}

	var d = BOOMR.window.document;

	/**
	 * Debug logging
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(msg, "CrossDomain");
	}

	// 24h in ms
	var maxSessionExpiry = 24 * 60 * 60 * 1000;

	var impl = {
		/**
		 * Flag setting this plugin enabled or disabled
		 */
		enabled: false,

		/**
		 * URL to fetch main domain session data from
		 */
		cross_domain_url: undefined,

		/**
		 * Set to true once session data has been set on the domain alias from the
		 * main domain or if postMessage is not supported on the browser.
		 */
		session_transferred: false,

		/**
		 * Set to true to keep iframe on the page for debugging purposes, default is to remove iframe.
		 * Cannot be overridden by the page.
		 */
		debug: false,

		/**
		 * Name of the iframe added to the document
		 */
		iframe_name: "boomerang-cross-domain-session-fetch",

		/**
		 * Reference to the iframe to access for postMessages
		 */
		iframe: undefined,

		/**
		 * flag to tell the plugin it's sending the data to secondary domain
		 */
		sending: false,

		/**
		 * Session transferred from the child IFrame
		 */
		session: {
			ID: undefined,
			start: undefined,
			length: undefined
		},

		/**
		 * Time stamp of when the session was transferred
		 */
		session_transferred_time: 0,

		/**
		 * Timestamp of plugin initialization
		 */
		plugin_start: 0,

		/**
		 * If the IFrame does not come back before the timeout is exceeded set this
		 * flag to true and don't set session data on this instance of boomerang
		 */
		session_transfer_timedout: false,

		/**
		 * If time to wait for the iframe to load and send data over
		 * via postMessage. If this timeout is reached:
		 *  - Session Transfer fails
		 *  - Current session data is used
		 *  - Plugin is flagged as complete and a beacon is sent
		 *  - Session from main Domain is not used on this session
		 */
		session_transfer_timeout: 5000,

		/**
		 * If we're done updating the session info we set this to true
		 * to avoid re updating the session info should is_complete be called twice.
		 */
		session_transfer_complete: false,

		/**
		 * Opens a new hidden IFrame to the url passed in and fetches
		 * the session data via postMessage and messageEvents to
		 * communicate between frames.
		 *
		 * @param {string} url - URL to point to for the main domain URL
		 */
		setup: function(url) {
			var queryObject = BOOMR.session;

			if (BOOMR.plugins.RT) {
				var cookie = BOOMR.plugins.RT.getCookie();
				if (cookie) {
					if (cookie.obo) {
						queryObject.obo = cookie.obo;
					}

					if (cookie.tt) {
						queryObject.tt = cookie.tt;
					}
				}
			}

			var urlQueryParams = BOOMR.utils.objectToString(queryObject, "&");
			url = url + "#" + urlQueryParams;

			d.body.appendChild(impl.buildIFrame(url, impl.iframe_name));

			if (w.addEventListener) {
				w.addEventListener("message", impl.onIFrameMessage);
			}
			else {
				w.attachEvent("onmessage", impl.onIFrameMessage);
			}
		},

		/**
		 * Callback for all postMessage calls on the IFrame
		 *
		 * @param {Event} event IFRAME message event
		 */
		onIFrameMessage: function(event) {
			var data;
			if (!w.JSON || impl.cross_domain_url.indexOf(event.origin) === -1) {
				return;
			}

			try {
				data = w.JSON.parse(event.data);
			}
			catch (error) {
				log("JSON parsing failed. exiting...");
				return;
			}

			if (data) {
				// convert cookie parameters to our own session
				impl.session = {
					ID: data.si,
					start: parseInt(data.ss, 10),
					length: parseInt(data.sl, 10)
				};

				impl.session_transferred_time = BOOMR.now();

				if (data.bcn) {
					BOOMR.fireEvent("config", {
						beacon_url: data.bcn,
						RT: {
							oboError: data.obo ? parseInt(data.obo, 10) : 0,
							loadTime: data.tt ? parseInt(data.tt, 10) : 0
						}
					});
				}
				else {
					BOOMR.fireEvent("config", {
						beacon_url: BOOMR.getBeaconURL()
					});
				}

				log("Session transferred at: " + impl.session_transferred_time + " session data is: " + BOOMR.utils.objectToString(impl.session));
				impl.session_transferred = true;

				// we may have missed the window to transfer the session to local BOOMR
				// and are blocking the beacon Try to retrigger is_complete checking
				BOOMR.sendBeacon();
				setTimeout(function() {
					// If we're debugging keep the iframe around, if not (default) remove it
					if (!impl.debug && d.getElementById(impl.iframe_name) !== null) {
						d.body.removeChild(d.getElementById(impl.iframe_name));
					}
				}, 0);
			}
		},

		/**
		 * Construct IFrame for the communication between boomerangs
		 *
		 * @param {string} url URL Path the IFrame should use as src
		 * @param {string} name name of the element
		 *
		 * @returns {FrameElement} IFrame pointing to URL invisible on the site itself
		 */
		buildIFrame: function(url, name) {
			var iframe;
			log("Adding IFrame!");

			try {
				iframe = d.createElement("<IFRAME>"); // IE <= 8
			}
			catch (ignore) {
				iframe = d.createElement("IFRAME"); // everything else
			}
			iframe.id = name;
			iframe.src = url;
			iframe.style.display = "none";

			return iframe;
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.CrossDomain = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {string} [config.CrossDomain.cross_domain_url] Cross domain IFRAME URL
		 * @param {boolean} [config.CrossDomain.sending] Whether or not this is the parent domain
		 * @param {number} [config.CrossDomain.session_transfer_timeout] Session transfer timeout (ms)
		 * @param {boolean} [config.CrossDomain.debug] Enable debugging
		 *
		 * @returns {@link BOOMR.plugins.CrossDomain} The CrossDomain plugin for chaining
		 * @memberof BOOMR.plugins.CrossDomain
		 */
		init: function(config) {
			var a, index;

			if (!BOOMR.plugins.RT) {
				return;
			}

			if (config.primary) {
				return;
			}
			else if (config.CrossDomain) {
				impl.enabled = true;
			}

			BOOMR.utils.pluginConfig(impl, config, "CrossDomain",
				["cross_domain_url", "sending", "session_transfer_timeout", "debug"]);

			if (!impl.enabled || impl.session_transferred) {
				return;
			}

			impl.plugin_start = BOOMR.now();

			// if postMessage is not supported bail and don't block the beacon
			if (!BOOMR.utils.hasPostMessageSupport()) {
				impl.session_transferred = true;
				impl.enabled = false;

				log("postMessage support is not available. Bailing..");
				return;
			}

			if (!impl.sending && impl.enabled) {
				if (impl.cross_domain_url) {
					// if we use the a.href trick below to cleanup a crossdomain URL string containing only spaces,
					// Chrome will return window.location but IE will return the parent folder of the URI.
					impl.cross_domain_url = impl.cross_domain_url.replace(/^\s+|\s+$/g, "");  // trim spaces
				}
				if (!impl.cross_domain_url) {
					impl.enabled = false;
					return;
				}
				// Normalize the URL
				a = d.createElement("a");
				a.href = impl.cross_domain_url;
				// If we're supposed to receive data from a child frame
				// and the Main Domain URL is the same as the current location or the URL is not a http request
				// stop what we're doing and disable the plugin
				if (a.href === BOOMR.window.location.href || !a.href.match(/^https?:\/\//)) {
					impl.enabled = false;
					return;
				}
				impl.cross_domain_url = a.href;

				log("CrossDomain frame for URL: " + impl.cross_domain_url);
				impl.setup(impl.cross_domain_url);
				setTimeout(function() {
					// Skip this if time out happens after session transfer
					if (impl.session_transferred) {
						return;
					}

					impl.session_transfer_timedout = true;
					impl.session_transferred = true;

					if (!impl.debug) {
						d.body.removeChild(d.getElementById(impl.iframe_name));
					}

					log("Session transfer timedout. Setting transferred and setting timedout flag!");

					// trigger a beacon
					BOOMR.sendBeacon();

				}, impl.session_transfer_timeout);
			}

			// If sending is enabled we know that we're on the primary domain
			if (impl.sending && impl.enabled) {
				// make sure boomerang doesn't do anything at this point
				BOOMR.disable();

				log("Client preparing to send postMessage");

				// remove hash ('#')
				var query = w.location.hash.substring(1, w.location.hash.length);
				log("Session Data passed via Query: " + query);
				var items = query.split("&");
				var values = {};

				for (index = 0; index < items.length; index++) {
					var group = items[index].split("=");
					if (group && group.hasOwnProperty("length") && group.length >= 2) {
						values[group[0]] = group[1];
					}
				}

				var querySession = {
					start: values.start,
					length: values.length,
					ID: values.ID
				};

				var queryCookie = {
					obo: values.obo,
					tt: values.tt
				};

				try {
					querySession.start = parseInt(querySession.start);
					querySession.length = parseInt(querySession.length);

					// If the session passed in via query string is
					// longer and started earlier than the session on
					// the primary domain we're updating primary domain
					if ((typeof BOOMR.session.start !== "number" || querySession.start < BOOMR.session.start) &&
						querySession.length >= BOOMR.session.length &&
						querySession.start > (BOOMR.now() - maxSessionExpiry)) {
						BOOMR.session.start = querySession.start;

						if (!BOOMR.session.ID || typeof querySession.ID === "string") {
							BOOMR.session.ID = querySession.ID;
						}
					}

					BOOMR.plugins.RT.updateCookie();

					queryCookie.obo = parseInt(queryCookie.obo);
					queryCookie.tt = parseInt(queryCookie.tt);
					if (!isNaN(queryCookie.obo) && !isNaN(queryCookie.tt)) {
						this.updateCookie(queryCookie);
					}
				}
				catch (ignore) {
					/* not doing anything with the passed session info if not valid */
				}

				// Make sure Session Start is available
				var start = BOOMR.session.start;
				if (!start) {
					start = BOOMR.plugins.RT.navigationStart() || BOOMR.t_lstart || BOOMR.t_start;
				}

				// the cookie should be set by now since we've run .updateCookie()
				var messageObject = BOOMR.plugins.RT.getCookie();

				// Working around IE8 sending postMessage content as [object Object]
				if (!w.JSON) {
					log("JSON not available, not going to try and serialize message!");
					return;
				}

				var messageString = w.JSON.stringify(messageObject);

				w.parent.postMessage(messageString, "*");
				log("Sending data: session " + messageString);

				// Since we're not required to do anything else, other than sending a postMessage
				// we don't need to block boomerang
				impl.session_transferred = true;
			}
		},

		/**
		 * Updates the Boomerang query cookie
		 *
		 * @param {object} queryCookie Query cookie values
		 */
		updateCookie: function(queryCookie) {
			if (BOOMR.plugins.RT) {
				BOOMR.fireEvent("config", {
					RT: {
						oboError: queryCookie.obo,
						loadTime: queryCookie.tt
					}
				});
			}
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.CrossDomain
		 */
		is_complete: function() {
			if (impl.sending) {
				return true;
			}

			if (impl.session_transfer_complete) {
				return true;
			}

			// Since this is before session data is set we override
			// session data here before it's put on the beacon
			if (impl.session &&
			    !impl.session_transfer_timedout &&
			    impl.enabled &&
			    impl.session_transferred) {
				// Make sure that we are only updating the session start time if the following criteria match:
				//  - session.start is less than 24h old (maxSessionExpiry)
				//  - session.start is less than current BOOMR.session.start or BOOMR.now() if BOOMR.session.start does not exist
				if (!isNaN(impl.session.start) &&
					impl.session.start > (BOOMR.now() - maxSessionExpiry) &&
					impl.session.start < (typeof BOOMR.session.start === "number" ? BOOMR.session.start : BOOMR.now())) {
					BOOMR.session.start = impl.session.start;

					// if we're given a session length greater than our own, use it instead
					if (!isNaN(impl.session.length) && impl.session.length > BOOMR.session.length) {
						BOOMR.session.length = impl.session.length;

						/* SOASTA PRIVATE START */
						// Increment it for current session navigation
						BOOMR.plugins.RT.incrementSessionDetails();
						/* SOASTA PRIVATE END */
					}

					BOOMR.session.ID = impl.session.ID;

					if (BOOMR.plugins.RT) {
						BOOMR.plugins.RT.updateCookie();
					}
				}

				log("It took " + (impl.session_transferred_time - impl.plugin_start) + " miliseconds to transfer session data.");
				BOOMR.addVar("rt.sstr_dur", impl.session_transferred_time - impl.plugin_start);
				impl.session_transfer_complete = true;
			}

			if (impl.session_transfer_timedout) {
				log("Session transfer timedout setting rt.sstr_to to 1");
				BOOMR.addVar("rt.sstr_to", 1);
			}

			return impl.session_transferred || !impl.enabled;
		}

	};
}());
