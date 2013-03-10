---
layout: default 
title: Boomerang Howto 1b 
---

User clicks a link on a page we control and page is usable at some developer determined point
---------------------------------------------------------------------------------------------

See [use case \#1](../use-cases.html#uc-1) for a description of this
requirement.

We use two pages for this use case. This is page \#2 of the example. See
[Page \#1](howto-1b-page%231.html) for full explanation.

If you clicked the link to this page from [Page
\#1](howto-1b-page%231.html), you should see page performance results
show up below. We introduce an artificial delay of 750ms to show how you
can fire the `page_ready` event after the page has loaded. It may take a
while if this is the first time you're doing the test since testing your
bandwidth takes about 6 seconds. You can also click the link to Page \#1
to see the same output on Page \#1.

The latest code and docs is available on
[github.com/lognormal/boomerang](http://github.com/lognormal/boomerang/)

<div id="results">
</div>

<script src="http://{{site.url}}/boomerang/boomerang.js" type="text/javascript"></script>
<script src="http://{{site.url}}/boomerang/plugins/bw.js" type="text/javascript"></script>
<script src="http://{{site.url}}/boomerang/plugins/navtiming.js" type="text/javascript"></script>
<script src="http://{{site.url}}/boomerang/plugins/rt.js" type="text/javascript"></script>
<script src="howtos.js" type="text/javascript"></script>
<script type="text/javascript">
BOOMR.init({
		user_ip: '10.0.0.1',
		autorun: false,
		BW: {
			base_url: '../../images/',
			cookie: 'HOWTO-BA'
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	});

// Fire the page_ready event after 750ms
setTimeout(function() { BOOMR.page_ready(); }, 750);
</script>
