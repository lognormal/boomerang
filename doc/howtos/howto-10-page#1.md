---
layout: default
title: Boomerang Howto 10
---

[All Docs](/) | [Index](index.html)

# Load time of a page prerendered by Google Chrome

This use case is based on Google Chrome's
[prerender](http://code.google.com/chrome/whitepapers/prerender.html)
capabilities introduced with Chrome 13. The code to include on a page is
the same regardless of whether you use prerender or not, so this howto
will not cover that. However, to enable prerendering of a particular
page, you include that page's URL as a link element in the current
document. For example, we include this code in the HEAD of the current
page:

    <link rel="prerender" href="howto-10-page%232.html">

This tells Chrome to prefetch `howto-10-page#2.html` and all its assets,
and to start rendering it in the background, invisible to the user. When
the user eventually clicks on a link to that document, it should show up
immediately.

As performance concious engineers, however, we'd like to know how long
it all took. In particular, the numbers we care about are:

1.  Time from click to display
2.  Time from fetchStart/navigationStart to prerender finish
3.  Time from fetchStart/navigationStart to display
4.  Time from prerender finish to display

Let's hope you've spent enough time reading this page to allow page\#2's
rendering to complete.

Go to [Page \#2](howto-10-page%232.html) now to see the results of the
page load test.

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
