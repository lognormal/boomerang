---
layout: default
title: Navigation Timing plugin API
---

[All Docs](../) | [Index](index.html)

Navigation Timing plugin API
============================

**Note:** The Navigation Timing plugin hasn't been tested. Your help in
testing it is appreciated.

The Navigation Timing plugin collects metrics collected by modern user
agents that support the [W3C Navigation
Timing](http://w3c-test.org/webperf/specs/NavigationTiming/)
specification. The Navigation Timing API is encapsulated within the
`BOOMR.plugins.NavigationTiming` namespace.

**Note** that the Navigation Timing plugin isn't included by default in
boomerang.js. See [Howto \#9](../howtos/howto-9.html) for details on how
to include the plugin in your boomerang deployment.

Methods
-------

init()
:   Called by the [BOOMR.init()](BOOMR.html#init) method to configure
    the Navigation Timing plugin. The Navigation Timing plugin doesn't
    require any configuration parameters, since it simply reads values
    out of the browser's `window.performance` object (if available) and
    adds them to the beacon query string.

    ### Returns

    a reference to the `BOOMR.plugins.NavigationTiming` object, so you
    can chain methods.

    ### Note

    If the user agent being examined doesn't implement the Navigation
    Timing spec, the plugin won't add any parameters to the beacon.

is\_complete()
:   Called by [BOOMR.sendBeacon()](BOOMR.html#sendBeacon) to determine
    if the Navigation Timing plugin has finished what it's doing or not.

    ### Returns

    -   `true` if the plugin has completed.
    -   `false` if the plugin has not completed.

Beacon Parameters {#beacon}
-----------------

The NavigationTiming plugin adds the following parameters to the beacon.
Each maps onto a attribute from the browser's NavigationTiming API.

<table>
  <tr>
    <th>Beacon parameter</th>
    <th>NavigationTiming attribute</th>
  </tr>
  <tr><td>nt_red_cnt</td><td>window.performance.navigation.redirectCount</td></tr>
  <tr><td>nt_nav_type</td><td>window.performance.navigation.type</td></tr>
  <tr><td>nt_nav_st</td><td>window.performance.timing.navigationStart</td></tr>
  <tr><td>nt_red_st</td><td>window.performance.timing.redirectStart</td></tr>
  <tr><td>nt_red_end</td><td>window.performance.timing.redirectEnd</td></tr>
  <tr><td>nt_fet_st</td><td>window.performance.timing.fetchStart</td></tr>
  <tr><td>nt_dns_st</td><td>window.performance.timing.domainLookupStart</td></tr>
  <tr><td>nt_dns_end</td><td>window.performance.timing.domainLookupEnd</td></tr>
  <tr><td>nt_con_st</td><td>window.performance.timing.connectStart</td></tr>
  <tr><td>nt_con_end</td><td>window.performance.timing.connectEnd</td></tr>
  <tr><td>nt_req_st</td><td>window.performance.timing.requestStart</td></tr>
  <tr><td>nt_res_st</td><td>window.performance.timing.responseStart</td></tr>
  <tr><td>nt_res_end</td><td>window.performance.timing.responseEnd</td></tr>
  <tr><td>nt_domloading</td><td>window.performance.timing.domLoading</td></tr>
  <tr><td>nt_domint</td><td>window.performance.timing.domInteractive</td></tr>
  <tr><td>nt_domcontloaded_st</td><td>window.performance.timing.domContentLoadedEventStart</td></tr>
  <tr><td>nt_domcontloaded_end</td><td>window.performance.timing.domContentLoadedEventEnd</td></tr>
  <tr><td>nt_domcomp</td><td>window.performance.timing.domComplete</td></tr>
  <tr><td>nt_load_st</td><td>window.performance.timing.loadEventStart</td></tr>
  <tr><td>nt_load_end</td><td>window.performance.timing.loadEventEnd</td></tr>
  <tr><td>nt_unload_st</td><td>window.performance.timing.unloadEventStart</td></tr>
  <tr><td>nt_unload_end</td><td>window.performance.timing.unloadEventEnd</td></tr>
  <tr><td>nt_ssl_st</td><td><strong>[optional]</strong> window.performance.secureConnectionStart</td></tr>
  <tr><td>nt_spdy</td><td><strong>[optional]</strong> 1 if page was loaded over SPDY, 0 otherwise</td></tr>
  <tr><td>nt_first_paint</td><td><strong>[optional]</strong> The time when the first paint happened.  On Internet Explorer, this is milliseconds since the epoch, while on Chrome this is seconds.microseconds since the epoch.  If you detect a decimal point in this number, multiply it by 1000 to compare it to the other timers.</td></tr>
</table>
