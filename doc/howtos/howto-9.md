---
layout: default
title: boomerang Howto 9
---

Collect performance data from the Navigation Timing API
-------------------------------------------------------

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

  Boomerang beacon parameter   Navigation Timing attribute
  ---------------------------- ---------------------------------------------------
  `nt_red_cnt`                 `window.performance.navigation.redirectCount`
  `nt_nav_type`                `window.performance.navigation.type`
  `nt_nav_st`                  `window.performance.timing.navigationStart`
  `nt_red_st`                  `window.performance.timing.redirectStart`
  `nt_red_end`                 `window.performance.timing.redirectEnd`
  `nt_fet_st`                  `window.performance.timing.fetchStart`
  `nt_dns_st`                  `window.performance.timing.domainLookupStart`
  `nt_dns_end`                 `window.performance.timing.domainLookupEnd`
  `nt_con_st`                  `window.performance.timing.connectStart`
  `nt_con_end`                 `window.performance.timing.connectEnd`
  `nt_req_st`                  `window.performance.timing.requestStart`
  `nt_res_st`                  `window.performance.timing.responseStart`
  `nt_res_end`                 `window.performance.timing.responseEnd`
  `nt_domloading`              `window.performance.timing.domLoading`
  `nt_domint`                  `window.performance.timing.domInteractive`
  `nt_domcontloaded_st`        `window.performance.timing.domContentLoadedStart`
  `nt_domcontloaded_end`       `window.performance.timing.domContentLoadedEnd`
  `nt_domcomp`                 `window.performance.timing.domComplete`
  `nt_load_st`                 `window.performance.timing.loadEventStart`
  `nt_load_end`                `window.performance.timing.loadEventEnd`
  `nt_unload_st`               `window.performance.timing.unloadEventStart`
  `nt_unload_end`              `window.performance.timing.unloadEventEnd`

<div id="results">
</div>

{% raw %}
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
{% enraw %}
