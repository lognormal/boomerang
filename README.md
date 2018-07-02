* _Copyright (c) 2011, Yahoo! Inc.  All rights reserved._
* _Copyright (c) 2011-2012, Log-Normal Inc.  All rights reserved._
* _Copyright (c) 2012-2017 SOASTA, Inc. All rights reserved._
* _Copyright (c) 2017, Akamai Technologies, Inc. All rights reserved._
* _Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms._

**boomerang always comes back, except when it hits something.**

# Summary

[![Join the chat at https://gitter.im/SOASTA/boomerang](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/SOASTA/boomerang)

boomerang is a JavaScript library that measures the page load time experienced by
real users, commonly called RUM (Real User Measurement).  It has the ability to
send this data back to your server for further analysis.  With boomerang, you
find out exactly how fast your users think your site is.

Apart from page load time, boomerang measures performance timings, metrics and
characteristics of your user's web browsing experience.  All you have to do is
include it in your web pages and call the `BOOMR.init()` method.  Once the
performance data is captured, it will be beaconed to your chosen URL.

boomerang is designed to be a performant and flexible library that can be adapted
to your site's needs.  It has an extensive plugin architecture, and works with
both traditional and modern websites (including Single Page Apps).

boomerang's goal is to not affect the load time of the page (avoiding the
[Observer Effect](https://en.wikipedia.org/wiki/Observer_effect_(information_technology)).
It can be loaded in an asynchronous way that will not delay the page load even
if `boomerang.js` is unavailable.

# Features

* Supports:
     * IE 6+, Edge, all major versions of Firefox, Chrome, Opera, and Safari
     * Desktop and mobile devices
* Captures (all optional):
    * Page characteristics such as the URL and Referrer
    * Overall page load times (via [NavigationTiming](https://www.w3.org/TR/navigation-timing/) if available)
    * DNS, TCP, Request and Response timings (via [NavigationTiming](https://www.w3.org/TR/navigation-timing/))
    * Browser characteristics such as screen size, orientation, memory usage, visibility state
    * DOM characteristics such as the number of nodes, HTML length, number of images, scripts, etc
    * [ResourceTiming](https://www.w3.org/TR/resource-timing-1/) data (to reconstruct the page's Waterfall)
    * Bandwidth
    * Mobile connection data
    * DNS latency
    * JavaScript Errors
    * XMLHttpRequest instrumentation
    * Third-Party analytics providers IDs
    * Single Page App interactions

# Usage

boomerang can be included on your page in one of two ways: [synchronously](#synchronously) or [asynchronously](#asynchronously).

The asynchronous method is recommended.

<a name="synchronously"></a>
## The simple synchronous way

```html
<script src="boomerang.js"></script>
<script src="plugins/rt.js"></script>
<!-- any other plugins you want to include -->
<script>
  BOOMR.init({
    beacon_url: "http://yoursite.com/beacon/"
  });
</script>
```

**Note:** You must include at least one plugin (it doesn't have to be `RT`) or
else the beacon will never fire.

Each plugin has its own configuration as well -- these configuration options
should be included in the `BOOMR.init()` call:

```html
BOOMR.init({
  beacon_url: "http://yoursite.com/beacon/",
  ResourceTiming: {
    enabled: true,
    clearOnBeacon: true
  }
});
```

<a name="asynchronously"></a>
## The faster, more involved, asynchronous way

Loading boomerang asynchronously ensures that even if `boomerang.js` is
unavailable (or loads slowly), your host page will not be affected.

### 1. Add a plugin to init your code

Create a plugin (or use the sample `zzz-last-plugin.js`) with a call
to `BOOMR.init`:

```javascript
BOOMR.init({
  config: parameters,
  ...
});
BOOMR.t_end = new Date().getTime();
```

You could also include any other code you need.  For example, you could include
a timer to measure when boomerang has finished loading (as above).

### 2. Build boomerang

The [build process](#documentation) bundles `boomerang.js` and all of the plugins
listed in `plugins.json` (in that order).

To build boomerang with all of your desired plugins, you would run:

```bash
grunt clean build
```

This creates a deployable boomerang in the `build` directory, e.g. `build/boomerang-<version>.min.js`.

Install this file on your web server or origin server where your CDN can pick it
up.  Set a far future
[max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
header for it.  This file will never change.

### 3. Asynchronously include the script on your page

There are two methods of asynchronously including boomerang on your page: by
adding it to your main document, or via an IFRAME.

The former method could block your `onload` event (affecting the measured
performance of your page), so the later method is recommended.

<a name="asynchronously-document"></a>
#### 3.1. Adding it to the main document

Include the following code at the *top* of your HTML document:

```html
<script>
(function(d, s) {
  var js = d.createElement(s),
      sc = d.getElementsByTagName(s)[0];

  js.src="http://your-cdn.host.com/path/to/boomerang-<version>.js";
  sc.parentNode.insertBefore(js, sc);
}(document, "script"));
</script>
```

Best practices will suggest including all scripts at the bottom of your page.
However, that only applies to scripts that block downloading of other resources.  

Including a script this way will not block other resources, however it _will_
block `onload`.

Including the script at the top of your page gives it a good chance of loading
before the rest of your page does, thereby reducing the probability of it
blocking the `onload` event.  

If you don't want to block `onload` either, use the following IFRAME method:

<a name="asynchronously-iframe"></a>
#### 3.2. Adding it via an IFRAME

The method described in 3.1 will still block `onload` on most browsers.

To avoid blocking `onload`, we can load boomerang in an asynchronous IFRAME.
The general process is documented on in
[this blog post](http://www.lognormal.com/blog/2012/12/12/the-script-loader-pattern/).

For boomerang, the asynchronous loader snippet you'll use is:

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
    js.src = 'http://your-cdn.host.com/path/to/boomerang-<version>.js';
    BOOMR_lstart = new Date().getTime();
    this.body.appendChild(js);
  };
  doc.write('<bo' + 'dy onload="document._l();">');
  doc.close();
})();
</script>
```

The `id` of the script node created by this code MUST be `boomr-if-as` as
boomerang looks for that id to determine if it's running within an IFRAME or not.

boomerang will still export the `BOOMR` object to the parent window if running
inside an IFRAME, so the rest of your code should remain unchanged.

#### 3.3. Identifying when boomerang has loaded

If you load boomerang asynchronously, there's some uncertainty in when boomerang
has completed loading.  To get around this, you can subscribe to the
`onBoomerangLoaded` Custom Event on the `document` object:

```javascript
// Modern browsers
if (document.addEventListener) {
  document.addEventListener("onBoomerangLoaded", function(e) {
    // e.detail.BOOMR is a reference to the BOOMR global object
  });
}
// IE 6, 7, 8 we use onPropertyChange and look for propertyName === "onBoomerangLoaded"
else if (document.attachEvent) {
  document.attachEvent("onpropertychange", function(e) {
    if (!e) e=event;
    if (e.propertyName === "onBoomerangLoaded") {
      // e.detail.BOOMR is a reference to the BOOMR global object
    }
  });
}
```

Note that this only works on browsers that support the CustomEvent interface,
which is Chrome (including Android), Firefox 6+ (including Android), Opera
(including Android, but not Opera Mini), Safari (including iOS), IE 6+
(but see the code above for the special way to listen for the event on IE6, 7 & 8).

boomerang also fires the `onBeforeBoomerangBeacon` and `onBoomerangBeacon`
events just before and during beaconing.

<a name="documentation"></a>
# Documentation

Documentation is in the `docs/` directory.  Boomerang documentation is
written in Markdown and is built via [JSDoc](http://usejsdoc.org/).

You can build the current documentation by running Grunt:

```
grunt jsdoc
```

HTML files will be built under `build/docs`.

Open-source Boomerang Documentation is currently published at
[akamai.github.io/boomerang/](https://akamai.github.io/boomerang/).

The team at Akamai works on mPulse Boomerang, which contains a few mPulse-specific plugins and may have additional
changes being tested before being backported to the open-source Boomerang.  mPulse Boomerang usage documentation is
available at [docs.soasta.com/boomerang/](https://docs.soasta.com/boomerang/) and mPulse Boomerang API documentation
is at [docs.soasta.com/boomerang-api/](https://docs.soasta.com/boomerang-api/).

Additional documentation:

- [API Documentation](https://akamai.github.io/boomerang/): The `BOOMR` API
- [Building Boomerang](https://akamai.github.io/boomerang/tutorial-building.html): How to build boomerang with plugins
- [Contributing](https://akamai.github.io/boomerang/tutorial-contributing.html): Contributing to the open-source project
- [Creating Plugins](https://akamai.github.io/boomerang/tutorial-creating-plugins.html): Creating a plugin
- [Methodology](https://akamai.github.io/boomerang/tutorial-methodology.html): How boomerang works internally
- [How-Tos](https://akamai.github.io/boomerang/tutorial-howtos.html): Short recipes on how to do a bunch of things with boomerang

# Source code

The boomerang source code is primarily on GitHub at [github.com/akamai/boomerang](https://github.com/akamai/boomerang).

Feel free to fork it and [contribute](https://akamai.github.io/boomerang/tutorial-contributing.html) to it.

You can also get a [check out the releases](https://github.com/akamai/boomerang/releases)
or download a [tarball](https://github.com/akamai/boomerang/archive/master.tar.gz) or
[zip](http://github.com/akamai/boomerang/archive/master.zip) of the code.

# Support

We use [GitHub Issues](https://github.com/akamai/boomerang/issues) for discussions,
feature requests and bug reports.

Get in touch at [github.com/akamai/boomerang/issues](https://github.com/akamai/boomerang/issues).

boomerang is supported by the developers at [Akamai](http://akamai.com/), and the
awesome community of open-source developers that use and hack it.  That's you.  Thank you!

# Contributions

Boomerang is brought to you by:

* the former [Exceptional Performance](http://developer.yahoo.com/performance/) team at the company once known as
    [Yahoo!](http://www.yahoo.com/), aided by the [Yahoo! Developer Network](http://developer.yahoo.com/),
* the folks at [LogNormal](http://www.lognormal.com/), continued by
* the mPulse team at [SOASTA](https://www.soasta.com/), ongoing by
* the mPulse team at [Akamai](https://www.akamai.com/), and
* many independent contributors whose contributions are cemented in our git history

To help out, please read our [contributing](https://akamai.github.io/boomerang/tutorial-contributing.html) page.
