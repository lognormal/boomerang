---
layout: default
title: DNS latency plugin API
---

[All Docs](../) | [Index](index.html)

DNS latency plugin API
======================

**Note:** The DNS plugin hasn't been tested. Your help in testing it is
appreciated.

The DNS plugin measures the latency of DNS lookups from the user's
browser to your server. The DNS API is encapsulated within the
`BOOMR.plugins.DNS` namespace.

**Note** that the DNS plugin requires some amount of server-side set up.
See [Howto \#8](../howtos/howto-8.html) for details on how to set this
up.

Methods
-------

init(oConfig)
:   Called by the [BOOMR.init()](BOOMR.html#init) method to configure
    the DNS plugin. There is only one configurable option:

    base\_url
    :   **[required]** The `base_url` parameter tells the DNS plugin
        where it can find its DNS testing images. This URL must contain
        a wildcard character which will be replaced with a random
        string. The images will be appended to this string without any
        other modification. If you have any pages served over HTTPS,
        then this URL should be configured to work over HTTPS as well as
        HTTP. The protocol part of the URL will be automatically changed
        to fit the current document.

```javascript
BOOMR.init({
        DNS: {
                    base_url: "http://*.yoursite.com/images/"
        }
    });
```

    In the above code, \* will be replaced with a random string.

    ### Returns

    a reference to the `BOOMR.plugins.DNS` object, so you can chain
    methods.

    ### Note

    The DNS test will not run if a `base_url` is not configured.

is\_complete()
:   Called by [BOOMR.sendBeacon()](BOOMR.html#sendBeacon) to determine
    if the DNS plugin has finished what it's doing or not.

    ### Returns

    -   `true` if the plugin has completed.
    -   `false` if the plugin has not completed.

Beacon Parameters {#beacon}
-----------------

This plugin adds the following parameter to the beacon:

dns.t
:   The worst-case DNS latency from the user's browser to your DNS
    server.
