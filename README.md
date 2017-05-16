Some code Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
Some code Copyright (c) 2011-2012, Log-Normal Inc.  All rights reserved.
Most code Copyright (c) 2012-2016 SOASTA, Inc. All rights reserved.

Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

boomerang always comes back, except when it hits something.

summary
---

[![Join the chat at https://gitter.im/SOASTA/boomerang](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/SOASTA/boomerang?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

boomerang is a JavaScript library that measures the page load time experienced by real users, commonly called RUM.

Apart from page load time, boomerang measures a whole bunch of performance characteristics of your user's web browsing experience.  All you have to do is stick it into your web pages and call the
init() method.

usage
---

## The simple synchronous way

```html
<script src="boomerang/boomerang.js"></script>
<script src="boomerang/plugins/rt.js"></script>
<script>
   BOOMR.init({
       beacon_url: "/boomerang_handler"
   });
</script>
```

**Note** - you must include at least one plugin (it doesn't have to be rt) or else the beacon will never actually be called.

## The faster, more involved, asynchronous way

This is what I like to do for sites I control.

### 1. Add a plugin to init your code

Create a plugin (call it zzz_init.js or whatever you like) with your init code in there:
```javascript
BOOMR.init({
	config: parameters,
	...
});
```
You could also include any other code you need.  For example, I include a timer to measure when boomerang has finished loading.

I call my plugin `zzz_init.js` to remind me to include it last in the plugin list

### 2. Build boomerang
The build process picks up all the plugins referenced in the `plugins.json` file. To change the plugins included in the boomerang build, change the contents of the file to your needs.

```bash
grunt clean build
```

This creates deployable boomerang versions in the `build` directory, e.g. `build/boomerang-<version>.min.js`.

Install this file on your web server or origin server where your CDN can pick it up.  Set a far future max-age header for it.  This file will never change.

### 3. Asynchronously include the script on your page

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

Yes, the best practices say to include scripts at the bottom.  That's different.  That's for scripts that block downloading of other resources.  Including a script this
way will not block other resources, however it _will_ block <code>onload</code>.  Including the script at the top of your page gives it a good chance of loading
before the rest of your page does thereby reducing the probability of it blocking the `onload` event.  If you don't want to block `onload` either, follow Stoyan's
<a href="http://www.phpied.com/non-onload-blocking-async-js/">advice from the Meebo team</a>.

#### 3.2. Adding it via an iframe

The method described in 3.1 will still block `onload` on most browsers (Internet Explorer not included).  To avoid
blocking `onload`, we could load boomerang in an iframe.  Stoyan's <a href="http://www.phpied.com/non-onload-blocking-async-js/">documented
the technique on his blog</a>.  We've modified it to work across browsers with different configurations, documented on
<a href="http://www.lognormal.com/blog/2012/12/12/the-script-loader-pattern/">the lognormal blog</a>.

For boomerang, this is the code you'll include:

```html
<script>
(function(){
  var dom,doc,where,iframe = document.createElement('iframe');
  iframe.src = "javascript:void(0)";
  (iframe.frameElement || iframe).style.cssText = "width: 0; height: 0; border: 0";
  var where = document.getElementsByTagName('script')[0];
  where.parentNode.insertBefore(iframe, where);

  try {
    doc = iframe.contentWindow.document;
  } catch(e) {
    dom = document.domain;
    iframe.src="javascript:var d=document.open();d.domain='"+dom+"';void(0);";
    doc = iframe.contentWindow.document;
  }
  doc.open()._l = function() {
    var js = this.createElement("script");
    if(dom) this.domain = dom;
    js.id = "boomr-if-as";
    js.src = 'http://your-cdn.host.com/path/to/boomerang-<version>.js';
    this.body.appendChild(js);
  };
  doc.write('<body onload="document._l();">');
  doc.close();
})();
</script>
```
The `id` of the script node created by this code MUST be `boomr-if-as` as boomerang looks for that id to determine if it's running within an iframe or not.

Boomerang will still export the `BOOMR` object to the parent window if running inside an iframe, so the rest of your code should remain unchanged.

#### 3.3. Identifying when boomerang has loaded

If you load boomerang asynchronously, there's some uncertainty in when boomerang has completed loading.  To get around this, you can subscribe to the
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

Note that this only works on browsers that support the CustomEvent interface, which at this time is Chrome (including Android), Firefox 6+ (including Android),
Opera (including Android, but not Opera Mini), Safari (including iOS), IE 6+ (but see the code above for the special way to listen for the event on IE6, 7 & 8).

Boomerang also fires the `onBeforeBoomerangBeacon` and `onBoomerangBeacon` events just before and during beaconing.

#### 3.4. Method queue pattern

If you want to call a public method that lives on `BOOMR`, but either don't know if Boomerang has loaded or don't want to wait, you can use the method queue pattern!

Instead of:
```javascript
BOOMR.addVar('myVarName', 'myVarValue')
```

... you can write:
```javascript
BOOMR_mq = window.BOOMR_mq || [];
BOOMR_mq.push(['addVar', 'myVarName', 'myVarValue']);
```

Or, if you care about the return value, instead of:
```javascript
var hasMyVar = BOOMR.hasVar('myVarName');
```
... you can write:
```javascript
var hasMyVar;
BOOMR_mq = window.BOOMR_mq || [];
BOOMR_mq.push({
   arguments: ['hasVar', 'myVarName'],
   callback: function(returnValue) {
     hasMyVar = returnValue;
   }
});
```

docs
---
Documentation is in the docs/ sub directory, and is written in HTML.  Your best bet is to check it out and view it locally, though it works best through a web server (you'll need cookies).
Thanks to github's awesome `gh-pages` feature, we're able to host the boomerang docs right here on github.  Visit http://soasta.github.com/boomerang/doc/ for a browsable version where all
the examples work.

In case you're browsing this elsewhere, the latest development version of the code and docs are available at https://github.com/bluesmoon/boomerang/, while the latest stable version is
at https://github.com/SOASTA/boomerang/

support
---
We use github issues for discussions, feature requests and bug reports.  Get in touch at https://github.com/SOASTA/boomerang/issues
You'll need a github account to participate, but then you'll need one to check out the code as well :)

Thanks for dropping by, and please leave us a message telling us if you use boomerang.

boomerang is supported by the devs at <a href="http://soasta.com/">SOASTA</a>, and the awesome community of opensource developers that use
and hack it.  That's you.  Thank you!
