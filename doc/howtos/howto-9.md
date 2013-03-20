---
layout: default
title: boomerang Howto 9
---

[Index](index.html)

# Collect performance data from the Navigation Timing API

The W3C Navigation Timing API is an interface implemented by modern
browsers that provides broad and deep data related to the performance of
page loads. At the time of this writing, it is supported by the
following browsers:

-   Chrome 6+
-   Internet Explorer 9+
-   Firefox 7+ (**note** that a bug in Firefox 7 and 8 reports the
    incorrect time for navigationStart. Use unloadEventStart or
    fetchStart for a close proximation.)

The navtiming.js plugin doesn't require any configuration options as it
simply reads data out of the browser (if available) and adds it to the
beacon query string.

You will have to build your own version of boomerang.js since it isn't
one of the default plugins. To do this, run `make` in the boomerang
directory with the following option:

    make PLUGINS=navtiming.js

Then you can include the new boomerang file (don't forget to run it
through your favorite Javascript minifier first) as you normally would.

The new query parameters and the browser attributes they map to are
shown below. More information about the definition of each attribute can
be found in the [W3C Navigation Timing
specification](http://www.w3.org/TR/navigation-timing/).

<table>
<tr>
  <th>Boomerang beacon parameter</th>
    <th>Navigation Timing attribute</th>
  </tr>
<tr><td>nt_red_cnt</td><td>window.performance.navigation.redirectCount</td></tr>
<tr><td>nt_nav_type</td><td>window.performance.navigation.type</td></tr>
<tr><td>nt_nav_st</td><td>window.performance.timing.navigationStart</td></tr>
<tr><td>nt_red_st</td><td>window.performance.timing.redirectStart</td></tr>
<tr><td>nt_red_end</td><td>window.performance.timing.redirectEnd</td></tr>
<tr><td>nt_fet_st</td><td>window.performance.timing.fetchStart</td></tr>
<tr><td>nt_dns_st</td><td>window.performance.timing.domainLookupStart</td></tr>
<tr><td>nt_dns_end</td><td>window.performance.timing.domainLookupEnd</td></tr>
<tr><td>nt_con_st</td><td>window.performance.timing.connectStart</td></tr>
<tr><td>nt_con_end</td><td>window.performance.timing.connectEnd</td></tr>
<tr><td>nt_req_st</td><td>window.performance.timing.requestStart</td></tr>
<tr><td>nt_res_st</td><td>window.performance.timing.responseStart</td></tr>
<tr><td>nt_res_end</td><td>window.performance.timing.responseEnd</td></tr>
<tr><td>nt_domloading</td><td>window.performance.timing.domLoading</td></tr>
<tr><td>nt_domint</td><td>window.performance.timing.domInteractive</td></tr>
<tr><td>nt_domcontloaded_st</td><td>window.performance.timing.domContentLoadedStart</td></tr>
<tr><td>nt_domcontloaded_end</td><td>window.performance.timing.domContentLoadedEnd</td></tr>
<tr><td>nt_domcomp</td><td>window.performance.timing.domComplete</td></tr>
<tr><td>nt_load_st</td><td>window.performance.timing.loadEventStart</td></tr>
<tr><td>nt_load_end</td><td>window.performance.timing.loadEventEnd</td></tr>
<tr><td>nt_unload_st</td><td>window.performance.timing.unloadEventStart</td></tr>
<tr><td>nt_unload_end</td><td>window.performance.timing.unloadEventEnd</td></tr>
</table>

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
			base_url: '/boomerang/images/',
			cookie: 'HOWTO-BA'
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	});
</script>
