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
		 *  - Plugin is flagged as complete
		 *  - Session from main Domain is not used on this session
		 */
		session_transfer_timeout: 1500,

		/**
		 * Opens a new hidden IFrame to the url passed in and fetches
		 * the session data via postMessage and messageEvents to
		 * communicate between frames.
		 *
		 * @param {string} url - URL to point to for the main domain URL
		 */
		setup: function(url) {
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
			if (!w.JSON) {
				return;
			}

			try {
				data = w.JSON.parse(event.data);
			}
			catch (error) {
				log("JSON parsing failed. exiting...");
				return;
			}

			if (data
			    && impl.cross_domain_url.indexOf(event.origin) >= -1
			    && data.session) {
				impl.session = data.session;
				impl.session_transferred_time = BOOMR.now();
				log("Session transferred at: " + impl.session_transferred_time + " session data is: " + BOOMR.utils.objectToString(impl.session));
				impl.session_transferred = true;

				// we may have missed the window to transfer the session to local BOOMR
				// and are blocking the beacon Try to retrigger is_complete checking
				BOOMR.sendBeacon();
				setTimeout(function() {
					// If we're debugging keep the iframe around, if not (default) remove it
					if (!impl.debug) {
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
		init: function(config) {
			if (config.primary) {
				return;
			}
			else if (config.CrossDomain) {
				impl.enabled = true;
			}

			BOOMR.utils.pluginConfig(impl, config, "CrossDomain", ["cross_domain_url", "sending", "session_transfer_timeout", "debug"]);
			impl.plugin_start = BOOMR.now();
			log("Plugin started at: " + impl.plugin_start);

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
					log("Session transfer timedout. Setting transferred and setting timedout flag!");

				}, impl.session_transfer_timeout);
			}

			// If sending is enabled we know that we're on the primary domain
			if (impl.sending && impl.enabled) {
				log("Client preparing to send postMessage");

				// Make sure Session Start is available
				var start = BOOMR.session.start;
				if (!start) {
					if (BOOMR.plugins.RT) {
						start = BOOMR.plugins.RT.navigationStart();
					}
					else {
						start = BOOMR.t_lstart || BOOMR.t_start;
					}
				}

				var messageObject = {
					session: {
						ID: BOOMR.session.ID,
						length: BOOMR.session.length,
						start: start
					}
				};

				// Working around IE8 sending postMessage content as [object Object]
				if (!w.JSON) {
					log("JSON not available, not going to try and serialize message!");
				}
				var messageString = w.JSON.stringify(messageObject);

				w.parent.postMessage(messageString, "*");
				log("Sending data: session " + messageString);
				// Since we're not required to do anything else, other than sending a postMessage
				// we don't need to block boomerang
				impl.session_transferred = true;
			}
		},
		updateSession: function(session) {
			// Make sure that we are only updating the session start time if the following criteria match:
			//  - session.start is less than 24h old (maxSessionExpiry)
			//  - BOOMR.session.start is not defined
			//  - session.start is an older timestamp than BOOMR.session.start
			if (!isNaN(session.start) &&
			    session.start > (BOOMR.now() - maxSessionExpiry) &&
			    (isNaN(BOOMR.session.start) || BOOMR.session.start > session.start)) {
				BOOMR.session.start = session.start;
			}
			else {
				return;
			}

			BOOMR.session.ID = session.ID;

			// Since we're on a different page than the
			// session originated from we need to increment
			// session length
			BOOMR.session.length = session.length + 1;

			if (BOOMR.plugins.RT) {
				BOOMR.plugins.RT.updateCookie();
			}
		},
		is_complete: function() {
			if (impl.sending) {
				return true;
			}
			// Since this is before session data is set we override
			// session data here before it's put on the beacon
			if (impl.session && !impl.session_transfer_timedout && impl.enabled && impl.session_transferred) {
				this.updateSession(impl.session);
				log("It took " + (impl.session_transferred_time - impl.plugin_start) + " miliseconds to transfer session data.");
				BOOMR.addVar("rt.sstr_dur", impl.session_transferred_time - impl.plugin_start);
			}

			if (impl.session_transfer_timedout) {
				log("Session transfer timedout setting rt.sstr_to to 1");
				BOOMR.addVar("rt.sstr_to", 1);
			}

			return impl.session_transferred || !impl.enabled;
		}

	};

}());
