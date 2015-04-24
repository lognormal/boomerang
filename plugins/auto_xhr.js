(function() {
var d, handler, a,
    readyStateMap = [ "uninitialized", "open", "responseStart", "domInteractive", "responseEnd" ];



// If this browser cannot support XHR, we'll just skip this plugin which will
// save us some execution time.

// XHR not supported or XHR so old that it doesn't support addEventListener
// (IE 6, 7, as well as newer running in quirks mode.)
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
	if(MutationHandler.observer && MutationHandler.observer.observer) {
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

	for(i=index-1; i>=0; i--) {
		if(this.pending_events[i] && !this.pending_events[i].complete) {
			last_ev = this.pending_events[i];
			break;
		}
	}

	if(last_ev) {
		if(last_ev.type === "click") {
			// 3.1 & 3.3
			if(last_ev.nodes_to_wait === 0 || !last_ev.resource.url) {
				this.pending_events[i] = undefined;
				return null;	// abort
			}
			// last_ev will no longer receive watches as ev will receive them
			// last_ev will wait fall interesting nodes and then send event
		}
		else if(last_ev.type === "xhr") {
			// 3.2
			if(ev.type === "click") {
				return null;
			}

			// 3.4
			// nothing to do
		}
	}

	this.watch++;
	this.pending_events.push(ev);

	// If we don't have a MutationObserver, then we just abort
	if (!MutationHandler.observer) {
		// If we already have detailed resource we can forward the event
		if(resource.url && resource.timing.loadEventEnd) {
			this.sendEvent(index);
		}

		return null;
	}
	else {
		this.setTimeout(50, index);

		return index;
	}
};

MutationHandler.prototype.sendEvent = function(i) {
	var ev = this.pending_events[i], self=this;

	ev.complete = true;

	this.watch--;

	this.clearTimeout();
	if(BOOMR.hasVar("h.cr")) {
		ev.resource.resources = ev.resources;

		BOOMR.responseEnd(ev.resource);
		this.pending_events[i] = undefined;
	}
	else {
		// No crumb, so try again after 5 seconds
		setTimeout(function() { self.sendEvent(i); }, 5000);
	}
};

MutationHandler.prototype.setTimeout = function(timeout, index) {
	var self = this;
	if(!timeout) {
		return;
	}

	this.clearTimeout();

	this.timer = setTimeout(function() { self.timedout(index); }, timeout);
};

MutationHandler.prototype.timedout = function(index) {
	this.clearTimeout();

	if(this.pending_events[index] && this.pending_events[index].type === "xhr") {
		this.sendEvent(index);
	}
	else {
		if(this.watch > 0) {
			this.watch--;
		}
		this.pending_events[index] = undefined;
	}
};

MutationHandler.prototype.clearTimeout = function() {
	if(this.timer) {
		clearTimeout(this.timer);
		this.timer = null;
	}
};

MutationHandler.prototype.load_cb = function(ev) {
	var target, index, current_event;

	target = ev.target || ev.srcElement;
	if (!target || !target._bmr) {
		return;
	}

	target._bmr.end = BOOMR.now();
	target._bmr.state = ev.type;

	index = target._bmr.res;
	current_event = this.pending_events[index];

	// event aborted
	if(!current_event) {
		return;
	}

	current_event.nodes_to_wait--;

	if(current_event.nodes_to_wait === 0) {
		current_event.resource.timing.loadEventEnd = BOOMR.now();

		this.sendEvent(index);
	}
};

MutationHandler.prototype.wait_for_node = function(node, index) {
	var self = this, current_event, els, interesting = false, i, l, url;

	// only images, scripts, iframes and links if stylesheet
	if(node.nodeName.match(/^(IMG|SCRIPT|IFRAME)$/) || (node.nodeName === "LINK" && node.rel && node.rel.match(/\<stylesheet\>/i))) {

		node._bmr = { start: BOOMR.now(), res: index };

		url=node.src || node.href;

		if(node.nodeName === "IMG") {
			if(node.naturalWidth) {
				// img already loaded
				return false;
			}
		}

		// no URL or javascript: or about: URL, so no network activity
		if(!url || url.match(/^(about:|javascript:)/i)) {
			return false;
		}

		current_event = this.pending_events[index];

		if(!current_event) {
			return false;
		}

		if(!current_event.resource.url && node.nodeName === "SCRIPT") {
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

		interesting = true;
	}
	else if(node.nodeType === Node.ELEMENT_NODE) {
		els = node.getElementsByTagName("IMG");
		if(els && els.length) {
			for(i=0, l=els.length; i<l; i++) {
				interesting |= this.wait_for_node(els[i], index);
			}
		}
	}

	return interesting;
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

	if(index < 0 || !this.pending_events[index]) {
		// Nothing waiting for mutations
		return true;
	}

	if(mutations && mutations.length) {
		this.pending_events[index].resource.timing.domComplete = BOOMR.now();

		mutations.forEach(function(mutation) {
			var i, l;
			if(mutation.type === "attributes") {
				interesting |= self.wait_for_node(mutation.target, index);
			}
			else if(mutation.type === "childList") {
				l = mutation.addedNodes.length;
				for(i=0; i<l; i++) {
					interesting |= self.wait_for_node(mutation.addedNodes[i], index);
				}
			}
		});
	}

	if(!interesting) {
		this.setTimeout(1000, index);
	}

	return true;
};


handler = new MutationHandler();

function instrumentClick() {
	// Capture clicks and wait 50ms to see if they result in DOM mutations
	BOOMR.subscribe("click", function() {
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
	else if(BOOMR.proxy_XMLHttpRequest && BOOMR.orig_XMLHttpRequest && BOOMR.orig_XMLHttpRequest === BOOMR.window.XMLHttpRequest) {
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

			function addListener(ename, stat) {
				req.addEventListener(
						ename,
						function() {
							if (ename === "readystatechange") {
								resource.timing[readyStateMap[req.readyState]] = BOOMR.now();
							}
							else if (ename === "loadend") {
								handler.addEvent(resource);
							}
							else {	// load, timeout, error, abort
								resource.timing.loadEventEnd = BOOMR.now();
								resource.status = (stat === undefined ? req.status : stat);
							}
						},
						false
				);
			}

			if (async) {
				addListener("readystatechange");
			}

			addListener("load");
			addListener("timeout", -1001);
			addListener("error",    -998);
			addListener("abort",    -999);

			addListener("loadend");

			resource.url = a.href;
			resource.method = method;
			if (!async) {
				resource.synchronous = true;
			}

			// call the original open method
			return orig_open.apply(req, arguments);
		};

		req.send = function() {
			resource.timing.requestStart = BOOMR.now();

			// call the original send method
			return orig_send.apply(req, arguments);
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

		if(config.instrument_xhr) {
			BOOMR.instrumentXHR();
		}
		else if (config.instrument_xhr === false) {
			BOOMR.uninstrumentXHR();
		}
	},
	getPathname: getPathName
};

})();
