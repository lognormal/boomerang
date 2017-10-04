(function() {
	var d, handler, a, impl,
	    singlePageApp = false,
	    autoXhrEnabled = false,
	    alwaysSendXhr = false,
	    readyStateMap = [ "uninitialized", "open", "responseStart", "domInteractive", "responseEnd" ],
	    ie10or11;

	/**
	 * @constant
	 * @desc
	 * Single Page Applications get an additional timeout for all XHR Requests to settle in.
	 * This is used after collecting resources for a SPA routechange
	 * @type {number}
	 * @default
	 */
	var SPA_TIMEOUT = 1000;

	/**
	 * How long to wait if we're not ready to send a beacon to try again.
	 * @constant
	 * @type {number}
	 * @default
	 */
	var READY_TO_SEND_WAIT = 500;

	/**
	 * @constant
	 * @desc Timeout event fired for XMLHttpRequest resource
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_TIMEOUT        = -1001;
	/**
	 * @constant
	 * @desc XMLHttpRequest was aborted
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_ABORT          = -999;
	/**
	 * @constant
	 * @desc An error code was returned by the HTTP Server
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_ERROR          = -998;
	/**
	 * @constant
	 * @desc An exception occured as we tried to request resource
	 * @type {number}
	 * @default
	 */
	var XHR_STATUS_OPEN_EXCEPTION = -997;

	// Default resources to count as Back-End during a SPA nav
	var SPA_RESOURCES_BACK_END = ["xmlhttprequest", "script"];

	// If this browser cannot support XHR, we'll just skip this plugin which will
	// save us some execution time.

	// XHR not supported or XHR so old that it doesn't support addEventListener
	// (IE 6, 7, 8, as well as newer running in quirks mode.)
	if (!window.XMLHttpRequest || !(new XMLHttpRequest()).addEventListener) {
		// Nothing to instrument
		return;
	}

	// User-agent sniff IE 10 and IE 11 to apply a workaround for an XHR bug (see below when
	// this variable is used).  We can only detect this bug by UA sniffing.  IE 11 requires a
	// different way of detection than IE 11.
	ie10or11 = (window.navigator && navigator.appVersion && navigator.appVersion.indexOf("MSIE 10") !== -1) ||
	           (window.navigator && navigator.userAgent && navigator.userAgent.match(/Trident.*rv[ :]*11\./));

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.AutoXHR) {
		return;
	}

	function log(msg) {
		BOOMR.debug(msg, "AutoXHR");
	}
	/**
	 * @memberof AutoXHR
	 * @desc
	 * Tries to resolve href links from relative URLs
	 * This implementation takes into account a bug in the way IE handles relative paths on anchors and resolves this
	 * by assigning a.href to itself which triggers the URL resolution in IE and will fix missing leading slashes if
	 * necessary
	 *
	 * @param {string} anchor - the anchor object to resolve
	 * @returns {string} - The unrelativized URL href
	 */
	function getPathName(anchor) {
		if (!anchor) {
			return null;
		}

		/*
		 correct relativism in IE
		 anchor.href = "./path/file";
		 anchor.pathname == "./path/file"; //should be "/path/file"
		 */
		anchor.href = anchor.href;

		/*
		 correct missing leading slash in IE
		 anchor.href = "path/file";
		 anchor.pathname === "path/file"; //should be "/path/file"
		 */
		var pathName = anchor.pathname;
		if (pathName.charAt(0) !== "/") {
			pathName = "/" + pathName;
		}

		return pathName;
	}

	/**
	 * @memberof AutoXHR
	 * @private
	 * @desc
	 * Based on the contents of BOOMR.xhr_excludes check if the URL that we instrumented as XHR request
	 * matches any of the URLs we are supposed to not send a beacon about.
	 *
	 * @param {HTMLAnchorElement} anchor - <a> element with URL of the element checked agains BOOMR.xhr_excludes
	 * @returns {boolean} - `true` if intended to be excluded, `false` if it is not in the list of excludables
	 */
	function shouldExcludeXhr(anchor) {
		if (anchor.href && anchor.href.match(/^(about:|javascript:|data:)/i)) {
			return true;
		}

		return BOOMR.xhr_excludes.hasOwnProperty(anchor.href) ||
			BOOMR.xhr_excludes.hasOwnProperty(anchor.hostname) ||
			BOOMR.xhr_excludes.hasOwnProperty(getPathName(anchor));
	}

	/**
	 * @class MutationHandler
	 * @desc
	 * If MutationObserver is supported on the browser we are running on this will handle [case 1]{@link AutoXHR#description} of the AutoXHR
	 * class.
	 */

	/**
	 * @constructor
	 */
	function MutationHandler() {
		this.watch = 0;
		this.timer = null;

		this.pending_events = [];
	}

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Disable internal MutationObserver instance. Use this when uninstrumenting the site we're on.
	 */
	MutationHandler.stop = function() {
		MutationHandler.pause();
		MutationHandler.observer = null;
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Pauses the MutationObserver.  Call [resume]{@link handler#resume} to start it back up.
	 */
	MutationHandler.pause = function() {
		if (MutationHandler.observer &&
		    MutationHandler.observer.observer &&
		    !MutationHandler.isPaused) {
			MutationHandler.isPaused = true;
			MutationHandler.observer.observer.disconnect();
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Resumes the MutationObserver after a [pause]{@link handler#pause}.
	 */
	MutationHandler.resume = function() {
		if (MutationHandler.observer &&
		    MutationHandler.observer.observer &&
		    MutationHandler.isPaused) {
			MutationHandler.isPaused = false;
			MutationHandler.observer.observer.observe(d, MutationHandler.observer.config);
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @static
	 *
	 * @desc
	 * Initiate {@link MutationHandler.observer} on the [outer parent document]{@link BOOMR.window.document}.
	 * Uses [addObserver}{@link BOOMR.utils.addObserver} to instrument. [Our internal handler]{@link handler#mutation_cb}
	 * will be called if something happens
	 */
	MutationHandler.start = function() {
		if (MutationHandler.observer) {
			// don't start twice
			return;
		}

		var config = {
			childList: true,
			attributes: true,
			subtree: true,
			attributeFilter: ["src", "href"]
		};

		// Add a perpetual observer
		MutationHandler.observer = BOOMR.utils.addObserver(
			d,
			config,
			null, // no timeout
			handler.mutation_cb, // will always return true
			null, // no callback data
			handler
		);

		if (MutationHandler.observer) {
			MutationHandler.observer.config = config;

			BOOMR.subscribe("page_unload", MutationHandler.stop, null, MutationHandler);
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 *
	 * @desc
	 * If an event has triggered a resource to be fetched we add it to the list of pending events
	 * here and wait for it to eventually resolve.
	 *
	 * @param {object} resource - [Resource]{@link AutoXHR#Resource} object we are waiting for
	 *
	 * @returns {?index} - If we are already waiting for an event of this type null otherwise index in the [queue]{@link MutationHandler#pending_event}.
	 */
	MutationHandler.prototype.addEvent = function(resource) {
		var ev = {
			type: resource.initiator,
			resource: resource,
			nodes_to_wait: 0,
			resources: [],
			complete: false
		},
		    i,
		    last_ev,
		    index = this.pending_events.length;

		for (i = index - 1; i >= 0; i--) {
			if (this.pending_events[i] && !this.pending_events[i].complete) {
				last_ev = this.pending_events[i];
				break;
			}
		}

		if (last_ev) {
			if (last_ev.type === "click") {
				// 3.1 & 3.3
				if (last_ev.nodes_to_wait === 0 || !last_ev.resource.url) {
					this.pending_events[i] = undefined;
					return null;// abort
				}
				// last_ev will no longer receive watches as ev will receive them
				// last_ev will wait fall interesting nodes and then send event
			}
			else if (last_ev.type === "xhr") {
				// 3.2
				if (ev.type === "click") {
					return null;
				}

				// 3.4
				// nothing to do
			}
			else if (BOOMR.utils.inArray(last_ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// This could occur if this event started prior to the SPA taking
				// over, and is now completing while the SPA event is occuring.  Let
				// the SPA event take control.
				if (ev.type === "xhr") {
					return null;
				}
			}
		}

		this.watch++;
		this.pending_events.push(ev);

		// If we don't have a MutationObserver, then we just abort
		if (!MutationHandler.observer) {
			if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// try to start it, in case we haven't had the chance to yet
				MutationHandler.start();

				// Give SPAs a bit more time to do something since we know this was
				// an interesting event (e.g. XHRs)
				this.setTimeout(SPA_TIMEOUT, index);

				return index;
			}

			// If we already have detailed resource we can forward the event
			if (resource.url && resource.timing.loadEventEnd) {
				this.sendEvent(index);
			}

			return null;
		}
		else {
			if (!BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// Give clicks and history changes 50ms to see if they resulted
				// in DOM mutations (and thus it is an 'interesting event').
				this.setTimeout(50, index);
			}
			else {
				// Give SPAs a bit more time to do something since we know this was
				// an interesting event.
				this.setTimeout(SPA_TIMEOUT, index);
			}

			return index;
		}
	};

	/**
	 * @method
	 * @memberof MutationHandler
	 * @desc
	 *
	 * If called with an event in the [pending events list]{@link MutationHandler#pending_events}
	 * trigger a beacon for this event.
	 *
	 * When the beacon is sent for this event is depending on either having a crumb, in which case this
	 * beacon will be sent immediately. If that is not the case we wait 5 seconds and attempt to send the
	 * event again.
	 *
	 * @param {number} i - index in event list to send
	 *
	 * @returns {undefined} - returns early if the event already completed
	 */
	MutationHandler.prototype.sendEvent = function(i) {
		var ev = this.pending_events[i], self = this;

		if (!ev || ev.complete) {
			return;
		}

		this.clearTimeout();
		if (BOOMR.readyToSend()) {
			ev.complete = true;

			this.watch--;

			ev.resource.resources = ev.resources;

			// if this was an SPA nav that triggered no additional resources, substract the
			// SPA_TIMEOUT from now to determine the end time
			if (BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS) && ev.resources.length === 0) {
				ev.resource.timing.loadEventEnd = BOOMR.now() - SPA_TIMEOUT;
			}

			this.sendResource(ev.resource, i);
		}
		else {
			// No crumb, so try again after 500ms seconds
			setTimeout(function() { self.sendEvent(i); }, READY_TO_SEND_WAIT);
		}
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Creates and triggers sending a beacon for a Resource that has finished loading.
	 *
	 * @param {Resource} resource - The Resource to send a beacon on
	 * @param {number} eventIndex - index of the event in the pending_events array
	 */
	MutationHandler.prototype.sendResource = function(resource, eventIndex) {
		var self = this;

		// Use 'requestStart' as the startTime of the resource, if given
		var startTime = resource.timing ? resource.timing.requestStart : undefined;

		/**
		  * Called once the resource can be sent
		  * @param markEnd Sets loadEventEnd once the function is run
		 */
		var sendResponseEnd = function(markEnd) {
			if (markEnd) {
				resource.timing.loadEventEnd = BOOMR.now();
			}

			// send any queued beacons first
			BOOMR.real_sendBeacon();

			// If the resource has an onComplete event, trigger it.
			if (resource.onComplete) {
				resource.onComplete(resource);
			}

			// Add ResourceTiming data to the beacon, starting at when 'requestStart'
			// was for this resource.
			if (BOOMR.plugins.ResourceTiming &&
			    BOOMR.plugins.ResourceTiming.is_supported() &&
			    resource.timing &&
			    resource.timing.requestStart) {
				var r = BOOMR.plugins.ResourceTiming.getCompressedResourceTiming(
						resource.timing.requestStart,
						resource.timing.loadEventEnd
					);

				BOOMR.plugins.ResourceTiming.addToBeacon(r);
			}

			// For SPAs, calculate Back-End and Front-End timings
			if (BOOMR.utils.inArray(resource.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				self.calculateSpaTimings(resource);
			}

			BOOMR.responseEnd(resource, startTime, resource);

			if (eventIndex) {
				self.pending_events[eventIndex] = undefined;
			}
		};

		// send the beacon if we were not told to hold it
		if (!resource.wait) {
			// if this is a SPA event, make sure it doesn't fire until onload
			if (BOOMR.utils.inArray(resource.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				if (d && d.readyState && d.readyState !== "complete") {
					BOOMR.window.addEventListener("load", function() {
						sendResponseEnd(true);
					});

					return;
				}
			}

			sendResponseEnd(false);
		}
		else {
			// waitComplete() should be called once the held beacon is complete
			resource.waitComplete = function() {
				sendResponseEnd(true);
			};
		}
	};

	/**
	  * Calculates SPA Back-End and Front-End timings for Hard and Soft
	  * SPA navigations.
	  *
	  * @param resource Resouce to calculate for
	 */
	MutationHandler.prototype.calculateSpaTimings = function(resource) {
		var p = BOOMR.getPerformance();
		if (!p || !p.timing) {
			return;
		}

		//
		// Hard Navigation:
		// Use same timers as a traditional navigation, where the root HTML's
		// timestamps are used for Back-End calculation.
		//
		if (resource.initiator === "spa_hard") {
			// ensure RT picks up the correct timestamps
			resource.timing.responseEnd = p.timing.responseStart;

			// use navigationStart instead of fetchStart to ensure Back-End time
			// includes any redirects
			resource.timing.fetchStart = p.timing.navigationStart;
		}
		else {
			//
			// Soft Navigation:
			// We need to overwrite two timers: Back-End (t_resp) and Front-End (t_page).
			//
			// For Single Page Apps, we're defining these as:
			// Back-End: Any timeslice where a XHR or JavaScript was outstanding
			// Front-End: Total Time - Back-End
			//
			if (!BOOMR.plugins.ResourceTiming) {
				return;
			}

			// first, gather all Resources that were outstanding during this SPA nav
			var resources = BOOMR.plugins.ResourceTiming.getFilteredResourceTiming(
				resource.timing.requestStart,
				resource.timing.loadEventEnd,
				impl.spaBackEndResources).entries;

			// determine the total time based on the SPA logic
			var totalTime = Math.round(resource.timing.loadEventEnd - resource.timing.requestStart);

			if (!resources || !resources.length) {
				if (BOOMR.plugins.ResourceTiming.is_supported()) {
					// If ResourceTiming is supported, but there were no entries,
					// this was all Front-End time
					resource.timers = {
						t_resp: 0,
						t_page: totalTime,
						t_done: totalTime
					};
				}

				return;
			}

			// we currently can't reliably tell when a SCRIPT has loaded
			// set an upper bound on responseStart/responseEnd for the resources to the SPA's loadEventEnd
			var maxResponseEnd = resource.timing.loadEventEnd - p.timing.navigationStart;
			for (var i = 0; i < resources.length; i++) {
				if (resources[i].responseStart > maxResponseEnd) {
					resources[i].responseStart = maxResponseEnd;
					resources[i].responseEnd = maxResponseEnd;
				}
				else if (resources[i].responseEnd > maxResponseEnd) {
					resources[i].responseEnd = maxResponseEnd;
				}
			}

			// calculate the Back-End time based on any time those resources were active
			var backEndTime = Math.round(BOOMR.plugins.ResourceTiming.calculateResourceTimingUnion(resources));

			// front-end time is anything left over
			var frontEndTime = totalTime - backEndTime;

			if (backEndTime < 0 || totalTime < 0 || frontEndTime < 0) {
				// some sort of error, don't put on the beacon
				BOOMR.addError("Incorrect SPA time calculation");
				return;
			}

			// set timers on the resource so RT knows to use them
			resource.timers = {
				t_resp: backEndTime,
				t_page: frontEndTime,
				t_done: totalTime
			};
		}
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Will create a new timer waiting for `timeout` milliseconds to wait until a resources load time has ended or should have ended.
	 * If the timeout expires the Resource at `index` will be marked as timedout and result in an error Resource marked with
	 * [XHR_STATUS_TIMEOUT]{@link AutoXHR#XHR_STATUS_TIMEOUT} as status information.
	 *
	 * @param {number} timeout - time ot wait for the resource to be loaded
	 * @param {number} index - Index of the {@link Resource} in our {@link MutationHandler#pending_events}
	 */
	MutationHandler.prototype.setTimeout = function(timeout, index) {
		var self = this;
		if (!timeout) {
			return;
		}

		this.clearTimeout();

		this.timer = setTimeout(function() { self.timedout(index); }, timeout);
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Sends a Beacon for the [Resource]{@link AutoXHR#Resource} at `index` with the status
	 * [XHR_STATUS_TIMEOUT]{@link AutoXHR#XHR_STATUS_TIMEOUT} code, If there are multiple resources attached to the
	 * `pending_events` array at `index`.
	 *
	 * @param {number} index - Index of the event in pending_events array
	 */
	MutationHandler.prototype.timedout = function(index) {
		var ev;
		this.clearTimeout();

		ev = this.pending_events[index];

		if (ev && BOOMR.utils.inArray(ev.type, BOOMR.constants.BEACON_TYPE_SPAS.concat("xhr"))) {
			// XHRs or SPA page loads
			if (ev.nodes_to_wait === 0) {
				// send page loads (SPAs) if there are no outstanding downloads
				this.sendEvent(index);
			}

			// if there are outstanding downloads left, they will trigger a sendEvent for the SPA once complete
		}
		else {
			if (this.watch > 0) {
				this.watch--;
			}
			this.pending_events[index] = undefined;
		}
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * If this instance of the {@link MutationHandler} has a `timer` set, clear it
	 */
	MutationHandler.prototype.clearTimeout = function() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	};

	/**
	 * @memberof MutationHandler
	 * @callback load_cb
	 *
	 * @desc
	 * Once an asset has been loaded and the resource appeared in the page we check if it was part of the interesting events
	 * on the page and mark it as finished.
	 *
	 * @param {Event} ev - Load event Object
	 */
	MutationHandler.prototype.load_cb = function(ev, resourceNum) {
		var target, index, now = BOOMR.now();

		target = ev.target || ev.srcElement;
		if (!target || !target._bmr) {
			return;
		}

		index = target._bmr.idx;
		resourceNum = typeof resourceNum !== "undefined" ? resourceNum : (target._bmr.res || 0);

		if (target._bmr.end[resourceNum]) {
			// If we've already set the end value, don't call load_finished
			// again.  This might occur on IMGs that are 404s, which fire
			// 'error' then 'load' events
			return;
		}

		target._bmr.end[resourceNum] = now;

		this.load_finished(index, now);
	};

	/**
	 * @memberof MutationHandler
	 * @method
	 *
	 * @desc
	 * Decrement the number of [nodes_to_wait]{@link AutoXHR#.PendingEvent} for the the
	 * [PendingEvent Object]{@link AutoXHR#.PendingEvent}.
	 *
	 * If the nodes_to_wait is decremented to 0 and the event type was SPA:
	 *
	 * When we're finished waiting on the last node,
	 * the MVC engine (eg AngularJS) might still be doing some processing (eg
	 * on an XHR) before it adds some additional content (eg IMGs) to the page.
	 * We should wait a while (1 second) longer to see if this happens.  If
	 * something else is added, we'll continue to wait for that content to
	 * complete.  If nothing else is added, the end event will be the
	 * timestamp for when this load_finished(), not 1 second from now.
	 *
	 * @param {number} index - Index of the event found in the pending_events array
	 * @param {TimeStamp} loadEventEnd - TimeStamp at which the resource was finnished loading
	 */
	MutationHandler.prototype.load_finished = function(index, loadEventEnd) {
		var current_event = this.pending_events[index];

		// event aborted
		if (!current_event) {
			return;
		}

		current_event.nodes_to_wait--;

		if (current_event.nodes_to_wait === 0) {
			// mark the end timestamp with what was given to us, or, now
			current_event.resource.timing.loadEventEnd = loadEventEnd || BOOMR.now();

			// For Single Page Apps, when we're finished waiting on the last node,
			// the MVC engine (eg AngularJS) might still be doing some processing (eg
			// on an XHR) before it adds some additional content (eg IMGs) to the page.
			// We should wait a while (1 second) longer to see if this happens.  If
			// something else is added, we'll continue to wait for that content to
			// complete.  If nothing else is added, the end event will be the
			// timestamp for when this load_finished(), not 1 second from now.
			if (BOOMR.utils.inArray(current_event.type, BOOMR.constants.BEACON_TYPE_SPAS)) {
				this.setTimeout(SPA_TIMEOUT, index);
			}
			else {
				this.sendEvent(index);
			}
		}
	};

	MutationHandler.prototype.wait_for_node = function(node, index) {
		var self = this, current_event, els, interesting = false, i, l, url, exisitingNodeSrcUrlChanged = false, resourceNum;

		// only images, scripts, iframes and links if stylesheet
		// nodeName for SVG:IMAGE returns `image` in lowercase
		if (node.nodeName.toUpperCase().match(/^(IMG|SCRIPT|IFRAME|IMAGE)$/) || (node.nodeName === "LINK" && node.rel && node.rel.match(/\<stylesheet\>/i))) {

			// if the attribute change affected the src/currentSrc attributes we want to know that
			// as that means we need to fetch a new Resource from the server
			if (node._bmr && node._bmr.res && node._bmr.end[node._bmr.res]) {
				exisitingNodeSrcUrlChanged = true;
			}

			// we put xlink:href before href because node.href works for <SVG:IMAGE> elements, but does not return a string
			url = node.src || node.getAttribute("xlink:href") || node.href;

			if (node.nodeName === "IMG") {
				if (node.naturalWidth && !exisitingNodeSrcUrlChanged) {
					// img already loaded
					return false;
				}
				else if (node.getAttribute("src") === "") {
					// placeholder IMG
					return false;
				}
			}

			// no URL or javascript: or about: or data: URL, so no network activity
			if (!url || url.match(/^(about:|javascript:|data:)/i)) {
				return false;
			}

			current_event = this.pending_events[index];

			if (!current_event) {
				return false;
			}

			// determine the resource number for this request
			resourceNum = current_event.resources.length;

			// create a placeholder ._bmr attribute
			if (!node._bmr) {
				node._bmr = {
					end: {}
				};
			}

			// keep track of all resources (URLs) seen for the root resource
			if (!current_event.urls) {
				current_event.urls = {};
			}

			if (current_event.urls[url]) {
				// we've already seen this URL, no point in waiting on it twice
				return false;
			}

			if (node.nodeName === "SCRIPT" && singlePageApp) {
				// TODO: we currently can't reliably tell when a SCRIPT has already loaded
				return false;
				/*
				 a.href = url;

				 var p = BOOMR.getPerformance()

				 // Check ResourceTiming to see if this was already seen.  If so,
				 // we won't see a 'load' or 'error' event fire, so skip this.
				 if (p && typeof p.getEntriesByType === "function") {
				 entries = p.getEntriesByName(a.href);
				 if (entries && entries.length > 0) {
				 console.error("Skipping " + a.href);
				 return false;
				 }
				 }
				 */
			}

			// if we don't have a URL yet (i.e. a click started this), use
			// this element's URL
			if (!current_event.resource.url) {
				a.href = url;

				if (impl.excludeFilter(a)) {
					BOOMR.debug("Exclude for " + a.href + " matched. Excluding", "AutoXHR");
					// excluded resource, so abort
					return false;
				}

				current_event.resource.url = a.href;
			}

			// update _bmr with details about this resource
			node._bmr.res = resourceNum;
			node._bmr.idx = index;

			node.addEventListener("load", function(ev) { self.load_cb(ev, resourceNum); });
			node.addEventListener("error", function(ev) { self.load_cb(ev, resourceNum); });

			current_event.nodes_to_wait++;
			current_event.resources.push(node);

			// Note that we're tracking this URL
			current_event.urls[url] = 1;

			interesting = true;
		}
		else if (node.nodeType === Node.ELEMENT_NODE) {
			["IMAGE", "IMG"].forEach(function(tagName) {
				els = node.getElementsByTagName(tagName);
				if (els && els.length) {
					for (i = 0, l = els.length; i < l; i++) {
						interesting |= this.wait_for_node(els[i], index);
					}
				}
			}, this);
		}

		return interesting;
	};

	/**
	  * Adds a resource to the current event.
	  *
	  * Might fail (return -1) if:
	  * a) There are no pending events
	  * b) The current event is complete
	  * c) There's no passed-in resource
	  *
	  * @param resource Resource
	  * @return Event index, or -1 on failure
	 */
	MutationHandler.prototype.add_event_resource = function(resource) {
		var index = this.pending_events.length - 1, current_event;
		if (index < 0) {
			return -1;
		}

		current_event = this.pending_events[index];
		if (!current_event) {
			return -1;
		}

		if (!resource) {
			return -1;
		}

		// increase the number of outstanding resources by one
		current_event.nodes_to_wait++;

		resource.index = index;

		return index;
	};

	/**
	 * @callback mutation_cb
	 * @memberof MutationHandler
	 * @desc
	 * Callback called once [Mutation Observer instance]{@link MutationObserver#observer} noticed a mutation on the page.
	 * This method will determine if a mutation on the page is interesting or not.
	 * @param {Mutation[]} mutations - Mutation array describing changes to the DOM
	 */
	MutationHandler.prototype.mutation_cb = function(mutations) {
		var self, index, evt;

		if (!this.watch) {
			return true;
		}

		self = this;
		index = this.pending_events.length - 1;

		if (index < 0 || !this.pending_events[index]) {
			// Nothing waiting for mutations
			return true;
		}

		evt = this.pending_events[index];
		if (typeof evt.interesting === "undefined") {
			evt.interesting = false;
		}

		if (mutations && mutations.length) {
			evt.resource.timing.domComplete = BOOMR.now();

			mutations.forEach(function(mutation) {
				var i, l, node;
				if (mutation.type === "attributes") {
					evt.interesting |= self.wait_for_node(mutation.target, index);
				}
				else if (mutation.type === "childList") {
					// Go through any new nodes and see if we should wait for them
					l = mutation.addedNodes.length;
					for (i = 0; i < l; i++) {
						evt.interesting |= self.wait_for_node(mutation.addedNodes[i], index);
					}

					// Go through any removed nodes, and for IFRAMEs, see if we were
					// waiting for them.  If so, stop waiting, as removed IFRAMEs
					// don't trigger load or error events.
					l = mutation.removedNodes.length;
					for (i = 0; i < l; i++) {
						node = mutation.removedNodes[i];
						if (node.nodeName === "IFRAME" && node._bmr) {
							self.load_cb({target: node, type: "removed"});
						}
					}
				}
			});
		}

		if (!evt.interesting) {
			// if we didn't have any interesting nodes for this MO callback or
			// any prior callbacks, timeout the event
			this.setTimeout(SPA_TIMEOUT, index);
		}

		return true;
	};

	/**
	 * @desc
	 * Determines if the resources queue is empty
	 * @return {boolean} True if there are no outstanding resources
	 */
	MutationHandler.prototype.queue_is_empty = function() {
		if (this.pending_events.length === 0) {
			return true;
		}

		var index = this.pending_events.length - 1;

		if (!this.pending_events[index]) {
			return true;
		}

		if (this.pending_events[index].nodes_to_wait === 0) {
			return true;
		}

		return false;
	};

	handler = new MutationHandler();

	/**
	 * @function
	 * @desc
	 * Subscribe to click events on the page and see if they are triggering new
	 * resources fetched from the network in which case they are interesting
	 * to us!
	 */
	function instrumentClick() {
		// Capture clicks and wait 50ms to see if they result in DOM mutations
		BOOMR.subscribe("click", function() {
			if (singlePageApp) {
				// In a SPA scenario, only route changes (or events from the SPA
				// framework) trigger an interesting event.
				return;
			}

			var resource = { timing: {}, initiator: "click" };

			if (!BOOMR.orig_XMLHttpRequest || BOOMR.orig_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
				// do nothing if we have un-instrumented XHR
				return;
			}

			resource.timing.requestStart = BOOMR.now();

			handler.addEvent(resource);
		});
	}

	/**
	 * @function
	 * @desc
	 * Replace original window.XMLHttpRequest with our implementation instrumenting any AJAX Requests happening afterwards.
	 * This will also enable instrumentation of mouse events (clicks) and start the {@link MutationHandler}
	 *
	 * @returns {null} - returns early if we need to re-instrument
	 */
	function instrumentXHR() {
		if (BOOMR.proxy_XMLHttpRequest && BOOMR.proxy_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
			// already instrumented
			return;
		}
		if (BOOMR.proxy_XMLHttpRequest && BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
			// was once instrumented and then uninstrumented, so just reapply the old instrumented object

			BOOMR.window.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
			MutationHandler.start();

			return;
		}

		// if there's a orig_XMLHttpRequest on the window, use that first (if another lib is overwriting XHR)
		BOOMR.orig_XMLHttpRequest = BOOMR.window.orig_XMLHttpRequest || BOOMR.window.XMLHttpRequest;

		MutationHandler.start();

		instrumentClick();

		/**
		 * @memberof ProxyXHRImplementation
		 * @desc
		 * Open an XMLHttpRequest.
		 * If the URL passed as a second argument is in the BOOMR.xhr_exclude list ignore it and move on to request it
		 * Otherwise add it to our list of resources to monitor and later beacon on.
		 *
		 * If an exception is caught will call loadFinished and set resource.status to {@link XHR_STATUS_OPEN_EXCEPTION}
		 * Should the resource fail to load for any of the following reasons resource.stat status code will be set to:
		 *
		 * - timeout {Event} {@link XHR_STATUS_TIMEOUT}
		 * - error {Event} {@link XHR_STATUS_ERROR}
		 * - abort {Event} {@link XHR_STATUS_ABORT}
		 *
		 * @param method {String} - HTTP request method
		 * @param url {String} - URL to request on
		 * @param async {boolean} - [optional] if true will setup the EventListeners for XHR events otherwise will set the resource
		 *                          to synchronous. If true or undefined will be automatically set to asynchronous
		 */
		BOOMR.proxy_XMLHttpRequest = function() {
			var req, resource = { timing: {}, initiator: "xhr" }, orig_open, orig_send,
			    opened = false;

			req = new BOOMR.orig_XMLHttpRequest();

			orig_open = req.open;
			orig_send = req.send;

			req.open = function(method, url, async) {
				a.href = url;

				if (impl.excludeFilter(a)) {
					BOOMR.debug("Exclude found for resource: " + a.href + " Skipping instrumentation!", "AutoXHR");
					// skip instrumentation and call the original open method
					return orig_open.apply(req, arguments);
				}

				// Default value of async is true
				if (async === undefined) {
					async = true;
				}

				BOOMR.fireEvent("xhr_init", "xhr");

				/**
				 * @memberof ProxyXHRImplementation
				 * @desc
				 * Mark this as the time load ended via resources loadEventEnd property, if this resource has been added
				 * to the {@link MutationHandler} already notify that the resource has finished.
				 * Otherwise add this call to the lise of Events that occured.
				 */
				function loadFinished() {
					var entry, navSt, useRT = false, now = BOOMR.now(), entryStartTime, entryResponseEnd;

					// if we already finished via readystatechange or an error event,
					// don't do work again
					if (resource.timing.loadEventEnd) {
						return;
					}

					// fire an event for anyone listening
					if (resource.status) {
						BOOMR.fireEvent("onxhrerror", resource);
					}

					// set the loadEventEnd timestamp to when this callback fired
					resource.timing.loadEventEnd = now;

					// if ResourceTiming is available, fix-up the .timings with ResourceTiming data, as it will be more accurate
					entry = BOOMR.getResourceTiming(resource.url, function(x, y) { return x.responseEnd - y.responseEnd; });
					if (entry) {
						navSt = BOOMR.getPerformance().timing.navigationStart;

						// re-set the loadEventEnd timestamp to make sure it's greater than values in ResourceTiming entry
						resource.timing.loadEventEnd = BOOMR.now();

						// convert the start time to Epoch
						entryStartTime = Math.floor(navSt + entry.startTime);

						// validate the start time to make sure it's not from another entry
						if (resource.timing.requestStart - entryStartTime >= 2) {
							// if the ResourceTiming startTime is more than 2ms earlier
							// than when we thought the XHR started, this is probably
							// an entry for a different fetch
							useRT = false;
						}
						else {
							// set responseEnd as long as it looks sane
							if (entry.responseEnd !== 0) {
								// convert to Epoch
								entryResponseEnd = Math.floor(navSt + entry.responseEnd);

								// sanity check to see if the entry should be used for this resource
								if (entryResponseEnd <= resource.timing.loadEventEnd) {
									resource.timing.responseEnd = entryResponseEnd;

									// use this entry's other timestamps
									useRT = true;

									// save the entry for later use
									resource.restiming = entry;
								}
							}

							// set more timestamps if we think the entry is valid
							if (useRT) {
								// use the startTime from ResourceTiming instead
								resource.timing.requestStart = entryStartTime;

								// also track it as the fetchStart time
								resource.timing.fetchStart = entryStartTime;

								// use responseStart if it's valid
								if (entry.responseStart !== 0) {
									resource.timing.responseStart = Math.floor(navSt + entry.responseStart);
								}
							}
						}
					}

					if (resource.index > -1) {
						// If this XHR was added to an existing event, fire the
						// load_finished handler for that event.
						handler.load_finished(resource.index, resource.timing.responseEnd);
					}
					else if (alwaysSendXhr) {
						handler.sendResource(resource);
					}
					else if (!singlePageApp || autoXhrEnabled) {
						// Otherwise, if this is a SPA+AutoXHR or just plain
						// AutoXHR, use addEvent() to see if this will trigger
						// a new interesting event.
						handler.addEvent(resource);
					}
				}

				/**
				 * @memberof ProxyXHRImplementation
				 * @desc
				 * Setup an {EventListener} for Event @param{ename}. This function will make sure the timestamp for the resources request is set and calls
				 * loadFinished should the resource have finished. See {@link open()} for it's usage
				 *
				 * @param ename {String} Eventname to listen on via addEventListener
				 * @param stat {String} if that {@link ename} is reached set this as the status of the resource
				 */
				function addListener(ename, stat) {
					req.addEventListener(
						ename,
						function() {
							if (ename === "readystatechange") {
								resource.timing[readyStateMap[req.readyState]] = BOOMR.now();

								// For IE 10 and 11, we need to turn off the MutationObserver before responseXML
								// is first referenced, otherwise responseXML might be malformed due to a browser
								// bug (where extra newlines get added in nodes with UTF-8 content)
								if (impl.ie1011fix && ie10or11 && req.readyState === 4) {
									MutationHandler.pause();

									// this reference to responseXML with MO off is enough to ensure the browser
									// bug is not triggered
									var nop = req.responseXML;

									MutationHandler.resume();
								}

								// Listen here as well, as DOM changes might happen on other listeners
								// of readyState = 4 (complete), and we want to make sure we've
								// started the addEvent() if so.  Only listen if the status is non-zero,
								// meaning the request wasn't aborted.  Aborted requests will fire the
								// next handler.
								if (req.readyState === 4 && req.status !== 0) {
									if (req.status < 200 || req.status >= 400) {
										// put the HTTP error code on the resource if it's not a success
										resource.status = req.status;
									}

									resource.response = {
										text: (req.responseType === "" || req.responseType === "text") ? req.responseText : null,
										xml: (req.responseType === "" || req.responseType === "document") ? req.responseXML : null,
										raw: req.response,
										json: req.responseJSON
									};

									loadFinished();
								}
							}
							else {// load, timeout, error, abort
								resource.status = (stat === undefined ? req.status : stat);
								loadFinished();
							}
						},
						false
					);
				}

				// .open() can be called multiple times (before .send()) - just make
				// sure that we don't track this as a new request, or add additional
				// event listeners
				if (!opened) {
					if (singlePageApp && handler.watch && !alwaysSendXhr) {
						// If this is a SPA and we're already watching for resources due
						// to a route change or other interesting event, add this to the
						// current event.
						handler.add_event_resource(resource);
					}

					if (async) {
						addListener("readystatechange");
					}

					addListener("load");
					addListener("timeout", XHR_STATUS_TIMEOUT);
					addListener("error",   XHR_STATUS_ERROR);
					addListener("abort",   XHR_STATUS_ABORT);
				}

				resource.url = a.href;
				resource.method = method;

				// reset any statuses from previous calls to .open()
				delete resource.status;

				if (!async) {
					resource.synchronous = true;
				}

				// note we've called .open
				opened = true;

				// call the original open method
				try {
					return orig_open.apply(req, arguments);
				}
				catch (e) {
					// if there was an exception during .open(), .send() won't work either,
					// so let's fire loadFinished now
					resource.status = XHR_STATUS_OPEN_EXCEPTION;
					loadFinished();
				}
			};

			/**
			 * @memberof ProxyXHRImplementation
			 * @desc
			 * Mark requestStart timestamp and start the request unless the resource has already been marked as having an error code or a result to itself.
			 * @returns {Object} The data normal XHR.send() would return
			 */
			req.send = function(data) {
				req.resource.requestPayload = data;
				BOOMR.fireEvent("xhr_send", req);
				resource.timing.requestStart = BOOMR.now();

				// call the original send method unless there was an error
				// during .open
				if (typeof resource.status === "undefined" ||
				    resource.status !== XHR_STATUS_OPEN_EXCEPTION) {
					return orig_send.apply(req, arguments);
				}
			};

			req.resource = resource;

			return req;
		};

		BOOMR.proxy_XMLHttpRequest.UNSENT = 0;
		BOOMR.proxy_XMLHttpRequest.OPENED = 1;
		BOOMR.proxy_XMLHttpRequest.HEADERS_RECEIVED = 2;
		BOOMR.proxy_XMLHttpRequest.LOADING = 3;
		BOOMR.proxy_XMLHttpRequest.DONE = 4;
		// set our proxy's prototype to the original XHR prototype, in case anyone
		// is using it to save state
		BOOMR.proxy_XMLHttpRequest.prototype = BOOMR.orig_XMLHttpRequest.prototype;

		BOOMR.window.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
	}

	/**
	 * @function
	 * @desc
	 * Put original XMLHttpRequest Configuration back into place
	 */
	function uninstrumentXHR() {
		if (BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest !== BOOMR.window.XMLHttpRequest) {
			BOOMR.window.XMLHttpRequest = BOOMR.orig_XMLHttpRequest;
		}
	}

	/**
	 * Sends an XHR resource
	 */
	function sendResource(resource) {
		resource.initiator = "xhr";
		BOOMR.responseEnd(resource);
	}

	/**
	 * Container for AutoXHR plugin Closure specific state configuration data
	 * @property {string[]} spaBackendResources - Default resources to count as Back-End during a SPA nav
	 * @property {boolean} ie1011fix - If true, the MutationObserver  will be paused on IE10/11 to avoid delayed processing, see {@link ProxyXHRImplementation#addListener} for more info
	 * @property {FilterObject[]} filters - Array of {@link FilterObject} that is used to apply filters on XHR Requests
	 * @property {boolean} initialized - Set to true after the first run of {@link BOOMR.plugins.AutoXHR#init}
	 */
	impl = {
		spaBackEndResources: SPA_RESOURCES_BACK_END,
		ie1011fix: true,
		excludeFilters: [],
		initialized: false,
		/**
		 * Filter function iterating over all available {@link FilterObject}s if returns true will not instrument an XHR
		 * @param {HTMLAnchorElement} anchor - HTMLAnchorElement node created with the XHRs URL as `href` to evaluate by {@link FilterObject}s and passed to {@link FilterObject#cb} callbacks.
		 *                                     NOTE: The anchor needs to be created from the host document (ie. BOOMR.window.document) to enable us to resolve relative
		 *                                     URLs to a full valid path and BASE HREF mechanics can take effect.
		 * @return {boolean} true if the XHR should not be instrumented false if it should be instrumented
		 */
		excludeFilter: function(anchor) {
			var idx, ret, ctx;

			// If anchor is null we just throw it out period
			if (!anchor || !anchor.href) {
				return false;
			}

			for (idx = 0; idx < impl.excludeFilters.length; idx++) {
				if (typeof impl.excludeFilters[idx].cb === "function") {
					ctx = impl.excludeFilters[idx].ctx;
					if (impl.excludeFilters[idx].name) {
						log("Running filter: " + impl.excludeFilters[idx].name + " on URL: " + anchor.href);
					}

					try {
						ret = impl.excludeFilters[idx].cb.call(ctx, anchor);
						if (ret) {
							BOOMR.debug("Found matching filter at: " + impl.excludeFilters[idx].name + " for URL: " + anchor.href, "AutoXHR");
							return true;
						}
					}
					catch (exception) {
						BOOMR.addError(exception, "BOOMR.plugins.AutoXHR.impl.excludeFilter()");
					}
				}
			}
			return false;
		}
	};

	/**
	 * @module AutoXHR
	 * @desc
	 * How should this work?
	 *
	 * 0. History changed
	 *
	 * - Pass new URL and timestamp of change on to most recent event (which might not have happened yet)
	 *
	 * 0.1. History changes as a result of a pushState or replaceState
	 * - In this case we get the new URL when the developer calls pushState or replaceState
	 * - we do not know if they plan to make an XHR call or use a dynamic script node, or do nothing interesting
	 *  (eg: just make a div visible/invisible)
	 * - we also do not know if they will do this before or after they've called pushState/replaceState
	 * - so our best bet is to check if either an XHR event or an interesting Mutation event happened in the last 50ms,
	 *  and if not, then hold on to this state for 50ms to see if an interesting event will happen.
	 *
	 * 0.2. History changes as a result of the user hitting Back/Forward and we get a window.popstate event
	 * - In this case we get the new URL from location.href when our event listener runs
	 * - we do not know if this event change will result in some interesting network activity or not
	 * - we do not know if the developer's event listener has already run before ours or if it will run in the future
	 *  or even if they do have an event listener
	 * - so our best bet is the same as 0.1 above
	 *
	 *
	 * 1. Click initiated
	 *
	 * - User clicks on something
	 * - We create a resource with the start time and no URL
	 * - We turn on DOM observer, and wait up to 50 milliseconds for something
	 *  - If nothing happens after the timeout, we stop watching and clear the resource without firing the event
	 *  - If a history event happened recently/will happen shortly, use the URL as the resource.url
	 *  - Else if something uninteresting happens, we extend the timeout for 1 second
	 *  - Else if an interesting node is added, we add load and error listeners and turn off the timeout but keep watching
	 *    - If we do not have a resource.url, and if this is a script, then we use the script's URL
	 *    - Once all listeners have fired, we stop watching, fire the event and clear the resource
	 *
	 *
	 * 2. XHR initiated
	 *
	 * - XHR request is sent
	 * - We create a resource with the start time and the request URL
	 * - If a history event happened recently/will happen shortly, use the URL as the resource.url
	 * - We watch for all changes in state (for async requests) and for load (for all requests)
	 * - On load, we turn on DOM observer, and wait up to 50 milliseconds for something
	 *  - If something uninteresting happens, we extend the timeout for 1 second
	 *  - Else if an interesting node is added, we add load and error listeners and turn off the timeout
	 *    - Once all listeners have fired, we stop watching, fire the event and clear the resource
	 *  - If nothing happens after the timeout, we stop watching fire the event and clear the resource
	 *
	 *
	 * 3. What about overlap?
	 *
	 * 3.1. XHR initiated while click watcher is on
	 *
	 * - If first click watcher has not detected anything interesting or does not have a URL, abort it
	 * - If the click watcher has detected something interesting and has a URL, then
	 *  - Proceed with 2 above.
	 *  - concurrently, click stops watching for new resources
	 *   - once all resources click is waiting for have completed, fire the event and clear click resource
	 *
	 * 3.2. click initiated while XHR watcher is on
	 *
	 * - Ignore click
	 *
	 * 3.3. click initiated while click watcher is on
	 *
	 * - If first click watcher has not detected anything interesting or does not have a URL, abort it
	 * - Else proceed with parallel resource steps from 3.1 above
	 *
	 * 3.4. XHR initiated while XHR watcher is on
	 *
	 * - Allow anything interesting detected by first XHR watcher to complete and fire event
	 * - Start watching for second XHR and proceed with 2 above.
	 */
	BOOMR.plugins.AutoXHR = {
		is_complete: function() { return true; },
		init: function(config) {
			var i, idx;

			// if we don't have window, abort
			if (!BOOMR.window || !BOOMR.window.document) {
				return;
			}

			d = BOOMR.window.document;
			a = BOOMR.window.document.createElement("A");

			// gather config and config overrides
			BOOMR.utils.pluginConfig(impl, config, "AutoXHR", ["spaBackEndResources", "ie1011fix"]);

			BOOMR.instrumentXHR = instrumentXHR;
			BOOMR.uninstrumentXHR = uninstrumentXHR;

			// Ensure we're only once adding the shouldExcludeXhr
			if (!impl.initialized) {
				this.addExcludeFilter(shouldExcludeXhr, null, "shouldExcludeXhr");

				impl.initialized = true;
			}

			// Add filters from config
			if (config && config.AutoXHR && config.AutoXHR.excludeFilters && config.AutoXHR.excludeFilters.length > 0) {
				for (idx = 0; idx < config.AutoXHR.excludeFilters.length; idx++) {
					impl.excludeFilters.push(config.AutoXHR.excludeFilters[idx]);
				}
			}

			autoXhrEnabled = config.instrument_xhr;

			// check to see if any of the SPAs were enabled
			if (BOOMR.plugins.SPA && BOOMR.plugins.SPA.supported_frameworks) {
				var supported = BOOMR.plugins.SPA.supported_frameworks();
				for (i = 0; i < supported.length; i++) {
					var spa = supported[i];
					if (config[spa] && config[spa].enabled) {
						singlePageApp = true;
						break;
					}
				}
			}

			// Whether or not to always send XHRs.  If a SPA is enabled, this means it will
			// send XHRs during the hard and soft navs.  If enabled, it will also disable
			// listening for MutationObserver events after an XHR is complete.
			alwaysSendXhr = config.AutoXHR && config.AutoXHR.alwaysSendXhr;
			if (alwaysSendXhr && autoXhrEnabled && BOOMR.xhr && typeof BOOMR.xhr.stop === "function") {
				function sendXhrs(resources) {
					if (resources.length) {
						for (i = 0; i < resources.length; i++) {
							sendResource(resources[i]);
						}
					}
					else {
						// single resource
						sendResource(resources);
					}
				};

				var resources = BOOMR.xhr.stop(sendXhrs);

				if (resources && resources.length) {
					BOOMR.setImmediate(sendXhrs, resources);
				}
			}

			if (singlePageApp) {
				if (!alwaysSendXhr) {
					// Disable auto-xhr until the SPA has fired its first beacon.  The
					// plugin will re-enable after it's ready.
					autoXhrEnabled = false;
				}

				if (autoXhrEnabled) {
					BOOMR.instrumentXHR();
				}
			}
			else if (autoXhrEnabled) {
				BOOMR.instrumentXHR();
			}
			else if (autoXhrEnabled === false) {
				BOOMR.uninstrumentXHR();
			}

			BOOMR.registerEvent("onxhrerror");
		},
		getMutationHandler: function() {
			return handler;
		},
		getPathname: getPathName,
		enableAutoXhr: function() {
			if (!autoXhrEnabled) {
				BOOMR.instrumentXHR();
			}

			autoXhrEnabled = true;
		},
		/**
		 * Add a filter function to the list of functions to run to validate if an XHR should be instrumented
		 * For a description of the params see properties of the {@link AutoXHR#FilterObject} type definition
		 *
		 * @example
		 * BOOMR.plugins.AutoXHR.addExcludeFilter(function(anchor) {
		 *   var m = anchor.href.match(/some-page\.html/g);
		 *
		 *   // If matching flag to not instrument
		 *   if (m && m.length > 0) {
		 *     return true;
		 *   }
		 *   return false;
		 * }, null, "exampleFilter");
		 * @param {function} cb - Callback to run to validate filtering of an XHR Request
		 * @param {Object} ctx - Context to run {@param cb} in
		 * @param {string} [name] - Optional name for the filter, called out when running exclude filters for debugging purposes
		 */
		addExcludeFilter: function(cb, ctx, name) {
			impl.excludeFilters.push({cb: cb, ctx: ctx, name: name});
		}
	};

	/**
	 * @typedef {Object} Resource
	 * @memberof AutoXHR
	 *
	 * @desc
	 * Resource objects define properties of a page element or resource monitored by {@link AutoXHR}.
	 *
	 * @property {string} initiator - Type of source that initiated the resource to be fetched:
	 * 				  `click`, `xhr` or SPA initiated
	 * @property {string} url - Path to the resource fetched from either the HTMLElement or XHR request that triggered it
	 * @property {object} timing - Resource timing information gathered from internal timers or ResourceTiming if supported
	 * @property {Timing} timing - Object containing start and end timings of the resource if set
	 * @property {?onComplete} [onComplete] - called once the resource has been fetched
	 */

	/**
	 * @callback onComplete
	 * @desc
	 * Hook called once a resource is found to be loaded and timers have been set.
	 */

	/**
	 * @typedef PendingEvent
	 * @memberof AutoXHR
	 * @private
	 * @desc
	 * An event on a page instrumented by {@link AutoXHR#MutationHandler} and monitored by AutoXHR
	 *
	 * @property {string} type - The type of event that we are watching (`xhr`, `click`, [SPAs]{@link BOOMR#constants.BEACON_TYPE_SPAS})
	 * @property {number} nodes_to_wait - Number of nodes to wait for before event completes
	 * @property {Resource} resource - The resource this event is attached to
	 * @property {boolean} complete - `true` if event completed `false` if not
	 * @property {?Resource[]} resources - multiple resources that are attached to this event
	 */

	/**
	 * @typedef Timing
	 * @memberof AutoXHR
	 * @private
	 * @desc
	 * Timestamps for start of a request and end of loading
	 *
	 * @property {TimeStamp} loadEventEnd - Timestamp when the resource arrived in the browser
	 * @property {TimeStamp} requestStart - High resolution timestamp when the resource was started to be loaded
	 */

	/**
	 * @typedef FilterObject
	 * @property {function} cb - Callback called with context accepts one param which is: AnchorElement referring
	 *                           to the fully qualified URL of the XHR Request BOOMR is determining to instrument
	 * @property {Object} ctx - Execution context to use when running `cb`
	 * @property {string} [name] - Name of the filter used for logging and debugging purposes (This is an entirely optional property)
	 */
})();
