---
layout: howto4
title: Boomerang Howto 4
---

## Measure more than just page load time

See [use case \#4](../use-cases.html#uc-4) for a description of this
requirement.

Up until now we've measured the time it takes for a page to become
usable by the user. It may also be useful to measure the time it took
for various components within the page to load and match that up with
the full page load time. boomerang provides additional timers that you
can configure to measure separate parts of your page. You use the
`startTimer()` and `endTimer()` methods of the roundtrip
(`BOOMR.plugin.RT`) plugin to do this.

In the following examples, you'll need to make sure that `boomerang.js`
is loaded and the `init()` method called before you call any of these
methods, so perhaps putting it at the top of your page is a good idea.
We'll see later how to work around this.

First, identify sections of your page that you want to measure. Call
`startTimer()` before and `endTimer()` after. Each timer has its own
name. The names are free-form strings, but stay simple to be efficient.
Stick to alphanumeric characters and underscores, and limit names to
around 5 characters, eg: `t_ads`, `t_head`, `t_js`. The following names
are reserved: `t_done`, `t_page`, `t_resp`.

Make sure you've included boomerang.js before starting the timers.

{% highlight html %}
    <html>
      <head>
        <script src="boomerang.js" type="text/javascript"></script>
        <script type="text/javascript">
          BOOMR.init({
            beacon_url: "http://yoursite.com/path/to/beacon.php"
          });
          BOOMR.plugins.RT.startTimer("t_head");
        </script>
        <title>page title</title>
        <meta http-equiv="Content-type" content="text/html; charset=utf-8">
        <link rel="stylesheet" type="text/css" href="../boomerang-docs.css">
        <script type="text/javascript">
          BOOMR.plugins.RT.endTimer("t_head").startTimer("t_body");
        </script>
      </head>
      <body>
        page body here
        <script type="text/javascript">
          BOOMR.plugins.RT.endTimer("t_body");
        </script>
      </body>
    </html>
{% endhighlight %}

Your timers will now be included in the beacon along with `t_done`.

Notice in the second invocation how we chain the calls to `endTimer` and
`startTimer`. This is possible for most methods that you call since they
return a reference to the object. Note that the timer methods are run on
the `BOOMR.plugins.RT` object, so they return a reference to that object
and not to the `BOOMR` object.

Measuring time for content loaded before boomerang
--------------------------------------------------

Now we've said for years that putting javascript at the bottom of your
document is good for performance, so asking you to load boomerang at the
top may not be the best advice. You can still measure in-page times
though, and then report them to boomerang once it has loaded. You do
this using the `BOOMR.plugins.RT.setTimer()` method. This method takes
two parameters — the timer name and its value in milliseconds. The code
above will change to this:

{% highlight html %}
    <html>
      <head>
        <script type="text/javascript">
          var t_pagestart=new Date().getTime();
        </script>
        <title>page title</title>
        <meta http-equiv="Content-type" content="text/html; charset=utf-8">
        <script type="text/javascript">
          var t_headend = new Date().getTime();
        </script>
      </head>
      <body>
        page body here
        <script type="text/javascript">
          var t_jsstart = new Date().getTime();
        </script>
        <script src="boomerang.js" type="text/javascript"></script>
        <script type="text/javascript">
          BOOMR.init({
            beacon_url: "http://yoursite.com/path/to/beacon.php"
          });
          var t_bodyend = new Date().getTime();                        
          BOOMR.plugins.RT.setTimer("t_head", t_headend - t_pagestart).
                           setTimer("t_body", t_bodyend - t_headend).  
                           setTimer("t_js", t_bodyend - t_jsstart);    
        </script>
      </body>
    </html>
{% endhighlight %}

<div id="results">
</div>

{% raw %}
<script type="text/javascript">
BOOMR.plugins.RT.startTimer("t_howtojs");
</script>
<script src="howtos.js" type="text/javascript"> </script>
<script type="text/javascript">
BOOMR.plugins.RT.endTimer("t_howtojs").endTimer("t_body");
</script>
{% endraw %}
