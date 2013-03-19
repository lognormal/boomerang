---
layout: default
title: boomerang Howto 0
---
[All Docs](/) | [Index](index.html)

# How to read data out of a beacon or before\_beacon event handler

For all subsequent examples, you'll need to pull performance data out of
the beacon or out of a `before_beacon` event handler. This howto
explains how to do that.

## Beacon results back to your server

For most cases you'd want to send performance data back to your server
so you can analyse it later and take action against it. The first thing
you need to do is set up a url that the javascript will use as a beacon.
We'll look at the back end details a little later. You tell boomerang
about your beacon URL by passing the `beacon_url` parameter to the
`BOOMR.init()` method:

    {% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
            beacon_url: "http://yoursite.com/path/to/beacon.gif"
        });
    </script>
    {% endhighlight %}

I've used beacon.gif as an example, but it could really be any thing.
You could write a script in PHP or C\# or JSP to handle the beacons as
well. I just use a URL that does nothing on the back end, and then later
look at my apache web logs to get the beaconed parameters in a batch.

### Beacon parameters

The beacon that hits your server will have several parameters. Each
plugin also adds its own parameters, so if you have custom plugins set
up, you'll get parameters from them as well. This is what you get from
the default install:

#### boomerang parameters

v
:   Version number of the boomerang library in use.
u
:   URL of page that sends the beacon.

#### roundtrip plugin parameters

t\_done
:   **[optional]** Perceived load time of the page.

t\_page
:   **[optional]** Time taken from the head of the page to page\_ready.

t\_resp
:   **[optional]** Time taken from the user initiating the request to
    the first byte of the response.

