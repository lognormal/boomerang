These are some of the ways that one can use boomerang.  This will help us make sure the library
actually supports all possible use cases.

### 1. Measure a page's perceived performance.

We need the ability to measure the time the user thinks it took to load a page.  This is typically
the time between the user clicking a link (or entering a URL into the browser) and the page becoming
usable.

While it's easy enough to note the time when a user clicked a link if the link was on a page you
control, it's not easy to tell the exact moment when a user enters a URL into a browser and hits
enter.  We'll therefore only concentrate on link clicks on pages that we control.

One unknown is the time when a page becomes usable.  For most pages, this is when the onload event
fires, however, there may be pages on which the onload event fires before the page is actually
usable (eg, a lot of content loaded via javascript), or when the page becomes usable before the
onload event fires (eg, hidden resources downloaded via javascript at the bottom of the page).
In both these cases, the developer of the page has a better idea of when their page has become
usable, so they should have the ability to tell the library when to fire this event.

Breaking this into four separate use cases:


 - User clicks a link on a page we control and page is usable when onload fires<br>
   OR<br>
   User types in URL/clicks a bookmark or link on a page we don't control and our page is usable when onload fires and
   the user is using a browser that supports the [WebTiming](http://dev.w3.org/2006/webapi/WebTiming/)
   API (IE9+, Chrome, Firefox 7+).<br>

   See [HOWTO #1a](how-to/howto-1a-page_1.html)
   
 - User clicks a link on a page we control and page is usable at some developer determined point<br>
   OR<br>
   User types in URL/clicks a bookmark or link on a page we don't control and our page is usable at some developer determined point and
   the user is using a browser that supports the [WebTiming](http://dev.w3.org/2006/webapi/WebTiming/)
   API (IE9+, Chrome, Firefox 7+), but not in other browsers.
   
   See [HOWTO #1b](how-to/howto-1b-page_1.html)
   

### 2. Measure perceived performance of content loaded dynamically

Many websites might load content dynamically.  For example, images for a slide show or content for
tabs may be loaded via javascript.  A stock ticker may periodically refresh itself from a back end
web service using XHR, a webmail service may check with the server for new messages or download the
selected message using javascript, etc.

In all these cases the browser may not fire an event for when the download was initiated or completed
and the library will need to expose methods/events that the web developer can invoke when needed.

See [HOWTO #2](how-to/howto-2.html).

### 3. Measure a user's bandwidth along with page load time

Since users browse the web using different types of internet connections, it's not always possible
to aggregate page load times for multiple users to get an indication of a number that's
statistically representative for all users.  Knowing the user's bandwidth, however, allows us
to aggregate data from similar users and use these numbers as representative for users with that
type of network connection.

See [HOWTO #3](how-to/howto-3.html).


### 4. Measure more than just page load time

Many sites may be composed of separate components loaded from different back end services.  For
example, on my home page, I have widgets from dopplr, upcoming, twitter, delicious and flickr.
Now while it's important to have the overall page load time, which is what users perceive as my
page's performance, it can also be useful and instructive to measure the load time of each component
separately, but as part of the measurement for the entire page.  This allows us to then cut up
a page's load time into the load time for each of its components, and carry out statistical
analysis of each component in the context of its containing page.

To do this, the library needs to expose additional timers that the page developer can set.  These
timers should be beaconed back along with the overall page load time.

See [HOWTO #4](how-to/howto-4.html).


### 5. Measure HTTP latency

Network Latency is one of the largest contributors to page download time.  HTTP latency is typically
higher than simple ping time because it requires a few to-and-fro packets to estabilish a TCP
connection and make a HTTP request.  There's also overhead involved in HTTP request and response
headers that don't contribute to actual page content.

Measuring a user's HTTP latency provides a good indication of the impact that parallelising
component downloads can have on overall page load time.

See [HOWTO #3](how-to/howto-3.html).


### 6. Request/page tagging

When doing performance analysis, it is often useful to run an A/B test that compares the performance
of two or more different page designs.  Since these pages might all have the same URL, it becomes
necessary to add some additional information to the data beaconed back that identifies the page from
a series of tests.

The library should provide a method for the page developer to tag each page with additional information.

See [HOWTO #5](how-to/howto-5.html).


### 7. Measure DNS latency

DNS latency tells us how long it takes to make a DNS request.  This may be affected by various
factors including your web server's DNS configuration and TTL, and how an end user's ISP's DNS
servers are configured.  Measuring this latency gives us an indication of how many domains we
can safely lookup on a single page.  There's a trade-off between the number of DNS lookups we
can make and the parallelisability that multiple domains bring us.  HTTP latency and DNS latency
together can tell us where this point lies for our users.

See [HOWTO #8](how-to/howto-8.html).


### 8. Measure a random sample of users instead of all users

For high traffic sites, it's useful to only measure a random sample of requests rather than
every request that comes in.  We could either do the random sampling on the server side
and only serve the javascript on a subset of requests, or we could simplify the server,
and sample on the client side.

Client side sampling won't be as accurate as server side sampling since we don't share state
across clients, however we can still get a decently random sample.

See [TODO #1](TODO.html).


### 9. Protect the beacon from abuse

If you have a URL entry point, chances are that someone will abuse it, either intentionally
or accidentally.

For example, you design a site that you're happy with, and you include the boomerang javascript
in your code to measure performance.  The javascript beacons back to your server.  Now someone
comes along and really likes your design, so goes ahead and copies your HTML and sticks it on
their own server.  They change some of the text and images, but leave the javascript still
beaconing to your server.  You end up getting their beacons, which not only increase the load
on your server, but also messes with your measurements.

The second possibility is that some script kiddie notices the beacon URL on your site and starts
hitting it with a whole bunch of different combinations to try and exploit your server, or if
nothing else, to try and DoS you.

boomerang should be able to protect against these problems.

See [HOWTO #7](how-to/howto-7.html).


### 10. Collect browser WebTiming information

Modern browsers include support for the <a href="http://www.w3.org/TR/navigation-timing/">Navigation Timing</a> API
that contains a lot of performance timing information related to page loading.  The NavigationTiming plugin for
boomerang collects this information and adds it to the beacon.

See [HOWTO #9](how-to/howto-9.html).

The latest code and docs is available on [github.com/lognormal/boomerang](http://github.com/lognormal/boomerang/)
