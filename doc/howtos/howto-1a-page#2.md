---
layout: default 
title: Boomerang Howto 1a 
---

[Index](index.html)

## User clicks a link on a page we control and page is usable when onload fires

See [use case \#1](../use-cases.html#uc-1) for a description of this
requirement.

We use two pages for this use case. This is page \#2 of the example. See
[Page \#1](howto-1a-page%231.html) for full explanation.

If you clicked the link to this page from [Page
\#1](howto-1a-page%231.html), you should see page performance results
show up below. It may take a while if this is the first time you're
doing the test since testing your bandwidth takes about 6 seconds. You
can also click the link to Page \#1 to see the same output on Page \#1.

<div id="results">
</div>

<script src="/boomerang/boomerang.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/bw.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/navtiming.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/rt.js" type="text/javascript"> </script>
<script src="howtos.js" type="text/javascript"> </script>
<script type="text/javascript">
BOOMR.init({
		user_ip: '10.0.0.1',
		BW: {
			base_url: '../../images/',
			cookie: 'HOWTO-BA'
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	});
</script>
