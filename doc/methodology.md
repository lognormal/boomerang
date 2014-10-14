---
layout: default
title: Boomerang methodology
---

# So how does this thing work?

## 1. Roundtrip measurements

We define round trip time as the time taken from the user initiating a resource request
to when that resource is completely available for the user to interact with.  We limit
our measurements only to HTML page type resources.

The round trip time is therefore the time from the user clicking on a link to the page
referenced by that link becoming usable by the user.  For most cases, this is as good
as measuring the time from the previous page's onbeforeunload event firing to the current
page's onload event firing.  In some cases this may be different, but we let the
developer determine those events.

This is how we measure.

### 1.1 attach a function to the <code>window.onbeforeunload, document.onmouseup</code> (only activated for links) and <code>form.onsubmit</code> (for all forms on the page) events.

Inside the last invocation of this function, we take a time reading (in milliseconds) and store it
into a session cookie along with the URL of the current page or the URL of any clicked link or submitted form.

### 1.2 attach a function to the window.onunload (non-Safari) and window.onpagehide (Safari) events.

We take a time reading in this function as well, and store it in the session cookie.

### 1.2 attach a function to the <code>window.onload</code> event.

Inside this function, we take a time reading (in milliseconds) and call this <code>rt.end</code>

If the browser has implemented the <a href="http://dev.w3.org/2006/webapi/WebTiming/">WebTiming</a> API,
we pull out <code>navigationStart</code> (or <code>fetchStart</code> if <code>navigationStart</code>
is unset).  To get around a bug in Firefox 7 and 8, we use <code>unloadEventStart</code> instead.

If the WebTiming API is not supported, we look for the cookie where we wrote the start time, and if found,
use that. This time is set to <code>rt.tstart</code>. If we find neither, we abort <a href="#fn-1" class="fn">[1]</a>.

If we find a cookie, we check the URL stored in the cookie with the <code>document.referrer</code>
of the current document if it was set via <code>onbeforeunload</code> or the URL of the current page if
the cookie was set via <code>onmouseup</code> or <code>onsubmit</code>. If these two differ, it means that
the user possibly visited a third party page in between the two pages from our site and the measurement
is invalid, so we abort <a href="#fn-2" class="fn">[2]</a>.

If we're still going, we pull the time out of the cookie and remove the cookie.  We
measure the difference in the two times (<code>rt.end - rt.tstart</code>) and this is
the round trip time for the page.

If the WebTiming API is supported, we check the value of <code>responseStart</code>. If not, we use the time of the
<code>onunload</code> or <code>onpagehide</code> events stored in the cookie, and use this as a proxy for first byte
time (<code>t_fb_approx</code>). With this, we can calculate the following entities:

<code>t_done</code> Roundtrip time: <code>rt.end - rt.tstart</code>
<code>t_resp</code> Backend time: <code>(responseStart || t_fb_approx) - rt.tstart</code>
<code>t_page</code> Frontend time: <code>rt.end - (responseStart || t_fb_approx)</code>

## 2. Bandwidth &amp; Latency measurements

Bandwidth and latency are measured by downloading fixed size images from a server
and measuring the time it took to download them.  We run it in the following order:

### 2.1 First download a 32 byte gif 10 times serially.  This is used to measure latency

We discard the first measurement because that pays the price for the TCP handshake
(3 packets) and TCP slow-start (4 more packets).  All other image requests take
two TCP packets (one for the request and one for the response).  This gives us a
good idea of how much time it takes to make an HTTP request from the browser to
our server.

Once done, we calculate the arithmetic mean, standard deviation and standard error
at 95% confidence for the 9 download times that we have.  This is the latency number
that we beacon back to our server.


### 2.2 Next download images of increasing size until one of the times out

We choose image sizes so that we can narrow down on a bandwidth range as soon as
possible.  See the code comments in <a href="../plugins/bw.js">plugins/bw.js</a> for
full details.

Image timeouts are set at between 1.2 and 1.5 seconds.  If an image times out, we
stop downloading larger images, and retry the largest image 4 more times<a href="#fn-3" class="fn">[3]</a>.
We then calculate the bandwidth for the largest 3 images that we downloaded.  This
should result in 7 readings unless the test timed out before that <a href="#fn-4" class="fn">[4]</a>.
We calculate the median, standard deviation and standard error from these values
and this is the bandwidth that we beacon back to our server.


The latest code and docs is available on <a href="http://github.com/lognormal/boomerang/">github.com/lognormal/boomerang</a>

### Footnotes:

1. We don't actually abort at this point, but give the developer the ability to
salvage the moment by setting his/her own start time.  This is most useful when the
developer isn't measuring full page load time, but possibly the load time of some
dynamic content loaded via JavaScript.

2. We offer the developer the ability to not abort at this point, but instead
pass all URLs to the back end and let the server decide whether to discard the
beacon or not.  This is useful for sites that have a login page behind SSL and
possibly redirect to the login page if the user clicks on certain links.  In this
case there might either be no referrer, or the referrer may not match.

3. This value is configured using the <code>BW.nruns</code> parameter.  See

4. The bandwidth test times out after 15 seconds.  At that point it will try to
determine the bandwidth based on data that it has already collected.
