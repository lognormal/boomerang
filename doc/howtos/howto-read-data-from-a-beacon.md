While Boomerang excels at collecting Real User Monitoring performance metrics,
you'll probably want to do something with the data that it collects.

What can you do with the data?

## Beacon results back to your server

For most cases you'll want to send the collected performance data back to your
server or to the cloud so you can analyze it in aggregate.

The first thing you need to do is configure a url that beacon data will be sent to.

The beacon URL can be configured via the {@link BOOMR.init beacon_url} parameter
of {@link BOOMR.init}:

```html
<script src="boomerang.js"></script>
<script>
BOOMR.init({
  beacon_url: "http://yoursite.com/beacon/"
});
</script>
```

`beacon_url` should be a HTTP(s) endpoint that accepts beacon data encoded in
the query string (via `<IMG>` `GET` requests) and `application/x-www-form-urlencoded`
form data (via `POST` requests from `XMLHttpRequest` or `navigator.sendBeacon()`).

### Beacon Parameters

{@link BOOMR Boomerang} and each {@link BOOMR.plugins plugin} adds its own parameters to
the beacon.  Please refer to those documentation pages for details.

### Backend Servers

There are several open-source projects that can receive and analyze Boomerang data:

* [boomcatch](http://cruft.io/posts/introducing-boomcatch/)
* [boomerang-express](https://github.com/andreas-marschke/boomerang-express)
* [PIWIK](https://piwik.org/)

### Protecting the Beacon from Abuse

There are two types of beacon abuse you may need to protect against:

* Denial of Service (DoS) attacks
* Fake beacons that do not originate from a page you own

#### Denial of Service (DoS) attacks

There's nothing you can do in JavaScript to prevent Denial of Service (DoS) attacks,
but you can configure your server to rate limit beacons originating from a single
IP.  You typically shouldn't be receiving beacons faster than a user can navigate
through your website.  However, you may need to allow for multiple users originating
from the same proxy IP address.

You'll also want to do some operating system/web server level configuration to
detect abusive access patterns.  The majority of these are beyond the scope of
this document, but we have a few tips on building your back-end to protect you
from an attack.

One recommendation is to have a lightweight web server running as your beacon
endpoint, and have this server quickly log the request and immediately respond
without processing the data.  You can send a HTTP `204 No Content` response and
close the connection so there is minimal overhead.

Once the data is logged, you can periodically batch process and analyze the
incoming data.

More references for preventing DoS attacks:

* [learn-netowrking.com](http://learn-networking.com/network-security/how-to-prevent-denial-of-service-attacks)
* [wikipedia.org](http://en.wikipedia.org/wiki/Denial-of-service_attack)
* [cert.org](http://www.cert.org/tech_tips/denial_of_service.html)

#### Fake beacons that do not originate from a page you own

The most common reason for this kind of abuse is that someone liked your page
design and copied it to their own server, including the boomerang JavaScript --
only they didn't update the `beacon_url`, so it still beacons to your server.  You
probably don't want these beacons.

The easiest way to fix this is to just check the HTTP referrer of all requests and
block any that don't come from your own domain.  This works for the clueless
abuser case, but not for the intentional abuser.

The intentional abuser is someone who will try to exploit URLs on your site
to see if they can get something out of it.  What they try isn't really important --
there's only one legitimate way of using your beacon, and you should block all
other uses.  The best way to do this is through a
[nonce](http://en.wikipedia.org/wiki/Cryptographic_nonce) or a
[crumb](http://abhinavsingh.com/blog/2009/10/web-security-using-crumbs-to-protect-your-php-api-ajax-call-from-cross-site-request-forgery-csrfxsrf-and-other-vulnerabilities/).

This is a string that is valid for one use only.  It probably includes the
current timestamp and a validity period as part of its hash.  You generate it
on every page request and add it to Boomerang using {@link BOOMR.addVar}.

On your beacon endpoint, you then validate the nonce before accepting the beacon.

You can either include this nonce in your (non-cached) HTML page, or, fetch it
from your server via a `XMLHttpRequest`.

The nonce also doesn't protect you from someone pulling the beacon out of your
page (with a valid nonce), then modifying the beacon parameters and sending
it off to your server.  Protecting against this requires you to sign the
parameters in the beacon, but this isn't something that you can do in JavaScript
in a way that an attacker couldn't replicate.

## Read beacon data from JavaScript

You can get a notification of each beacon before it is sent by subscribing to
the {@link BOOMR#event:before_beacon before_beacon} event:

```javascript
BOOMR.subscribe('before_beacon', function(beaconData) {
  if (beaconData.u.indexOf("/some/page")) {
    // take some action based on the page
  }

  // you can still add data to the beacon at this point
  beaconData.someData = 1;
});
```

You can also get a notification of each beacon after it was sent by subscribing to
the {@link BOOMR#event:beacon beacon} event:

```javascript
BOOMR.subscribe('beacon', function(beaconData) {
  // remove beacon data that was only relevant for a single beacon
  BOOMR.removeVar('someData');
});
```

## References

* [IPC Berlin 2010 talk on MySQL scaling via Philip Tellis](http://www.slideshare.net/bluesmoon/scaling-mysql-writes-through-partitioning-ipc-spring-edition)

* [ConFoo 2010 talk on the statistics of web performance via Philip Tellis](http://www.slideshare.net/bluesmoon/index-3441823)
