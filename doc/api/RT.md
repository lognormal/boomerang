---
layout: default
title: Roundtrip plugin API
---

[All Docs](../) | [Index](index.html)

Roundtrip plugin API
====================

The roundtrip plugin measures page load time, or other timers associated
with the page. Its API is encapsulated within the `BOOMR.plugins.RT`
namespace.

Configuration {#config}
-------------

All roundtrip plugin configuration items are under the `RT` namespace.
The full configuration object is described in [Howto \#6 — Configuring
boomerang](../howtos/howto-6.html).

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

Methods
-------

init(oConfig)

Called by the [BOOMR.init()](BOOMR.html#init) method to configure the
roundtrip plugin.

### Parameters

oConfig
:   The configuration object passed in via `BOOMR.init()`. See the
    [Configuration section](#config) for details.

    ### Returns

    a reference to the `BOOMR.plugins.RT` object, so you can chain
    methods.

startTimer(sName, [nValue])
:   Starts the timer named `sName`. Timers count in milliseconds. You
    must call `endTimer()` when this timer has complete for the
    measurement to be recorded in boomerang's beacon.

    If passed in, the optional second parameter `nValue` is the
    timestamp in milliseconds to set the timer's start time to. This is
    useful if you need to record a timer that started before boomerang
    was loaded up.

    ### Parameters:

    sName
    :   The name of the timer to start
    nValue
    :   **[optional]** A javascript timestamp value (milliseconds since
        the epoch). If set, the timer's start time will be set
        explicitly to this value. If not set, the current timestamp is
        used. You'd use this parameter if you measured a timestamp
        before `boomerang` was loaded and now need to pass that value to
        the roundtrip plugin.

    ### Example:

    See [Howto \#4](../howtos/howto-4.html) for an example that uses
    startTimer and endTimer.

    ### Returns

    a reference to the `BOOMR.plugins.RT` object, so you can chain
    methods.

    ### Note

    Calling `startTimer("t_page")` has the side-effect of calling
    `endTimer("t_resp")`. These timers are generally used to measure the
    time from (as close to) the first byte loaded to `onload` (`t_page`)
    and from `onbeforeunload` to the first byte time (`t_resp`). You do
    not need to explicitly call `startTimer("t_resp")`.

endTimer(sName, [nValue])
:   Stops the timer named `sName`. It is not necessary for the timer to
    have been started before you call `endTimer()`. If a timer with this
    name was not started, then the unload time of the previous page is
    used instead. This allows you to measure the time across pages.

    ### Parameters:

    sName
    :   The name of the timer to stop
    nValue
    :   **[optional]** A javascript timestamp value (milliseconds since
        the epoch). If set, the timer's stop time will be set explicitly
        to this value. If not set, the current timestamp is used. You'd
        use this parameter if you measured a timestamp before
        `boomerang` was loaded and now need to pass that value to the
        roundtrip plugin.

    ### Example:

    See [Howto \#4](../howtos/howto-4.html) for an example that uses
    startTimer and endTimer.

    ### Returns

    a reference to the `BOOMR.plugins.RT` object, so you can chain
    methods.

setTimer(sName, nValue)
:   Sets the timer named `sName` to an explicit time measurement. You'd
    use this method if you measured time values within your page before
    `boomerang` was loaded and now need to pass those values to the
    roundtrip plugin for inclusion in the beacon. It is not necessary to
    call `startTimer()` or `endTimer()` before calling `setTimer()`. If
    you do, the old values will be ignored and the value passed in to
    this function will be used.

    ### Parameters:

    sName
    :   The name of the timer to set
    nValue
    :   The value in milliseconds to set this timer to.

    ### Returns

    a reference to the `BOOMR.plugins.RT` object, so you can chain
    methods.

done()
:   Typically called automatically when boomerang's
    [page\_ready](BOOMR.html#page_ready) event fires, but it may also be
    called explicitly to measure the load time of transitions that do
    not involve a onload event.

    This method calculates page load time, and determines whether the
    values we have are good enough to be beaconed. It then signals the
    `BOOMR` object via its [sendBeacon](BOOMR.html#sendBeacon) method.

    ### Example:

    See [Howto \#2](../howtos/howto-2.html) for an example of explicitly
    calling the `done()` method.

    ### Returns

    a reference to the `BOOMR.plugins.RT` object, so you can chain
    methods.

    ### See also

    -   [Roundtrip methodology](../methodology.html#roundtrip) for
        details on how roundtrip time is measured.

is\_complete()
:   Called by [BOOMR.sendBeacon()](BOOMR.html#sendBeacon) to determine
    if the roundtrip plugin has finished what it's doing or not.

    ### Returns

    -   `true` if the plugin has completed.
    -   `false` if the plugin has not completed.

Beacon Parameters {#beacon}
-----------------

This plugin adds the following parameters to the beacon:

t\_done
:   **[optional]** Perceived load time of the page.

t\_page
:   **[optional]** Time taken from the head of the page to page\_ready.

t\_resp
:   **[optional]** Time taken from the user initiating the request to
    the first byte of the response.

t\_other
:   **[optional]** Comma separated list of additional timers set by page
    developer. Each timer is of the format `name|value`

t\_load
:   **[optional]** If the page were prerendered, this is the time to
    fetch and prerender the page.

t\_prerender
:   **[optional]** If the page were prerendered, this is the time from
    start of prefetch to the actual page display. It may only be useful
    for debugging.

t\_postrender
:   **[optional]** If the page were prerendered, this is the time from
    prerender finish to actual page display. It may only be useful for
    debugging.

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