t\_other
:   **[optional]** Comma separated list of additional timers set by page
    developer. Each timer is of the format `name|value`. The following
    timers may be included:

  t_load
  :   **[optional]** If the page were prerendered, this is the time to
      fetch and prerender the page.

  t_prerender
  :   **[optional]** If the page were prerendered, this is the time
      from start of prefetch to the actual page display. It may only
      be useful for debugging.

  t_postrender
  :   **[optional]** If the page were prerendered, this is the time
      from prerender finish to actual page display. It may only be
      useful for debugging.

  boomerang
  :   The time it took boomerang to load up from first byte to last
      byte

  boomr_fb
  :   **[optional** The time it took from the start of page load to
      the first byte of boomerang. Only included if we know when page
      load started.

r
:   URL of page that set the start time of the beacon.

r2
:   **[optional]** URL of referrer of current page. Only set if
    different from `r` and `strict_referrer` has been explicitly turned
    off.

rt.start
:   Specifies where the start time came from. May be one of `cookie` for
    the start cookie, `navigation` for the W3C navigation timing API,
    `csi` for older versions of Chrome or `gtb` for the Google Toolbar.

rt.bstart
:   The timestamp when boomerang showed up on the page

rt.end
:   The timestamp when the done() method was called

#### bandwidth & latency plugin

bw
:   User's measured bandwidth in bytes per second

bw\_err
:   95% confidence interval margin of error in measuring user's
    bandwidth

lat
:   User's measured HTTP latency in milliseconds

lat\_err
:   95% confidence interval margin of error in measuring user's latency

bw\_time
:   Timestamp (seconds since the epoch) on the user's browser when the
    bandwidth and latency was measured

## Read results from javascript

There may be cases where rather than beacon results back to your server
(or alongside beaconing), you may want to inspect performance numbers in
javascript itself and perhaps make some decisions based on this data.
You can get at this data before the beacon fires by subscribing to the
`before_beacon` event.

    {% highlight javascript %}
    BOOMR.subscribe('before_beacon', function(o) {
        // Do something with o
    });
    {% endhighlight %}

Your event handler is called with a single object parameter. This object
contains all of the beacon parameters described above except for the `v`
(version) parameter. To get boomerang's version number, use
`BOOMR.version`.

In all these howto documents, we use the following code in the
`before_beacon` handler:

    {% highlight javascript %}
    BOOMR.subscribe('before_beacon', function(o) {
        var html = "";
        if(o.t_done) { html += "This page took " + o.t_done + "ms to load<br>"; }
        if(o.bw) { html += "Your bandwidth to this server is " + parseInt(o.bw/1024) + "kbps (&#x00b1;" + parseInt(o.bw_err*100/o.bw) + "%)<br>"; }
        if(o.lat) { html += "Your latency to this server is " + parseInt(o.lat) + "&#x00b1;" + o.lat_err + "ms<br>"; }

        document.getElementById('results').innerHTML = html;
    });
    {% endhighlight %}

## Back end script

A simple back end script would look something like this. Note, I won't
include the code that gets the URL parameters out of your environment. I
assume you know how to do that. The following code assumes these
parameters are in a variable named `params`. The code is in Javascript,
but you can write it in any language that you like.

    {% highlight javascript %}
    function extract_boomerang_data(params)
    {
        var bw_buckets = [64, 256, 1024, 8192, 30720],
            bw_bucket = bw_buckets.length,
            i, url, page_id, ip, ua, woeid;


        // First validate your beacon, make sure all datatypes
        // are correct and values within reasonable range
        // We'll also want to detect fake beacons, but that's more complex
        if(! validate_beacon(params)) {
            return false;
        }

        // You may also want to do some kind of random sampling at this point

        // Figure out a bandwidth bucket.
        // we could get more complex and consider bw_err as well,
        // but for this example I'll ignore it
        for(i=0; i<bw_buckets.length; i++) {
            if(params.bw <= bw_buckets[i]) {
                bw_bucket = i;
                break;
            }
        }

        // Now figure out a page id from the u parameter
        // Since we might have a very large number of URLs that all
        // map onto a very small number (possibly 1) of distinct page types
        // It's good to create page groups to simplify performance analysis.

        url = canonicalize_url(params.u); // get a canonical form for the URL
        page_id = get_page_id(url);   // get a page id.  (many->1 map?)


        // At this point we can extract other information from the request
        // eg, the user's IP address (good for geo location) and user agent
        ip = get_user_ip();              // get user's IP from request
        woeid = ip_to_woeid(ip);         // convert IP to a Where on earth ID
        ua = get_normalized_uastring();  // get a normalized useragent string

        // Now insert the data into our database
        insert_data(page_id, params.t_done, params.bw, params.bw_err, bw_bucket, params.lat, params.lat_err, ip, woeid, ua);

        return true;
    }
{% endhighlight %}

### Scaling up

The above code works well when you have a few thousand requests in a
day. If that number starts growing to the hundreds of thousands or
millions, then your beacon handler quickly becomes a bottleneck. It can
then make sense to simply batch process the beacons. Let the requests
come in to your apache (or other webserver) logs, and then periodically
(say once an hour), process those logs as a batch and do a single batch
insert into your database.

My talk from IPC Berlin 2010 on [scaling MySQL
writes](http://www.slideshare.net/bluesmoon/scaling-mysql-writes-through-partitioning-ipc-spring-edition)
goes into how we handled a large number of beacon results with a single
mysql instance. It may help you or you may come up with a better
solution.

## Statistical analysis of the data

Once you've got your data, it's useful to do a bunch of statistical
analysis on it. We'll cover this in a future howto, but for now, have a
look at my ConFoo 2010 talk on [the statistics of web
performance](http://www.slideshare.net/bluesmoon/index-3441823).

The latest code and docs is available on
[github.com/lognormal/boomerang](http://github.com/lognormal/boomerang/)

<div id="results"></div>

<script src="/boomerang/boomerang.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/bw.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/navtiming.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/rt.js" type="text/javascript"> </script>
<script src="howtos.js" type="text/javascript"> </script>
<script type="text/javascript">
BOOMR.init({
		user_ip: '10.0.0.1',
		BW: {
			base_url: '/images/',
			cookie: 'HOWTO-BA'
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	});
</script>
