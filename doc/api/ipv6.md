---
layout: default
title: How to do stuff with boomerang
---

[All Docs](../) | [Index](index.html)

IPv6 plugin API
===============

**Note:** The IPv6 plugin hasn't been tested. Your help in testing it is
appreciated.

The IPv6 plugin measures various IPv6 related metrics. It is
encapsulated within the `BOOMR.plugins.IPv6` namespace. This plugin
tries to do a few things:

-   Check if the client can connect to an ipv6 address
-   Check if the client can resolve DNS that points to an ipv6 address
-   Check latency of connecting to an ipv6 address
-   Check avg latency of doing dns lookup to an ipv6 address (not
    worstcase)

This plugin needs a server that has an IPv6 address, and a DNS name to
point to it. Additionally, the server needs to be configured to serve
content requested from the IPv6 address and should not require a virtual
host name. This means that you probably cannot use shared hosting that
puts multiple hosts on the same IP address.

Configuration {#config}
-------------

All configuration parameters are within the IPv6 namespace.

ipv6\_url
:   An image URL referenced by its IPv6 address, eg,
    `http://fe80::1/image-i.png`. If not specified, the test will abort.

host\_url
:   **[recommended]** An image URL on an IPv6 only host referenced by
    its DNS hostname. The hostname should not resolve to an IPv4
    address. If not specified, the host test will be skipped.

timeout
:   **[optional]** The time, in milliseconds, that boomerang should wait
    for a network response before giving up and assuming that the
    request failed. The default is 1200ms.

Methods
-------

init(oConfig)
:   Called by the [BOOMR.init()](BOOMR.html#init) method to configure
    the DNS plugin. See the [Configuration section](#config) for
    details.

{% highlight javascript %}
    BOOMR.init({
          IPv6: {
              ipv6_url: "http://fe80::1/images/image-i.png"
              host_url: "http://yoursite-6.com/images/image-i.png"
          }
        });
{% endhighlight %}

    ### Returns

    a reference to the `BOOMR.plugins.IPv6` object, so you can chain
    methods.

    ### Note

    The IPv6 test will not run if a `ipv6_url` is not configured.

is\_complete()
:   Called by [BOOMR.sendBeacon()](BOOMR.html#sendBeacon) to determine
    if the IPv6 plugin has finished what it's doing or not.

    ### Returns

    -   `true` if the plugin has completed.
    -   `false` if the plugin has not completed.

Beacon Parameters {#beacon}
-----------------

This plugin adds two parameters to the beacon, both prefixed with
`ipv6_`:

ipv6\_latency

Latency in milliseconds of getting data from an ipv6 host when
connecting to the IP. Will be set to NA if the client cannot connect to
the ipv6 host.

ipv6\_lookup

Latency of getting data from a hostname that resolves to an ipv6
address. Will be set to NA if the client cannot resolve or connect to
the ipv6 host.
