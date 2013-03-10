---
layout: default 
title: Boomerang Howto 1b 
---

User clicks a link on a page we control and page is usable at some developer determined point
---------------------------------------------------------------------------------------------

See [use case \#1](../use-cases.html#uc-1) for a description of this
requirement.

We use two pages for this use case. They may be any two pages on your
site, and the code you put into them is identical, so you could just put
it on all pages on your site. Unlike case 1a, in this case, we do not
allow the beacon to fire when the onload event fires. Instead, we fire
the `page_ready` event when we determine that the page is ready. We also
set the `autorun` parameter to false to stop boomerang from running
automatically.

1.  Copy boomerang.js and the images/ directory into your document root
2.  Add the code below to all your pages. You may add it at any point
    before your page is considered complete.

{% highlight javascript %}
    <script src="boomerang.js" type="text/javascript"></script>
    <script type="text/javascript">
    BOOMR.init({
            user_ip: "<user's ip address>",
            beacon_url: "http://yoursite.com/path/to/beacon.php",
            autorun: false
        });
    </script>
{% endhighlight %}

The rest of your page will load normally. When you determine (through
javascript, perhaps) that your page is usable by a user browsing your
website, you need to fire the `page_ready` event like this:

{% highlight javascript %}
    BOOMR.page_ready(); // Tell boomerang that the page is now usable
{% endhighlight %}

As in howto-1a, you need to populate the `user_ip` field using a back
end programming language.

Go to [Page \#2](howto-1b-page%232.html) now to see the results of the
page load test.

The latest code and docs is available on
[github.com/lognormal/boomerang](http://github.com/lognormal/boomerang/)


