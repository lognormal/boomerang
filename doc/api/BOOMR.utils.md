---
layout: default
title: How to do stuff with boomerang
---

[All Docs](../) | [Index](index.html)

BOOMR utility functions
=======================

All boomerang utility functions are under the `BOOMR.utils` namespace.
To access any of the following, dereference the BOOMR.utils object. eg:
use `BOOMR.utils.getCookie()` to call the `getCookie()` method.

Methods
-------

getCookie(sName)
:   Gets the value of the cookie identified by `sName`.

    ### Returns

    -   A string containing the cookie identified by `sName`. This may
        be the empty string.
    -   `null` if the cookie wasn't found or if `sName` was empty.

setCookie(sName, oSubCookies, nMaxAge, sPath, sDomain, bSecure)
:   Sets the cookie named `sName` to the serialized value of
    `oSubCookies`.

    ### Parameters:

    sName
    :   The name of the cookie

    oSubCookies
    :   key/value pairs to write into the cookie. These will be
        serialized as an & separated list of URL encoded key=value
        pairs.

    nMaxAge
    :   Lifetime in seconds of the cookie. Set this to 0 to create a
        session cookie that expires when the browser is closed. If not
        set, defaults to 0.

    sPath
    :   The HTTP path that the cookie should be valid for. The cookie
        will be sent to all URLs on this domain that fall below sPath.
        If not set, defaults to the path of the current document. Unless
        you're on a server where multiple users share the same domain,
        you probably want to set this to /

    sDomain
    :   The HTTP domain that the cookie should be vali for. The cookie
        will be sent to all URLs that are subdomains of this domain. If
        not set, defaults to the current document's domain. If set to
        `null`, it will use the value of `site_domain` that was
        configured during the call to [BOOMR.init()](BOOMR.html#init).
        You probably want to set this to `null`.

    bSecure
    :   If set to true, then this cookie is only sent to HTTPS URLs. If
        set to false (or not set), this cookie is sent to all URLs that
        match the above rules. Unless your site is completely SSL based,
        you can leave this unset.

    Note that the entire cookie name and value needs to be less than
    4000 characters.

    ### Example:

    The `BOOMR.plugins.RT` plugin uses this function like this:

{% highlight javascript %}
        if(!BOOMR.utils.setCookie(
                    impl.cookie,
                    { s: t_start, r: url },
                    impl.cookie_exp,
                    "/",
                    null
                )) {
            BOOMR.error("cannot set start cookie", "rt");
            return this;
        }
{% endhighlight %}

    ### Returns

    -   `true` if the cookie was set successfully
    -   `false` if the cookie was not set successfully

getSubCookies(sCookie)
:   Parse a cookie string returned by `getCookie()` and split it into
    its constituent subcookies.

    ### Example:

    The `BOOMR.plugins.BW` plugin calls this function like this:

{% highlight javascript %}
        var cookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(impl.cookie));
{% endhighlight %}

    ### Returns

    -   On success, an object of key/value pairs of all sub cookies.
        Note that some subcookies may have empty values.
    -   `null` if `sCookie` was not set or did not contain valid
        subcookies.

removeCookie(sName)
:   Removes the cookie identified by `sName` by nullifying its value,
    and making it a session cookie.

    ### Returns

    Nothing useful.

pluginConfig(oImpl, oConfig, sName, aProperties)
:   Convenience method that plugins can call to configure themselves
    with the config object passed in to their `init()` method.

    ### Parameters:

    oImpl
    :   The plugin's impl object within which it stores all its
        configuration and private properties

    oConfig
    :   The config object passed in to the plugin's `init()` method.

    sName
    :   The plugin's name in the `BOOMR.plugins` object.

    aProperties
    :   An array containing a list of all configurable properties that
        this plugin has.

    ### Example:

    The `BOOMR.plugins.RT` plugin uses this method like this:

{% highlight javascript %}
        BOOMR.utils.pluginConfig(impl, config, "RT", ["cookie", "cookie_exp", "strict_referrer"]);
{% endhighlight %}

    ### Returns

    -   `true` if at least one property was set.
    -   `false` if no properties were set or if the oConfig object was
        not set.
