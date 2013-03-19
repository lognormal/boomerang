---
layout: default
title: boomerang Howto 10
---

[All Docs](/) | [Index](index.html)

# Load time of a page prerendered by Google Chrome

This use case is based on Google Chrome's
[prerender](http://code.google.com/chrome/whitepapers/prerender.html)
capabilities introduced with Chrome 13. We use two pages for this use
case. This is page \#2 of the example. See [Page
\#1](howto-10-page%231.html) for the full explanation.

If you clicked the link to this page from [Page
\#1](howto-10-page%231.html), you should see page performance results
show up below. It may take a while if this is the first time you're
doing the test since testing your bandwidth takes about 6 seconds. You
can also click the link to Page \#1 to see the same output on Page \#1.

In the box below, if rt.start is set to cookie, you should see the
following numbers:

1.  t\_done (load time): Time from click to display (perceived load
    time)
2.  t\_load: Time from fetchStart/navigationStart to prerender finish
3.  t\_prerender: Time from fetchStart/navigationStart to display
4.  t\_postrender: Time from prerender finish to display

If rt.start is set to navigation (or something else), then t\_done is
the same as t\_prerender. If t\_prerender is not set, then this page
wasn't prerendered, and t\_done is the actual perceived load time.

<div id="results">
</div>

<script src="/boomerang/boomerang.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/bw.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/navtiming.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/rt.js" type="text/javascript"> </script>
<script src="howtos.js" type="text/javascript"> </script>
<script type="text/javascript">
BOOMR.init({
		BW: {
			enabled: false
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	});
</script>
