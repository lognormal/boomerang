Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
Some code Copyright (c) 2012, Log-Normal Inc.  All rights reserved.

Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

boomerang always comes back, except when it hits something.

summary
---

boomerang is a JavaScript library that measures the page load time experienced by real users, commonly called RUM.

Apart from page load time, boomerang measures a whole bunch of performance characteristics of your user's web browsing experience.  All you have to do is stick it into your web pages and call the
init() method.

usage
---

The simple synchronous way to include boomerang on your page:
```html
<script src="http://your-cdn.host.com/path/to/boomerang-version.js"></script>
<script>
   BOOMR.init();
</script>
```

The faster, more involved, asynchronous way (and what I do for sites I control):

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

### 2. Build boomerang using this plugin as the last one

```bash
make PLUGINS="list.js of.js plugins.js zzz_init.js" MINIFIER="/path/to/your/js-minifier"
```

This should create `boomerang-<version>.js`

Install this file on your web server or origin server where your CDN can pick it up.  Set a far future max-age header for it.  This file will never change.

### 3. Asynchronously include the script on your page

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

docs
---
Documentation is in the docs/ sub directory, and is written in HTML.  Your best bet is to check it out and view it locally, though it works best through a web server (you'll need cookies).
Thanks to github's awesome `gh-pages` feature, we're able to host the boomerang docs right here on github.  Visit http://lognormal.github.com/boomerang/doc/ for a browsable version where all
the examples work.

In case you're browsing this elsewhere, the latest development version of the code and docs are available at https://github.com/bluesmoon/boomerang/, while the latest stable version is
at https://github.com/lognormal/boomerang/

support
---
We use github issues for discussions, feature requests and bug reports.  Get in touch at https://github.com/lognormal/boomerang/issues
You'll need a github account to participate, but then you'll need one to check out the code as well :)

Thanks for dropping by, and please leave us a message telling us if you use boomerang.

boomerang is supported by the devs at <a href="http://www.lognormal.com/">LogNormal</a>, and the awesome community of opensource developers that use
and hack it.  That's you.  Thank you!
