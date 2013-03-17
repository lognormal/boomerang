---
layout: default
title: Boomerang Howto 3
---

Measure a user's bandwidth/latency along with page load time
------------------------------------------------------------

See [use cases \#3](../use-cases.html#uc-3) &
[\#5](../use-cases.html#uc-5) for a description of this requirement.

By default, boomerang always measures the user's bandwidth and HTTP
latency and adds these numbers to the beacon that it sends back. In
reality, the bandwidth plugin (`BOOMR.plugins.BW`) does this, but since
that's bundled along with boomerang, the difference is purely academic.
There are a few things you need to know in order to use the bandwidth
detection code effectively.

First, bandwidth detection through javascsript is not accurate. If the
user's network is lossy or is shared with other users, or network
traffic is bursty, real bandwidth can vary over time. The measurement we
take is based over a short period of time, and this may not be
representative of the best or worst cases. We try to cover for that by
measuring not just the bandwidth, but also the error value in that
measurement.

Simply adding boomerang to a page and calling the `init()` method is
sufficient to start the bandwidth test and beacon its results back to
the server. This is the code you'd use:

{% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
        beacon_url: "http://yoursite.com/path/to/beacon.php",
        BW: {
            base_url: "http://base_url/to/bandwidth/images/"
        }
    });
    </script>
{% endhighlight %}

The default value of the `BW.base_url` parameter is `images/`, so if
your bandwidth detection images are placed in a subdirectory of the
current directory called `images`, then you do not need to set the
`BW.base_url` parameter. It is a good practice though, as you might have
pages in multiple directories.

Now while this is the minimum code required to measure bandwidth and
latency and have it beaconed back, it isn't the best option for your
user. The test will run every time the user visits a page on your site
even though their bandwidth probably hasn't changed (apart from regular
fluctuations). It's far better to store the bandwidth in a cookie for a
fixed period of time, and read it out of the cookie if it exists. Now it
is possible that the user moves between several networks, eg: a laptop
used at home, at work and at a coffee shop. The bandwidth and latency at
these locations may be different, and it's necessary to measure them
separately. We detect a change in network through the user's IP address,
so in order to store the user's bandwidth in a cookie, you will need to
tell boomerang what the user's IP address is. You do this through the
`user_ip` parameter.

    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
        beacon_url: "http://yoursite.com/path/to/beacon.php",
        user_ip: "<user's ip>",
        BW: {
            base_url: "http://base_url/to/bandwidth/images/"
        }
    });
    </script>

As far as I know, there's no way in javascript to figure out the user's
IP address. You'll have to do this server side and write the value into
your code.

IPv4 optimisations
------------------

If your user has an IPv4 address, then we also strip out the last part
of the IP and use that rather than the entire IP address. This helps if
users use DHCP on the same ISP where their IP address changes
frequently, but they stay within the same subnet. If the user has an
IPv6 address, we use the entire address.

The Cookie
----------

You may want to customise the name of the cookie where the bandwidth
will be stored. By default this is set to `BA`, but you can change it
using the `BW.cookie` parameter.

    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
        beacon_url: "http://yoursite.com/path/to/beacon.php",
        user_ip: "<user's ip>",
        BW: {
            base_url: "http://base_url/to/bandwidth/images/",
            cookie: "BW"
        }
    });
    </script>

This cookie is set to expire in 7 days. You can change its lifetime
using the `BW.cookie_exp` parameter. The value is in seconds. During
that time, you can also read the value of the cookie on the server side.
Its format is as follows:

    BA=ba=nnnnnnn&be=nnn.nn&l=nnnn&le=nn.nn&ip=iiiiii&t=sssssss;

The parameters are defined as:

ba
:   [integer] [bytes/s] The user's bandwidth to your server
be
:   [float] [bytes/s] The 95% confidence interval margin of error in
    measuring the user's bandwidth
l
:   [float] [ms] The HTTP latency between the user's computer and your
    server
le
:   [float] [ms] The 95% confidence interval margin of error in
    measuring the user's latency
ip
:   [ip address] The user's IPv4 or IPv6 address that was passed as the
    `user_ip` parameter to the `init()` method
t
:   [timestamp] The browser time (in seconds since the epoch) when the
    cookie was set

These parameters are also sent in the beacon (See [HOWTO
\#0](howto-0.html)), but having them in the cookie means that you can
customise your users experience based on the bandwidth before you serve
a request.

Disabling the bandwidth check
-----------------------------

Finally, there may be cases when you want to completely disable the
bandwidth test. Perhaps you know that your user is on a slow network, or
pays by the byte (the bandwidth test uses a lot of bandwidth), or is on
a mobile device that cannot handle the load. In such cases you have two
options.

1.  Delete the bandwdith plugin from your copy of boomerang.js
2.  Set the `BW.enabled` parameter to `false`:

{% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
        BW: { enabled: false  }
    });
    </script>
{% endhighlight %}

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
{% endraw %}
