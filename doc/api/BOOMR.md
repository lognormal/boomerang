---
layout: default
title: How to do stuff with boomerang
---

[All Docs](../) | [Index](index.html)

The BOOMR object
================

Everything in boomerang is accessed through the `BOOMR` object. Each
plugin has its own API, but is reachable through `BOOMR.plugins`. This
document describes the main `BOOMR` object.

To access any of the following, dereference the BOOMR object. eg: use
`BOOMR.version` to get the `version` string.

Properties
----------

version
:   The version number of the boomerang library. This is a string,
    formatted as major.minor.patchlevel. Standard version numbering
    rules apply

t\_start
:   The timestamp when the boomerang code showed up on the page.

t\_end
:   The timestamp when the boomerang code finished loading. Note, this
    will only be set if you used `make` to make a combined version of
    boomerang.

plugins
:   An object containing all plugins that have been added to boomerang.
    If you build your own plugin, it should be added to this object:

{% highlight javascript %}
        BOOMR.plugins.MyPlugin = {
            ...
        };
{% endhighlight %}

Configuration {#config}
-------------

Configuring boomerang is described in [Howto \#6 — Configuring
boomerang](../howtos/howto-6.html). Parameters relevant to the `BOOMR`
object are:

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
to get separate measurements across them.\
 Set this to a falsy value to disable all cookies.

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

    function log(oMessage, sLevel, sSource);

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
key is the name of the plugin. Each plugin's documentation will have
details on its configuration object.

Methods
-------

init(oConfig)
:   The init method that you to call to initialise boomerang. Call this
    method once after you've loaded the boomerang javascript. It accepts
    a single configuration object as a parameter. See the [Configuration
    section](#config) for details.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

page\_ready()
:   Method that fires the `page_ready` event. Call this only if you've
    set `autorun` to false when calling the `init()` method. You should
    call this method when you determine that your page is ready to be
    used by your user. This will be the end-time used in the page load
    time measurement.

    ### Example:

    See [Howto \#1b](../howtos/howto-1b-page%231.html) for an example of
    how to use this method.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

subscribe(sEvent, fCallbackFn, oCallbackData, oCallbackScope)
:   The subscribe method is used to subscribe an event handler to one of
    boomerang's [events](#events). It accepts four parameters:

    ### Parameters:

    sEvent
    :   The event name. This may be one of *page\_ready*,
        *page\_unload*, *before\_beacon*
    fCallbackFn
    :   A reference to the callback function that will be called when
        this event fires. The function's signature should be:

            function(oEventData, oCallbackData);

    oCallbackData
    :   **[optional]** object passed as the second parameter to the
        callback function
    oCallbackScope
    :   **[optional]** If set to an object, then the callback function
        is called as a method of this object, and all references to
        `this` within the callback function will refer to oCallbackScope

    The `page_ready` and `page_unload` events are most useful to plugins
    while the `before_beacon` event is useful to code that wants to do
    something with the beacon parameters before the beacon is fired. See
    the [events](#events) section for more details.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

addVar(sName, sValue) OR addVar(oVars)
:   Add one or more parameters to the beacon. This method is used by
    plugins to add parameters to the beacon, but may also be used by the
    page developer to tag the current request.

    ### Example:

    See [Howto \#5](../howtos/howto-5.html) for an example of using
    `addVar()`.

    This method may either be called with a single object containing
    key/value pairs, or with two parameters, the first is the variable
    name and the second is its value. All names should be strings usable
    in a URL's query string. We recommend only using alphanumeric
    characters and underscores, but you can use anything you like.
    Values should be strings (or numbers), and have the same
    restrictions as names.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

removeVar(sName, ...)
:   Removes one or more variables from the beacon URL. This is useful
    within a plugin to reset the values of parameters that it is about
    to set. It can also be used in a `before_beacon` handler to stop the
    beacon from being sent. See [Howto \#5](../howtos/howto-5.html) for
    how to do this.

    This method accepts either a list of variable names, or a single
    array containing a list of variable names.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

sendBeacon()
:   Request boomerang to send its beacon. Boomerang may ignore this
    request. When this method is called, boomerang checks all plugins.
    If any plugin has not completed its checks (ie, the plugin's
    `is_complete()` method returns false, then this method does nothing.
    If all plugins have completed, then this method fires the
    `before_beacon` event with all variables that will be sent on the
    beacon.

    After all `before_beacon` handlers return, this method checks if a
    `beacon_url` has been configured and if there are any beacon
    parameters to be sent. If both are true, it fires the beacon.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

log(sMessage, sLevel, sSource)
:   Log a `sMessage` to the configured logger with a level of `sLevel`.
    This method simply passes all logging information on to the
    configured logger. See [Howto \#6](../howtos/howto-6.html) for
    details on how to configure this.

    You probably want to use one of the convenience methods below
    instead that set the log level correctly.

    ### Returns

    nothing

debug(sMessage, sSource)
:   Log `sMessage` to the configured logger with a level of `debug`. If
    `sSource` is set, it is appended to the string "boomerang." and set
    as the source of the log message. Use this parameter to mention a
    plugin name and/or a line number/function name.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

info(sMessage, sSource)
:   Log `sMessage` to the configured logger with a level of `info`. If
    `sSource` is set, it is appended to the string "boomerang." and set
    as the source of the log message. Use this parameter to mention a
    plugin name and/or a line number/function name.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

warn(sMessage, sSource)
:   Log `sMessage` to the configured logger with a level of `warn`. If
    `sSource` is set, it is appended to the string "boomerang." and set
    as the source of the log message. Use this parameter to mention a
    plugin name and/or a line number/function name.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

error(sMessage, sSource)
:   Log `sMessage` to the configured logger with a level of `error`. If
    `sSource` is set, it is appended to the string "boomerang." and set
    as the source of the log message. Use this parameter to mention a
    plugin name and/or a line number/function name.

    ### Returns

    a reference to the `BOOMR` object, so you can chain methods.

Events
------

page\_ready
:   Fired when the page is usable by the user. By default this is fired
    when `window.onload` fires, but if you set `autorun` to `false` when
    calling `BOOMR.init()`, then you must explicitly fire this event by
    calling `BOOMR.page_ready()`.

    ### Callback

    No additional event data is passed to the callback function. Any
    callback data is passed as specified in the `subscribe()` method.

page\_unload
:   Fired just before the browser unloads the page. This is fired when
    `window.onbeforeunload` fires (`onunload` on Opera).

    ### Callback

    No additional event data is passed to the callback function. Any
    callback data is passed as specified in the `subscribe()` method.

visibility\_changed
:   Fired if the page's visibility state changes. Currently only
    supported on IE10 and Chrome.

    ### Callback

    No additional event data is passed to the callback function. Any
    callback data is passed as specified in the `subscribe()` method.

before\_beacon
:   Fired just before the beacon is sent to the server. You can stop the
    beacon from firing by calling `BOOMR.removeVar()` for all beacon
    parameters.

    ### Callback

    The callback function is called with two parameters. The first
    parameter is an object containing all parameters that will be added
    to the beacon. The second parameter is the callback data object that
    was passed in to the `subscribe()` method. If the callback function
    removes all parameters from boomerang, the beacon will not fire.

Beacon Parameters {#beacon}
-----------------

On its own, with no plugins set up, boomerang will send the following
parameters across through the beacon:

v
:   The version number of the boomerang library in use.

u
:   The URL of the page that sends the beacon.

Each plugin may add its own parameters, and these are specified in each
plugin's API docs.
