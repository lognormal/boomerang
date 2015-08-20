(function() {
	var d, handler, a,
	    singlePageApp = false,
	    autoXhrEnabled = false,
	    readyStateMap = [ "uninitialized", "open", "responseStart", "domInteractive", "responseEnd" ];

	// Default SPA activity timeout, in milliseconds
	var SPA_TIMEOUT = 1000;

	// Custom XHR status codes
	var XHR_STATUS_TIMEOUT        = -1001;
	var XHR_STATUS_ABORT          = -999;
	var XHR_STATUS_ERROR          = -998;
	var XHR_STATUS_OPEN_EXCEPTION = -997;

	// If this browser cannot support XHR, we'll just skip this plugin which will
	// save us some execution time.

	// XHR not supported or XHR so old that it doesn't support addEventListener
	// (IE 6, 7, 8, as well as newer running in quirks mode.)
	if (!window.XMLHttpRequest || !(new XMLHttpRequest()).addEventListener) {
		// Nothing to instrument
		return;
	}

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.AutoXHR) {
		return;
	}

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

	function shouldExcludeXhr(anchor) {
		return BOOMR.xhr_excludes.hasOwnProperty(anchor.href) ||
			BOOMR.xhr_excludes.hasOwnProperty(anchor.hostname) ||
			BOOMR.xhr_excludes.hasOwnProperty(getPathName(anchor));
	}

	/*
	How should this work?

	0. History changed

	- Pass new URL and timestamp of change on to most recent event (which might not have happened yet)

	0.1. History changes as a result of a pushState or replaceState
	- In this case we get the new URL when the developer calls pushState or replaceState
	- we do not know if they plan to make an XHR call or use a dynamic script node, or do nothing interesting
	  (eg: just make a div visible/invisible)
	- we also do not know if they will do this before or after they've called pushState/replaceState
	- so our best bet is to check if either an XHR event or an interesting Mutation event happened in the last 50ms,
	  and if not, then hold on to this state for 50ms to see if an interesting event will happen.

	0.2. History changes as a result of the user hitting Back/Forward and we get a window.popstate event
	- In this case we get the new URL from location.href when our event listener runs
	- we do not know if this event change will result in some interesting network activity or not
	- we do not know if the developer's event listener has already run before ours or if it will run in the future
	  or even if they do have an event listener
	- so our best bet is the same as 0.1 above


	1. Click initiated

	- User clicks on something
	- We create a resource with the start time and no URL
	- We turn on DOM observer, and wait up to 50 milliseconds for something
	  - If nothing happens after the timeout, we stop watching and clear the resource without firing the event
	  - If a history event happened recently/will happen shortly, use the URL as the resource.url
	  - Else if something uninteresting happens, we extend the timeout for 1 second
	  - Else if an interesting node is added, we add load and error listeners and turn off the timeout but keep watching
	    - If we do not have a resource.url, and if this is a script, then we use the script's URL
	    - Once all listeners have fired, we stop watching, fire the event and clear the resource


	2. XHR initiated

	- XHR request is sent
	- We create a resource with the start time and the request URL
	- If a history event happened recently/will happen shortly, use the URL as the resource.url
	- We watch for all changes in state (for async requests) and for load (for all requests)
	- On load, we turn on DOM observer, and wait up to 50 milliseconds for something
	  - If something uninteresting happens, we extend the timeout for 1 second
	  - Else if an interesting node is added, we add load and error listeners and turn off the timeout
	    - Once all listeners have fired, we stop watching, fire the event and clear the resource
	  - If nothing happens after the timeout, we stop watching fire the event and clear the resource


	3. What about overlap?

	3.1. XHR initiated while click watcher is on

	- If first click watcher has not detected anything interesting or does not have a URL, abort it
	- If the click watcher has detected something interesting and has a URL, then
	  - Proceed with 2 above.
	  - concurrently, click stops watching for new resources
	    - once all resources click is waiting for have completed, fire the event and clear click resource

	3.2. click initiated while XHR watcher is on

	- Ignore click

	3.3. click initiated while click watcher is on

	- If first click watcher has not detected anything interesting or does not have a URL, abort it
	- Else proceed with parallel resource steps from 3.1 above

	3.4. XHR initiated while XHR watcher is on

	- Allow anything interesting detected by first XHR watcher to complete and fire event
	- Start watching for second XHR and proceed with 2 above.

	*/


	function MutationHandler() {
		this.watch = 0;
		this.timer = null;

		this.pending_events = [];
	}

	MutationHandler.stop = function() {
		if (MutationHandler.observer && MutationHandler.observer.observer) {
			MutationHandler.observer.observer.disconnect();
			MutationHandler.observer = null;
		}
	};

	MutationHandler.start = function() {
		// Add a perpetual observer
		MutationHandler.observer = BOOMR.utils.addObserver(
			d,
			{
				childList: true,
				attributes: true,
				subtree: true,
				attributeFilter: ["src", "href"]
			},
			null,			// no timeout
			handler.mutation_cb,	// will always return true
			null,			// no callback data
			handler
		);

		BOOMR.subscribe("page_unload", MutationHandler.stop, null, MutationHandler);
	};

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

		for (i=index-1; i>=0; i--) {
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
					return null;	// abort
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
			else if (last_ev.type === "spa") {
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
			// If we already have detailed resource we can forward the event
			if (resource.url && resource.timing.loadEventEnd) {
				this.sendEvent(index);
			}

			return null;
		}
		else {
			if (ev.type !== "spa") {
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

	MutationHandler.prototype.sendEvent = function(i) {
		var ev = this.pending_events[i], self=this;

		if (!ev || ev.complete) {
			return;
		}

		ev.complete = true;

		this.watch--;

		this.clearTimeout();
		if (BOOMR.hasVar("h.cr")) {
			ev.resource.resources = ev.resources;

			// Add ResourceTiming data to the beacon, starting at when 'requestStart'
			// was for this resource.
			if (BOOMR.plugins.ResourceTiming &&
				BOOMR.plugins.ResourceTiming.is_supported() &&
				ev.resource.timing &&
				ev.resource.timing.requestStart) {
				var r = BOOMR.plugins.ResourceTiming.getResourceTiming(ev.resource.timing.requestStart);
				BOOMR.addVar("restiming", JSON.stringify(r));
			}

			// If the resource has an onComplete event, trigger it.
			if (ev.resource.onComplete) {
				ev.resource.onComplete();
			}

			// Use 'requestStart' as the startTime of the resource, if given
			var startTime = ev.resource.timing ? ev.resource.timing.requestStart : undefined;

			BOOMR.responseEnd(ev.resource, startTime, ev.resource);

			this.pending_events[i] = undefined;
		}
		else {
			// No crumb, so try again after 5 seconds
			setTimeout(function() { self.sendEvent(i); }, 5000);
		}
	};

	MutationHandler.prototype.setTimeout = function(timeout, index) {
		var self = this;
		if (!timeout) {
			return;
		}

		this.clearTimeout();

		this.timer = setTimeout(function() { self.timedout(index); }, timeout);
	};

	MutationHandler.prototype.timedout = function(index) {
		this.clearTimeout();

		if (this.pending_events[index] &&
			(this.pending_events[index].type === "xhr" || this.pending_events[index].type === "spa")) {
			// XHRs or SPA page loads
			if (this.pending_events[index].type === "xhr") {
				// always send XHRs on timeout
				this.sendEvent(index);
			}
			else if (this.pending_events[index].type === "spa" && this.pending_events[index].nodes_to_wait === 0) {
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

	MutationHandler.prototype.clearTimeout = function() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	};

	MutationHandler.prototype.load_cb = function(ev) {
		var target, index;

		target = ev.target || ev.srcElement;
		if (!target || !target._bmr) {
			return;
		}

		if (target._bmr.end) {
			// If we've already set the end value, don't call load_finished
			// again.  This might occur on IMGs that are 404s, which fire
			// 'error' then 'load' events
			return;
		}

		target._bmr.end = BOOMR.now();
		target._bmr.state = ev.type;

		index = target._bmr.res;
		this.load_finished(index);
	};

	MutationHandler.prototype.load_finished = function(index) {
		var current_event = this.pending_events[index];

		// event aborted
		if (!current_event) {
			return;
		}

		current_event.nodes_to_wait--;

		if (current_event.nodes_to_wait === 0) {
			// For Single Page Apps, when we're finished waiting on the last node,
			// the MVC engine (eg AngularJS) might still be doing some processing (eg
			// on an XHR) before it adds some additional content (eg IMGs) to the page.
			// We should wait a while (1 second) longer to see if this happens.  If
			// something else is added, we'll continue to wait for that content to
			// complete.  If nothing else is added, the end event will be the
			// timestamp for when this load_finished(), not 1 second from now.

			current_event.resource.timing.loadEventEnd = BOOMR.now();
			if (current_event.type === "spa") {
				this.setTimeout(SPA_TIMEOUT, index);
			}
			else {
				this.sendEvent(index);
			}
		}
	};

	MutationHandler.prototype.wait_for_node = function(node, index) {
		var self = this, current_event, els, interesting = false, i, l, url, exisitingNodeSrcUrlChanged = false;

		// only images, scripts, iframes and links if stylesheet
		if (node.nodeName.match(/^(IMG|SCRIPT|IFRAME)$/) || (node.nodeName === "LINK" && node.rel && node.rel.match(/\<stylesheet\>/i))) {

			// if the attribute change affected the src/currentSrc attributes we want to know that
			// as that means we need to fetch a new Resource from the server
			if (node._bmr && node._bmr.end) {
				exisitingNodeSrcUrlChanged = true;
			}

			node._bmr = { start: BOOMR.now(), res: index };

			url=node.src || node.href;

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

			// no URL or javascript: or about: URL, so no network activity
			if (!url || url.match(/^(about:|javascript:)/i)) {
				return false;
			}

			current_event = this.pending_events[index];

			if (!current_event) {
				return false;
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

				// Check ResourceTiming to see if this was already seen.  If so,
				// we won't see a 'load' or 'error' event fire, so skip this.
				if (BOOMR.window.performance && typeof BOOMR.window.performance.getEntriesByType === "function") {
					entries = BOOMR.window.performance.getEntriesByName(a.href);
					if (entries && entries.length > 0) {
						console.error("Skipping " + a.href);
						return false;
					}
				}
				*/
			}

			if (!current_event.resource.url && (node.nodeName === "SCRIPT" || node.nodeName === "IMG")) {
				a.href = url;

				if (shouldExcludeXhr(a)) {
					// excluded resource, so abort
					return false;
				}
				current_event.resource.url = a.href;
			}

			node.addEventListener("load", function(ev) { self.load_cb(ev); });
			node.addEventListener("error", function(ev) { self.load_cb(ev); });

			current_event.nodes_to_wait++;
			current_event.resources.push(node);

			// Note that we're tracking this URL
			current_event.urls[url] = 1;

			interesting = true;
		}
		else if (node.nodeType === Node.ELEMENT_NODE) {
			els = node.getElementsByTagName("IMG");
			if (els && els.length) {
				for (i=0, l=els.length; i<l; i++) {
					interesting |= this.wait_for_node(els[i], index);
				}
			}
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

	MutationHandler.prototype.mutation_cb = function(mutations) {
		var self, interesting, index;

		if (!this.watch) {
			return true;
		}

		this.clearTimeout();

		self = this;
		interesting = false;
		index = this.pending_events.length-1;

		if (index < 0 || !this.pending_events[index]) {
			// Nothing waiting for mutations
			return true;
		}

		if (mutations && mutations.length) {
			this.pending_events[index].resource.timing.domComplete = BOOMR.now();

			mutations.forEach(function(mutation) {
				var i, l;
				if (mutation.type === "attributes") {
					interesting |= self.wait_for_node(mutation.target, index);
				}
				else if (mutation.type === "childList") {
					l = mutation.addedNodes.length;
					for (i=0; i<l; i++) {
						interesting |= self.wait_for_node(mutation.addedNodes[i], index);
					}
				}
			});
		}

		if (!interesting) {
			this.setTimeout(SPA_TIMEOUT, index);
		}

		return true;
	};

	/**
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

	function instrumentXHR() {
		if (BOOMR.proxy_XMLHttpRequest && BOOMR.proxy_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
			// already instrumented
			return;
		}
		else if (BOOMR.proxy_XMLHttpRequest && BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
			// was once instrumented and then uninstrumented, so just reapply the old instrumented object

			BOOMR.window.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
			MutationHandler.start();

			return;
		}

		BOOMR.orig_XMLHttpRequest = BOOMR.window.XMLHttpRequest;

		MutationHandler.start();

		instrumentClick();

		// We could also inherit from window.XMLHttpRequest, but for this implementation,
		// we'll use composition
		BOOMR.proxy_XMLHttpRequest = function() {
			var req, resource = { timing: {}, initiator: "xhr" }, orig_open, orig_send;

			req = new BOOMR.orig_XMLHttpRequest();

			orig_open = req.open;
			orig_send = req.send;

			req.open = function(method, url, async) {
				a.href = url;

				if (shouldExcludeXhr(a)) {
					// skip instrumentation and call the original open method
					return orig_open.apply(req, arguments);
				}

				// Default value of async is true
				if (async === undefined) {
					async = true;
				}

				function loadFinished() {
					// if we already finished via readystatechange or an error event,
					// don't do work again
					if (resource.timing.loadEventEnd) {
						return;
					}

					resource.timing.loadEventEnd = BOOMR.now();

					if (resource.index > -1) {
						// If this XHR was added to an existing event, fire the
						// load_finished handler for that event.
						handler.load_finished(resource.index);
					}
					else if (!singlePageApp || autoXhrEnabled) {
						// Otherwise, if this is a SPA+AutoXHR or just plain
						// AutoXHR, use addEvent() to see if this will trigger
						// a new interesting event.
						handler.addEvent(resource);
					}
				}

				function addListener(ename, stat) {
					req.addEventListener(
							ename,
							function() {
								if (ename === "readystatechange") {
									resource.timing[readyStateMap[req.readyState]] = BOOMR.now();

									// listen here as well, as DOM changes might happen on other listeners
									// of readyState = 4 (complete), and we want to make sure we've
									// started the addEvent() if so.
									if (req.readyState === 4) {
										loadFinished();
									}
								}
								else {	// load, timeout, error, abort
									resource.status = (stat === undefined ? req.status : stat);

									loadFinished();
								}
							},
							false
					);
				}

				if (singlePageApp && handler.watch) {
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

				resource.url = a.href;
				resource.method = method;

				// reset any statuses from previous calls to .open()
				delete resource.status;

				if (!async) {
					resource.synchronous = true;
				}

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

			req.send = function() {
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

		BOOMR.window.XMLHttpRequest = BOOMR.proxy_XMLHttpRequest;
	}

	function uninstrumentXHR() {
		if (BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest !== BOOMR.window.XMLHttpRequest) {
			BOOMR.window.XMLHttpRequest = BOOMR.orig_XMLHttpRequest;
		}
	}

	BOOMR.plugins.AutoXHR = {
		is_complete: function() { return true; },
		init: function(config) {
			d = BOOMR.window.document;
			a = BOOMR.window.document.createElement("A");

			BOOMR.instrumentXHR = instrumentXHR;
			BOOMR.uninstrumentXHR = uninstrumentXHR;

			autoXhrEnabled = config.instrument_xhr;

			// check to see if any of the SPAs were enabled
			if (BOOMR.plugins.SPA && BOOMR.plugins.SPA.supported_frameworks) {
				var supported = BOOMR.plugins.SPA.supported_frameworks();
				for (var i = 0; i < supported.length; i++) {
					var spa = supported[i];
					if (config[spa] && config[spa].enabled) {
						singlePageApp = true;
						break;
					}
				}
			}

			if (singlePageApp) {
				// Disable auto-xhr until the SPA has fired its first beacon.  The
				// plugin will re-enable after it's ready.
				autoXhrEnabled = false;

				BOOMR.instrumentXHR();
			}
			else if (autoXhrEnabled) {
				BOOMR.instrumentXHR();
			}
			else if (autoXhrEnabled === false) {
				BOOMR.uninstrumentXHR();
			}
		},
		getMutationHandler: function() {
			return handler;
		},
		getPathname: getPathName,
		enableAutoXhr: function() {
			autoXhrEnabled = true;
		}
	};

})();
