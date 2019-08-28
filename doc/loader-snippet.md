If you are loading boomerang.js separately from your main application bundle, i.e.
from a CDN or a third-party service (such as mPulse), we recommend loading boomerang.js
using the CSP-compliant non-blocking script loader pattern.

The methodology, [developed by Philip Tellis](http://www.lognormal.com/blog/2012/12/12/the-script-loader-pattern/)
and others, and further [improved in 2018](https://calendar.perfplanet.com/2018/a-csp-compliant-non-blocking-script-loader/),
ensures Boomerang (or any third-party JavaScript) loads asynchronously
and non-blocking.  This means that the browser will not pause while the JavaScript
is loading, nor will it block the `onload` event.

The Boomerang Loader Snippet is currently around 210 lines of code (with comments), and minifies to around 2500 bytes.

The snippet does the following:

1. It checks whether or not the snippet has already been run or Boomerang has already
    been loaded.  If so, it exits.
2. It adds a `window` `load` event handler, to ensure that Boomerang can measure
    the Page Load time in non-NavigationTiming browsers, even if boomerang.js
    loads after the `load` event.
3. For browsers that [support Preload](https://caniuse.com/#feat=link-rel-preload) `<link rel="preload" as="script">`,
    Boomerang will add a `<link>` node to tell the browser to fetch Boomerang.js.
    * Once the Preload has finished, Boomerang adds a regular `<script>` node to the page with the same Boomerang URL,
      which tells the browser to execute Boomerang.
4. For browsers that do not support Preload, or if Preload fails or doesn't trigger within the defined timeframe (default 3 seconds),
    the non-blocking IFRAME loader method is used.
    * A hidden `<iframe>` is injected into the page.
    * The snippet attempts to read the IFRAME's `contentWindow.document`.  If it can't,
      it updates the IFRAME's `src` to add JavaScript that sets the IFRAME's `document.domain`
      to the current page's `document.domain`.  This ensures the anonymous IFRAME
      can communicate with the host page.
    * It writes a function `_l()` to the IFRAME's `document` which will add a
      `<script>` tag that loads boomerang.js.
    * It sets the IFRAME's `<body onload="document._l()">` to run the function
      above, so the `<script>` tag is loaded after the IFRAME's `onload` event has fired.
5. For IE 6 and IE 7, which don't support the non-blocking IFRAME loader method (due to problems they have with `about:blank`
    URLs in secure contexts), a dynamic `<script>` node is added to the page.
    * Note this means that in IE 6 and 7, Boomerang could be a SPOF (Single Point of Failure) if the script is delayed,
      potentially delaying the Page Load.

Note: We split the `<body` tag insertion into `<bo` and `dy` to avoid server-side output filters that may replace `<body` tags with their own code.

For proof that the non-blocking script loader pattern does not affect page load,
you can look at this
[test case](http://dev.nicj.net/boomerang-audit/test-mpulse-loader-snippet-delayed.html)
that delays JavaScript from loading by 5 seconds or these
[WebPagetest results](https://www.webpagetest.org/result/171221_HD_bb090190517fa8dd101859e8c1f327fe/).

## The Snippet

Here's the snippet:

```html
<script>
(function() {
    // Boomerang Loader Snippet version 12
    if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
        return;
    }

    window.BOOMR = window.BOOMR || {};
    window.BOOMR.snippetStart = new Date().getTime();
    window.BOOMR.snippetExecuted = true;
    window.BOOMR.snippetVersion = 12;

    // NOTE: Set Boomerang URL here
    window.BOOMR.url = "";

    var // document.currentScript is supported in all browsers other than IE
        where = document.currentScript || document.getElementsByTagName("script")[0],
        // Whether or not Preload method has worked
        promoted = false,
        // How long to wait for Preload to work before falling back to iframe method
        LOADER_TIMEOUT = 3000;

    // Tells the browser to execute the Preloaded script by adding it to the DOM
    function promote() {
        if (promoted) {
            return;
        }

        var script = document.createElement("script");
        script.id = "boomr-scr-as";
        script.src = window.BOOMR.url;

        // Not really needed since dynamic scripts are async by default and the script is already in cache at this point,
        // but some naive parsers will see a missing async attribute and think we're not async
        script.async = true;

        where.parentNode.appendChild(script);

        promoted = true;
    }

    // Non-blocking iframe loader (fallback for non-Preload scenarios) for all recent browsers.
    // For IE 6/7, falls back to dynamic script node.
    function iframeLoader(wasFallback) {
        promoted = true;

        var dom, doc = document, bootstrap, iframe, iframeStyle, win = window;

        window.BOOMR.snippetMethod = wasFallback ? "if" : "i";

        // Adds Boomerang within the iframe
        bootstrap = function(parent, scriptId) {
            var script = doc.createElement("script");
            script.id = scriptId || "boomr-if-as";
            script.src = window.BOOMR.url;

            BOOMR_lstart = new Date().getTime();

            parent = parent || doc.body;
            parent.appendChild(script);
        };

        // For IE 6/7, we'll just load the script in the current frame, as those browsers don't support 'about:blank'
        // for an iframe src (it triggers warnings on secure sites).  This means loading on IE 6/7 may cause SPoF.
        if (!window.addEventListener && window.attachEvent && navigator.userAgent.match(/MSIE [67]\./)) {
            window.BOOMR.snippetMethod = "s";

            bootstrap(where.parentNode, "boomr-async");
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
        where.parentNode.appendChild(iframe);

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
            iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void(0);";
            win = iframe.contentWindow;

            doc = win.document.open();
        }

        if (dom) {
            // Unsafe version for IE8 compatability. If document.domain has changed, we can't use win, but we can use doc.
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
        window.BOOMR.snippetMethod = "p";

        // Set attributes to trigger a Preload
        link.href = window.BOOMR.url;
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
        BOOMR_lstart = new Date().getTime();

        // Append our link tag
        where.parentNode.appendChild(link);
    }
    else {
        // No Preload support, use iframe loader
        iframeLoader(false);
    }

    // Save when the onload event happened, in case this is a non-NavigationTiming browser
    function boomerangSaveLoadTime(e) {
        window.BOOMR_onload = (e && e.timeStamp) || new Date().getTime();
    }

    if (window.addEventListener) {
        window.addEventListener("load", boomerangSaveLoadTime, false);
    }
    else if (window.attachEvent) {
        window.attachEvent("onload", boomerangSaveLoadTime);
    }
})();
</script>
```

## Delaying the Snippet

You may want to delay loading Boomerang until after the `onload` event.  This would
ensure that no Boomerang code is executed in the critical-path of the page load.

The main downside to doing this is that you are more likely to lose beacons
from some users.  The longer it takes Boomerang to load on the page, the higher
chance that the user will have navigated away, or closed the browser, before
boomerang.js is loaded.

Here is a modification of the Boomerang Loader Snippet to delay until after
`onload`:

```html
<script>
(function() {
    // Boomerang Loader Snippet version 12
    if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
        return;
    }

    window.BOOMR = window.BOOMR || {};
    window.BOOMR.snippetStart = new Date().getTime();
    window.BOOMR.snippetExecuted = true;
    window.BOOMR.snippetVersion = 12;

    // NOTE: Set Boomerang URL here
    window.BOOMR.url = "";

    var // document.currentScript is supported in all browsers other than IE
        where = document.currentScript || document.getElementsByTagName("script")[0],
        // Whether or not Preload method has worked
        promoted = false,
        // How long to wait for Preload to work before falling back to iframe method
        LOADER_TIMEOUT = 3000;

    // Tells the browser to execute the Preloaded script by adding it to the DOM
    function promote() {
        if (promoted) {
            return;
        }

        var script = document.createElement("script");
        script.id = "boomr-scr-as";
        script.src = window.BOOMR.url;

        // Not really needed since dynamic scripts are async by default and the script is already in cache at this point,
        // but some naive parsers will see a missing async attribute and think we're not async
        script.async = true;

        where.parentNode.appendChild(script);

        promoted = true;
    }

    // Non-blocking iframe loader (fallback for non-Preload scenarios) for all recent browsers.
    // For IE 6/7, falls back to dynamic script node.
    function iframeLoader(wasFallback) {
        promoted = true;

        var dom, doc = document, bootstrap, iframe, iframeStyle, win = window;

        window.BOOMR.snippetMethod = wasFallback ? "if" : "i";

        // Adds Boomerang within the iframe
        bootstrap = function(parent, scriptId) {
            var script = doc.createElement("script");
            script.id = scriptId || "boomr-if-as";
            script.src = window.BOOMR.url;

            BOOMR_lstart = new Date().getTime();

            parent = parent || doc.body;
            parent.appendChild(script);
        };

        // For IE 6/7, we'll just load the script in the current frame, as those browsers don't support 'about:blank'
        // for an iframe src (it triggers warnings on secure sites).  This means loading on IE 6/7 may cause SPoF.
        if (!window.addEventListener && window.attachEvent && navigator.userAgent.match(/MSIE [67]\./)) {
            window.BOOMR.snippetMethod = "s";

            bootstrap(where.parentNode, "boomr-async");
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
        where.parentNode.appendChild(iframe);

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
            iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void(0);";
            win = iframe.contentWindow;

            doc = win.document.open();
        }

        if (dom) {
            // Unsafe version for IE8 compatability. If document.domain has changed, we can't use win, but we can use doc.
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

    function boomerangLoad() {
        // See if Preload is supported or not
        var link = document.createElement("link");

        if (link.relList &&
            typeof link.relList.supports === "function" &&
            link.relList.supports("preload") &&
            ("as" in link)) {
            window.BOOMR.snippetMethod = "p";

            // Set attributes to trigger a Preload
            link.href = window.BOOMR.url;
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
            BOOMR_lstart = new Date().getTime();

            // Append our link tag
            where.parentNode.appendChild(link);
        }
        else {
            // No Preload support, use iframe loader
            iframeLoader(false);
        }
    }

    // Save when the onload event happened, in case this is a non-NavigationTiming browser
    function boomerangSaveLoadTime(e) {
        window.BOOMR_onload = (e && e.timeStamp) || new Date().getTime();
    }

    if (window.addEventListener) {
        window.addEventListener("load", boomerangSaveLoadTime, false);
    }
    else if (window.attachEvent) {
        window.attachEvent("onload", boomerangSaveLoadTime);
    }

    // Run at onload
    function windowOnLoad(e) {
        boomerangSaveLoadTime(e);
        setTimeout(boomerangLoad, 0);
    }

    // If we think the load event has already fired, load Boomerang now
    if (("performance" in win && win.performance && win.performance.timing && win.performance.timing.loadEventStart)
        || (document.readyState === "complete")) {
        boomerangLoad();
    }
    else {
        // Wait until onload
        if (win.addEventListener) {
            win.addEventListener("load", windowOnLoad, false);
        }
        else if (win.attachEvent) {
            win.attachEvent("onload", windowOnLoad);
        }
    }
})();
</script>
```
