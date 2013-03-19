---
layout: default
title: boomerang Howto 6
---

[All Docs](/) | [Index](index.html)

# Configuring boomerang

To use boomerang, you first include `boomerang.js` in your html file and
then call the `BOOMR.init()` method. This should be sufficient to
measure page performance, but may not be useful enough to you as a site
owner. You still won't get data back to your server, and probably won't
be able to measure the user's bandwidth either.

In this document we'll look at all the different parameters you can use
to configure boomerang and its built in plugins. If you have additional
plugins, consult their documentation for details on how to configure
them.

## Configuring boomerang

To configure boomerang and its plugins, you pass in a configuration
object to the `init()` method:

{% highlight javascript %}
BOOMR.init({
  key: value,
  // ...
});
{% endhighlight %}

boomerang has the following configurable parameters:

beacon\_url

**[highly recommended]** The URL to beacon results back to. All
parameters will be added to this URL's query string. This URL should not
already have a query string component. There is no default value for
this parameter. If not set, no beacon will be sent.

site\_domain

**[recommended]** The domain that all cookies should be set on.
Boomerang will try to auto-detect this, but unless your site is of the
`foo.com` format, it will probably get it wrong. It's a good idea to set
this to whatever part of your domain you'd like to share bandwidth and
performance measurements across.\
 If you have multiple domains, then you're out of luck. You'll just have
to get separate measurements across them.

user\_ip

**[recommended]** Despite its name, this is really a free-form string
used to uniquely identify the user's current internet connection. It's
used primarily by the bandwidth test to determine whether it should
re-measure the user's bandwidth or just use the value stored in the
cookie. You may use IPv4, IPv6 or anything else that you think can be
used to identify the user's network connection.

log

**[optional]** By default, boomerang will attempt to use the logger
component from YUI if it finds it or firebug if it finds that instead.
If it finds neither, it will default to not logging anything. You can
define your own logger by setting the `log` parameter to a function that
logs messages.\
 The signature of this function is:

{% highlight javascript %}
function log(oMessage, sLevel, sSource);
{% endhighlight %}

Where:

oMessage
:   is the object/message to be logged. It is up to you to decide how to
    log objects.
sLevel
:   is the log level, with values of "error", "warn", "info" and "debug"
sSource
:   is the source of the log message. This will typically be the string
    "boomerang" followed by the name of a plugin

Note that you can completely disable logging by setting `log` to `null`.

autorun

**[optional]** By default, boomerang runs automatically and attaches its
`page_ready` handler to the `window.onload` event. If you set `autorun`
to `false`, this will not happen and you will need to call
`BOOMR.page_ready()` yourself.

plugin\_name

Each plugin is configured through a sub-object of the config object. The
key is the name of the plugin. In the following sections we'll see how
to configure our built-in plugins.

{% highlight javascript %}
BOOMR.init({
        beacon_url: "http://beacons.yoursite.com/path/to/beacon.php",
        site_domain: "yoursite.com",
        user_ip: "202.54.1.18",
        autorun: false
    });
{% endhighlight %}

## Roundtrip plugin

All roundtrip plugin configuration items are under the `RT` namespace.

cookie
:   **[optional]** The name of the cookie in which to store the start
    time for measuring page load time. The default name is `RT`. Set
    this to a falsy value like `null` or the empty string to ignore
    cookies and depend completely on the WebTiming API for the start
    time.

cookie\_exp
:   **[optional]** The lifetime in seconds of the roundtrip cookie. This
    only needs to live for as long as it takes for a single page to
    load. Something like 10 seconds or so should be good for most cases,
    but to be safe, and to cover people with really slow connections, or
    users that are geographically far away from you, keep it to a few
    minutes. The default is set to 10 minutes.

strict\_referrer
:   **[optional]** By default, boomerang will not measure a page's
    roundtrip time if the URL in the `RT` cookie doesn't match the
    current page's `document.referrer`. This is so because it generally
    means that the user visited a third page while their `RT` cookie was
    still valid, and this could render the page load time invalid.\
     There may be cases, though, when this is a valid flow — for
    example, you have an SSL page in between and the referrer isn't
    passed through. In this case, you'll want to set `strict_referrer`
    to `false`

    {% highlight javascript %}
    BOOMR.init({
            beacon_url: "http://beacons.yoursite.com/path/to/beacon.php",
            site_domain: "yoursite.com",
            user_ip: "202.54.1.18",
            autorun: false,
            RT: {
                    cookie: "MyRT",
                    cookie_exp: 120
            }
        });
    {% endhighlight %}

## Bandwidth plugin

All bandwidth plugin configuration items are under the `BW` namespace.

base\_url
:   **[required]** By default, this is set to the empty string, which
    has the effect of disabling the bandwidth plugin. Set the `base_url`
    parameter to the HTTP path of the directory that contains the
    bandwidth images to enable this test. This can be an absolute or a
    relative URL. If it's relative, remember that it's relative to the
    page that boomerang is included in and not to the javascript file.
    The trailing / is required.

cookie
:   **[optional]** The name of the cookie in which to store the measured
    bandwidth and latency of the user's network connection. The default
    name is `BA`. See [Howto \#3](howto-3.html) for more details on the
    bandwidth cookie.

cookie\_exp
:   **[optional]** The lifetime in seconds of the bandwidth cookie. The
    default is set to 7 days. This specifies how long it will be before
    we run the bandwidth test again for a user, assuming their IP
    address doesn't change within this time. You probably do not need to
    change this setting at all since the bandwidth of a given network
    connection typically does not change by an order of magnitude on a
    regular basis.\
     Note that if you're doing some kind of real-time streaming, then
    chances are that this bandwidth test isn't right for you, so setting
    this cookie to a shorter value isn't the right solution.

timeout
:   **[optional]** The timeout in milliseconds for the entire bandwidth
    test. The default is set to 15 seconds. The bandwidth test can run
    for a long time, and sometimes, due to network errors, it might
    never complete. The timeout forces the test to complete at that
    time. This is a hard limit. If the timeout fires, we stop further
    iterations of the test and attempt to calculate bandwidth with the
    data that we've collected at that point. Increasing the timeout can
    get you more data and increase the accuracy of the test, but at the
    same time increases the risk of the test not completing before the
    user leaves the page.

nruns
:   **[optional]** The number of times the bandwidth test should run.
    The default is set to 5. The first test is always a pilot to figure
    out the best way to proceed with the remaining tests. Increasing
    this number will increase the tests accuracy, but at the same time
    increases the risk that the test will timeout. It should take about
    2-4 seconds per run, so consider this value along with the `timeout`
    value above.

## All optional

All configuration parameters are optional, but not setting some of them
can lead to unexpected or incomplete results, so they should be set. It
is, however, possible to get up and running by doing nothing more than
putting your bandwidth images in the right directory, including the code
and calling `init()`.

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
