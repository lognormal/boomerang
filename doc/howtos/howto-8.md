--- 
layout: default 
title: boomerang Howto 8 
---

Measure a user's DNS latency
----------------------------

See [use case \#7](../use-cases.html#uc-7) for a description of this
requirement.

**Note:** The DNS plugin hasn't been tested. Your help in testing it is
appreciated.

Measuring DNS requires some server-side set up. The entire set up was
[documented in
detail](http://developer.yahoo.net/blog/archives/2009/11/guide_to_dns.html)
by Yahoo! engineer Carlos Bueno, so go read his post for everything
you'll need to set this up. In brief, the points he covers are:

1.  Set up a wildcard hostname, perferably one that does not share
    cookies with your main site. Give it a low TTL, say, 60 seconds, so
    you don't pollute downstream caches.
2.  Set up a webserver for the wildcard hostname that serves the images
    named `A.gif` and `B.gif` (from the [images/](../../images/)
    subdirectory) as fast as possible. Make sure that KeepAlive, Nagle,
    and any caching headers are turned off.
3.  Include `dns.js` along with `boomerang.js` (you can just concatenate
    the two files)
4.  Tell the DNS plugin where to get its images from

Steps 1 and 2 are complicated, and if you don't have full control over
your DNS server (eg: you use Dreamhost), then it may be impossible for
you to do this. If you can go forward, read on.

To configure the plugin, you only need to tell it where to get its
images from. Unlike the bandwidth plugin though, this URL needs a
wildcard:

{% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script src="dns.js" type="text/javascript"></script> <!-- concatenate with boomerang.js for better performance -->
    <script type="text/javascript">
    BOOMR.init({
            user_ip: "<user's ip address>",
            beacon_url: "http://yoursite.com/path/to/beacon.php",
            DNS: {                                         
                base_url: "http://*.yoursite.com/images/"  
            }                                              
        });
    </script>
{% endhighlight %}

If you've set things up correctly, this should measure your DNS latency
within a margin of error. We could run the test multiple times to find
out what this error is, but for now we'll just do it once.

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
			base_url: '../../images/',
			cookie: 'HOWTO-BA'
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	});
</script>
{% endraw %}
