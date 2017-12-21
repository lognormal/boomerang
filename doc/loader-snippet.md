If you are loading boomerang.js separately from your main application bundle, i.e.
from a CDN or a third-party service (such as mPulse), we recommend loading boomerang.js
using the non-blocking script loader pattern.

The methodology, [developed by Philip Tellis](http://www.lognormal.com/blog/2012/12/12/the-script-loader-pattern/)
and others, ensures Boomerang (or any third-party JavaScript) loads asynchronously
and non-blocking.  This means that the browser will not pause while the JavaScript
is loading, nor will it block the `onload` event.

The Boomerang Loader Snippet is currently around 50 lines of code.  The snippet
does the following:

1. It checks whether or not the snippet has already been run or Boomerang has already
    been loaded.  If so, it exits.
2. It adds a `window` `load` event handler, to ensure that Boomerang can measure
    the Page Load time in non-NavigationTiming browsers, even if boomerang.js
    loads after the `load` event.
3. Next, a hidden `<iframe>` is injected into the page
4. The snippet attempts to read the IFRAME's `contentWindow.document`.  If it can't,
    it updates the IFRAME's `src` to add JavaScript that sets the IFRAME's `document.domain`
    to the current page's `document.domain`.  This ensures the anonymous IFRAME
    can communicate with the host page.
5. It writes a function `_l()` to the IFRAME's `document` which will add a
    `<script>` tag that loads boomerang.js
6. It sets the IFRAME's `<body onload="document._l()">` to run the function
    above, so the `<script>` tag is loaded after the IFRAME's `onload` event has fired.

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
(function(){
  // Boomerang Loader Snippet version 10
  if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
    return;
  }

  window.BOOMR = window.BOOMR || {};
  window.BOOMR.snippetExecuted = true;

  var dom, doc, where, iframe = document.createElement("iframe"), win = window;

  function boomerangSaveLoadTime(e) {
    win.BOOMR_onload = (e && e.timeStamp) || new Date().getTime();
  }

  if (win.addEventListener) {
    win.addEventListener("load", boomerangSaveLoadTime, false);
  } else if (win.attachEvent) {
    win.attachEvent("onload", boomerangSaveLoadTime);
  }

  iframe.src = "javascript:void(0)";
  iframe.title = "";
  iframe.role = "presentation";
  (iframe.frameElement || iframe).style.cssText = "width:0;height:0;border:0;display:none;";
  where = document.getElementsByTagName("script")[0];
  where.parentNode.insertBefore(iframe, where);

  try {
    doc = iframe.contentWindow.document;
  } catch (e) {
    dom = document.domain;
    iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void(0);";
    doc = iframe.contentWindow.document;
  }

  doc.open()._l = function() {
    var js = this.createElement("script");
    if (dom) {
      this.domain = dom;
    }
    js.id = "boomr-if-as";
    js.src = "http://your-cdn.host.com/path/to/boomerang-<version>.js";
    BOOMR_lstart = new Date().getTime();
    this.body.appendChild(js);
  };
  doc.write('<bo' + 'dy onload="document._l();">');
  doc.close();
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
(function(){
  // Boomerang Delayed Loader Snippet version 10
  if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
    return;
  }

  window.BOOMR = window.BOOMR || {};
  window.BOOMR.snippetExecuted = true;

  var win = window;

  function boomerangSaveLoadTime(e) {
    win.BOOMR_onload = (e && e.timeStamp) || new Date().getTime();
  }

  function boomerangLoad() {
    var dom, doc, where, iframe = document.createElement("iframe"), win = window;
    iframe.src = "javascript:void(0)";
    iframe.title = "";
    iframe.role = "presentation";
    (iframe.frameElement || iframe).style.cssText = "width:0;height:0;border:0;display:none;";
    where = document.getElementsByTagName("script")[0];
    where.parentNode.insertBefore(iframe, where);

    try {
      doc = iframe.contentWindow.document;
    } catch(e) {
      dom = document.domain;
      iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void(0);";
      doc = iframe.contentWindow.document;
    }

    doc.open()._l = function() {
      var js = this.createElement("script");
      if (dom) {
        this.domain = dom;
      }
      js.id = "boomr-if-as";
      js.src = "http://your-cdn.host.com/path/to/boomerang-<version>.js";
      BOOMR_lstart = new Date().getTime();
      this.body.appendChild(js);
    };
    doc.write('<bo' + 'dy onload="document._l();">');
    doc.close();
  }

  function windowOnLoad(e) {
    boomerangSaveLoadTime(e);
    setTimeout(boomerangLoad, 0);
  }

  if (("performance" in win && win.performance && win.performance.timing && win.performance.timing.loadEventStart)
      || (document.readyState === "complete")) {
    boomerangLoad();
  } else {
    if (win.addEventListener) {
      win.addEventListener("load", windowOnLoad, false);
    } else if (win.attachEvent) {
      win.attachEvent("onload", windowOnLoad);
    }
  }
})();
</script>
```
