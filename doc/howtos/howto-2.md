---
layout: default
title: Boomerang Howto 2
---

[All Docs](/) | [Index](index.html)

Measure perceived performance of content loaded dynamically
-----------------------------------------------------------

See [use case \#2](../use-cases.html#uc-2) for a description of this
requirement.

This document attempts to load some content using XHR and measures the
time it took to load that content using boomerang. This is how you do
it:

1.  Copy boomerang.js and the images/ directory into your document root
2.  Add the code below to your page, somewhere before your XHR calls.

    {% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
            user_ip: "<user's ip address>",
            beacon_url: "http://yoursite.com/path/to/beacon.php",
            auto_run: false
        });
    </script>
    {% endhighlight %}

Next fetch your content. Right before the call to fetch content, start
the timer. The load time timer is called `t_done`. In the callback
function where the content has been fetched, call the `done()` method.
This measures and beacons back the response time. I use YUI 3 in the
code below, but you could use anything you like.

    {% highlight javascript %}
    YUI().use("io-base", function(Y) {
        var uri = "dynamic-content.txt";

        function complete(id, o) {
            var html = o.responseText;
            document.getElementById("dynamic-content").innerHTML = html;
            BOOMR.plugins.RT.done();    // Tell boomerang to measure time and fire a beacon
        };

        Y.on('io:complete', complete);

        BOOMR.plugins.RT.startTimer("t_done");  // Start measuring download time
        var request = Y.io(uri);
    });
    {% endhighlight %}

<div id="results">
</div>

<div id="dynamic-content">
</div>

<script src="http://yui.yahooapis.com/combo?3.1.1/build/yui/yui-base-min.js&3.1.1/build/oop/oop-min.js&3.1.1/build/yui/yui-later-min.js&3.1.1/build/event-custom/event-custom-base-min.js&3.1.1/build/querystring/querystring-stringify-simple-min.js&3.1.1/build/io/io-base-min.js" type="text/javascript"> </script>
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

YUI().use("io-base", function(Y) {
    var uri = "dynamic-content.txt?" + new Date().getTime();

    function complete(id, o) {
        var html = "<p>\n" + o.responseText.replace(/^$/mg, '</p>\n<p>') + "\n</p>";
	document.getElementById("dynamic-content").innerHTML = html;
	BOOMR.plugins.RT.done();
    };

    Y.on('io:complete', complete);

    BOOMR.plugins.RT.startTimer("t_done");
    var request = Y.io(uri);
});

</script>
