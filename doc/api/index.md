---
layout: default
title: The boomerang API
---

[All Docs](../)

The boomerang API
=================

core
----

-   [BOOMR](BOOMR.html) — The basic beaconing object.
-   [BOOMR.utils](BOOMR.utils.html) — Utility functions within the BOOMR
    object.

plugins
-------

-   [BOOMR.plugins.RT](RT.html) — The roundtrip plugin that measures
    page load time.
-   [BOOMR.plugins.BW](BW.html) — The bandwidth plugin that measures
    connection bandwidth and latency.
-   [BOOMR.plugins.DNS](DNS.html) — The DNS latency plugin that measures
    latency of the user's DNS.
-   [BOOMR.plugins.IPv6](ipv6.html) — The IPv6 latency plugin that
    measures various IPv6 related metrics.
-   [BOOMR.plugins.NavigationTiming](navtiming.html) — A plugin that
    collects performance data from user agents that implement the W3C
    Navigation Timing specification.
-   [BOOMR.plugins.CACHE\_RELOAD](cache_reload.html) — The Cache Reload
    plugin that forces a browser to update its cached version of
    boomerang.

The latest code and docs is available on
[github.com/lognormal/boomerang](http://github.com/lognormal/boomerang/)
