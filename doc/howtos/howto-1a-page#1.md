---
layout: default 
title: Boomerang Howto 1a 
---

User clicks a link on a page we control and page is usable when onload fires
----------------------------------------------------------------------------

See [use case \#1](../use-cases.html#uc-1) for a description of this
requirement.

We use two pages for this use case. They may be any two pages on your
site, and the code you put into them is identical, so you could just put
it on all pages on your site. Assuming you're starting out with nothing,
this is what you do:

1.  Copy boomerang.js and the images/ directory into your document root
2.  Add the code below to all your pages:

{% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
            user_ip: "<user's ip address>",
            beacon_url: "http://yoursite.com/path/to/beacon.php"
        });
    </script>
{% endhighlight %}

This should be sufficient to measure page load time on all but the very
first page that a user visits on your site. You'll need to get the
user's IP address using some server-side programming language like PHP,
Python or C\#. This is necessary in order to save bandwidth calculations
across requests, and makes it a little easier on your users.

Go to [Page \#2](howto-1a-page%232.html) now to see the results of the
page load test.

More complex sites
------------------

If you've been doing this website thing for a while, chances are that
you use a CDN to host your javascript, and have several subdirectories
with pages. If you do that, then change the link to `boomerang.js` above
to point to the absolute location of that file. You will also need to
tell boomerang where to find its bandwidth testing images. Your `init()`
call will then change to this:

{% highlight javascript %}
    BOOMR.init({
            user_ip: "<user's ip address>",
            beacon_url: "http://yoursite.com/path/to/beacon.php",
            BW: {
                base_url: "http://yoursite.com/path/to/bandwidth/images/"
            }
        });
{% endhighlight %}

Note, that you point to the image directory. It is recommended that you
put these images on a server that you want to measure the user's
bandwidth and latency to. In most cases this will be your own server,
however, there may be cases where you'd want to put them on a CDN and
measure bandwidth and latency to those servers instead. This decision is
left up to you. We recommend putting them on your own server.

Go to [Page \#2](howto-1a-page%232.html) now to see the results of the
page load test.

The latest code and docs is available on
[github.com/lognormal/boomerang](http://github.com/lognormal/boomerang/)


