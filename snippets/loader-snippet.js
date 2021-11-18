/* eslint-disable no-script-url */
(function(w) {
	// Boomerang Loader Snippet version 14
	if (w.BOOMR && (w.BOOMR.version || w.BOOMR.snippetExecuted)) {
		return;
	}

	function now() {
		return new Date().getTime();
	}

	w.BOOMR = w.BOOMR || {};
	w.BOOMR.snippetStart = now();
	w.BOOMR.snippetExecuted = true;
	w.BOOMR.snippetVersion = 14;

	// NOTE: Set Boomerang URL here
	w.BOOMR.url = "";

	var // document.currentScript is supported in all browsers other than IE
	    where = document.currentScript || document.getElementsByTagName("script")[0],
	    // Parent element of the script we inject
	    parentNode = where.parentNode,
	    // Whether or not Preload method has worked
	    promoted = false,
	    // How long to wait for Preload to work before falling back to iframe method
	    LOADER_TIMEOUT = 3000;

	/* BEGIN_TEST_CODE */
	var prefix, suffix;

	if (w.BOOMR_script_delay) {
		prefix = "/delay?delay=3000&file=build/";
		suffix = "&rnd=" + Math.random();
	}
	else {
		prefix = "../../build/";
		suffix = "";
	}

	if (/\/support\//.test(w.location.pathname)) {
		prefix = prefix.replace("build/", "../build/");
	}

	w.BOOMR.url = prefix + (w.BOOMR_script_minified ? "boomerang-latest-debug.min.js" : "boomerang-latest-debug.js") + suffix;
	/* END_TEST_CODE */
	// Tells the browser to execute the Preloaded script by adding it to the DOM
	function promote() {
		if (promoted) {
			return;
		}

		var script = document.createElement("script");
		script.id = "boomr-scr-as";
		script.src = w.BOOMR.url;

		// Not really needed since dynamic scripts are async by default and the script is already in cache at this point,
		// but some naive parsers will see a missing async attribute and think we're not async
		script.async = true;

		parentNode.appendChild(script);

		promoted = true;
	}

	// Non-blocking iframe loader (fallback for non-Preload scenarios) for all recent browsers.
	// For IE 6/7, falls back to dynamic script node.
	function iframeLoader(wasFallback) {
		promoted = true;

		var dom, doc = document, bootstrap, iframe, iframeStyle, win = w;

		w.BOOMR.snippetMethod = wasFallback ? "if" : "i";

		// Adds Boomerang within the iframe
		bootstrap = function(parent, scriptId) {
			var script = doc.createElement("script");
			script.id = scriptId || "boomr-if-as";
			script.src = w.BOOMR.url;

			BOOMR_lstart = now();

			parent = parent || doc.body;
			parent.appendChild(script);
		};

		// For IE 6/7, we'll just load the script in the current frame, as those browsers don't support 'about:blank'
		// for an iframe src (it triggers warnings on secure sites).  This means loading on IE 6/7 may cause SPoF.
		if (!w.addEventListener && w.attachEvent && navigator.userAgent.match(/MSIE [67]\./)) {
			w.BOOMR.snippetMethod = "s";

			bootstrap(parentNode, "boomr-async");
			return;
		}

		// The rest of this function is IE8+ and other browsers that don't support Preload hints but will work with CSP & iframes
		iframe = document.createElement("IFRAME");

		// An empty frame
		iframe.src = "about:blank";

		// We set title and role appropriately to play nicely with screen readers and other assistive technologies
		iframe.title = "";
		iframe.role = "presentation";

		// Ensure we're not loaded lazily
		iframe.loading = "eager";

		// Hide the iframe
		iframeStyle = (iframe.frameElement || iframe).style;
		iframeStyle.width = 0;
		iframeStyle.height = 0;
		iframeStyle.border = 0;
		iframeStyle.display = "none";

		// Append to the end of the current block
		parentNode.appendChild(iframe);

		// Try to get the iframe's document object
		try {
			win = iframe.contentWindow;
			doc = win.document.open();
		}
		catch (e) {
			// document.domain has been changed and we're on an old version of IE, so we got an access denied.
			// Note: the only browsers that have this problem also do not have CSP support.

			// Get document.domain of the parent window
			dom = document.domain;

			// Set the src of the iframe to a JavaScript URL that will immediately set its document.domain to match the parent.
			// This lets us access the iframe document long enough to inject our script.
			// Our script may need to do more domain massaging later.
			iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void 0;";
			win = iframe.contentWindow;

			doc = win.document.open();
		}

		if (dom) {
			// Unsafe version for IE8 compatibility. If document.domain has changed, we can't use win, but we can use doc.
			doc._boomrl = function() {
				this.domain = dom;
				bootstrap();
			};

			// Run our function at load.
			// Split the string so HTML code injectors don't get confused and add code here.
			doc.write("<bo" + "dy onload='document._boomrl();'>");
		}
		else {
			// document.domain hasn't changed, regular method should be OK
			win._boomrl = function() {
				bootstrap();
			};

			if (win.addEventListener) {
				win.addEventListener("load", win._boomrl, false);
			}
			else if (win.attachEvent) {
				win.attachEvent("onload", win._boomrl);
			}
		}

		// Finish the document
		doc.close();
	}

	// See if Preload is supported or not
	var link = document.createElement("link");

	if (link.relList &&
	    typeof link.relList.supports === "function" &&
	    link.relList.supports("preload") &&
	    ("as" in link)) {
		w.BOOMR.snippetMethod = "p";

		// Set attributes to trigger a Preload
		link.href = w.BOOMR.url;
		link.rel  = "preload";
		link.as   = "script";

		// Add our script tag if successful, fallback to iframe if not
		link.addEventListener("load", promote);
		link.addEventListener("error", function() {
			iframeLoader(true);
		});

		// Have a fallback in case Preload does nothing or is slow
		setTimeout(function() {
			if (!promoted) {
				iframeLoader(true);
			}
		}, LOADER_TIMEOUT);

		// Note the timestamp we started trying to Preload
		BOOMR_lstart = now();

		// Append our link tag
		parentNode.appendChild(link);
	}
	else {
		// No Preload support, use iframe loader
		iframeLoader(false);
	}

	// Save when the onload event happened, in case this is a non-NavigationTiming browser
	function boomerangSaveLoadTime(e) {
		w.BOOMR_onload = (e && e.timeStamp) || now();
	}

	if (w.addEventListener) {
		w.addEventListener("load", boomerangSaveLoadTime, false);
	}
	else if (w.attachEvent) {
		w.attachEvent("onload", boomerangSaveLoadTime);
	}
})(window);
