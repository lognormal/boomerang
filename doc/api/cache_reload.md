---
layout: default
title: Cache Reload plugin API
---

[All Docs](../) | [Index](index.html)

Cache Reload plugin API
=======================

The cache reload plugin forces the browser to update its cached copy of
boomerang. Details are on the lognormal blog
[here](http://www.lognormal.com/blog/2012/06/05/updating-cached-boomerang/ "Updating Cached Boomerang")
and
[here](http://www.lognormal.com/blog/2012/06/17/more-on-updating-boomerang/ "More on updating cached boomerang").

Configuration {#config}
-------------

The Cache Reload plugin's configuration is under the `CACHE_RELOAD`
namespace. The full configuration object is described in [Howto \#6 —
Configuring boomerang](../howtos/howto-6.html).

url
:   **[required]** By default, this is set to the empty string, which
    has the effect of disabling the Cache Reload plugin. Set the `url`
    parameter to the url that will do handle forcing the reload. See the
    example below for what this url's output should look like.

Methods
-------

init(oConfig)

Called by the [BOOMR.init()](BOOMR.html#init) method to configure the
cache reload plugin.

### Parameters

oConfig
:   The configuration object passed in via `BOOMR.init()`. See the
    [Configuration section](#config) for details.

    ### Returns

    a reference to the `BOOMR.plugins.CACHE_RELOAD` object, so you can
    chain methods.

is\_complete()
:   Called by [BOOMR.sendBeacon()](BOOMR.html#sendBeacon) to determine
    if the bandwidth plugin has finished what it's doing or not. This
    method always returns true.

    ### Returns

    -   `true`.

Beacon Parameters {#beacon}
-----------------

This plugin does not add any parameters to the beacon.

Example HTML document {#example}
---------------------

The cache reloading HTML document should look something like this:

    ```html
    <!doctype html>
    <html>
    <head>
    <script src="boomerang.js"></script>
    </head>
    <body>
    <script>
    // required version needs to be passed in as a query string parameter
    // like v=0.9.123456789

    var boom_ver = BOOMR.version.split('.'),
        reqd_ver = location.search.replace(/.*v=([0-9\.]+).*/, '$1').split('.');
    if (    (boom_ver[0] < reqd_ver[0])      // javascript will do type coercion
         || (boom_ver[0] == reqd_ver[0] && boom_ver[1] < reqd_ver[1])
         || (boom_ver[0] == reqd_ver[0] && boom_ver[1] == reqd_ver[1] && boom_ver[2] < reqd_ver[2])
    )
    {
        location.reload(true);
    }
    </script>
    </body>
    </html>
    ```
