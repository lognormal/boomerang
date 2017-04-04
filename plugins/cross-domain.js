(function() {
	BOOMR = BOOMR || {};
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
		 * Beacon destination URL, passed over when updating session info
		 */
		beacon_url: "",

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

			var urlQueryParams = BOOMR.utils.objectToString(BOOMR.session, "&");
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
					BOOMR.fireEvent("onconfig", {
						beacon_url: data.bcn,
						RT: {
							oboError: data.obo ? parseInt(data.obo, 10) : 0,
							loadTime: data.tt ? parseInt(data.tt, 10) : 0
						}
					});
				}
				else {
					BOOMR.fireEvent("onconfig", {
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
		 * @param {string} url - URL Path the IFrame should use as src
		 * @param {string} name - name of the element
		 *
		 * @returns {FrameElement} - IFrame pointing to URL invisible on the site itself
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
		},
		hasPostMessageSupport: function() {
			log("Checking if postMessage is supported.");
			if (!w.postMessage || typeof w.postMessage !== "function" && typeof w.postMessage !== "object") {
				return false;
			}
			return true;
		}
	};

	BOOMR.plugins.CrossDomain = {
		onConfigCb: function(config) {
			if (config.beacon_url) {
				impl.beacon_url = config.beacon_url;
			}
		},
		init: function(config) {
			var a;

			if (config.primary) {
				return;
			}
			else if (config.CrossDomain) {
				impl.enabled = true;
			}

			if (!BOOMR.plugins.RT) {
				return;
			}

			BOOMR.utils.pluginConfig(impl, config, "CrossDomain", ["cross_domain_url", "sending", "session_transfer_timeout", "debug"]);
			impl.plugin_start = BOOMR.now();
			log("Plugin started at: " + impl.plugin_start);

			// Normalize the URL
			a = d.createElement("a");
			a.href = impl.cross_domain_url;
			impl.cross_domain_url = a.href;

			// if postMessage is not supported bail and don't block the beacon
			if (!impl.hasPostMessageSupport()) {
				impl.session_transferred = true;
				impl.enabled = false;

				log("postMessage support is not available. Bailing..");
				return;
			}

			if (impl.cross_domain_url && !impl.sending && impl.enabled) {
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
				log("Client preparing to send postMessage");

				var query = w.location.hash;
				var querySession = {
					start: BOOMR.utils.getQueryParamValue("start", query),
					length: BOOMR.utils.getQueryParamValue("length", query),
					ID: BOOMR.utils.getQueryParamValue("ID", query)
				};

				var queryCookie = {
					obo: BOOMR.utils.getQueryParamValue("obo", query),
					tt: BOOMR.utils.getQueryParamValue("tt", query)
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
					}

					BOOMR.session.length++;
					BOOMR.plugins.RT.updateCookie();

					queryCookie.obo = parseInt(queryCookie.obo);
					queryCookie.tt = parseInt(queryCookie.tt);

					this.updateCookie(queryCookie);
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

				// make sure boomerang doesn't do anything at this point
				BOOMR.disable();
			}
		},
		updateCookie: function(queryCookie) {
			if (BOOMR.plugins.RT) {
				BOOMR.fireEvent("onconfig", {
					RT: {
						oboError: queryCookie.obo,
						loadTime: queryCookie.tt
					}
				});
			}
		},
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
				if (!isNaN(impl.session.start) && impl.session.start > (BOOMR.now() - maxSessionExpiry)) {
					BOOMR.session.start = impl.session.start;

					// if we're given a session length greater than our own, use it instead
					if (!isNaN(impl.session.length) && impl.session.length > BOOMR.session.length) {
						BOOMR.session.length = impl.session.length;
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
