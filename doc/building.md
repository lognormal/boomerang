Boomerang is split into the main framework (`boomerang.js`) and plugins (`plugins/*.js`).

`boomerang.js` on its own will not do anything interesting.  To enable performance
measurements of your site, you will want to include several plugins.

<a name="choosing-plugins"></a>

## Choosing Plugins

Each plugin lives on its own in the `plugins/` directory.  Plugins are split into
core measurement components, though some depend on each other.

The default set of plugins for a "full" build of Boomerang can be seen in `plugins.json`
in the root directory.  You can modify this file to choose which plugins you want for
measurement.

You can read about each plugin in its documentation.  Here is a basic description
of each plugin:

* {@link BOOMR.plugins.History BOOMR.plugins.Angular} enables support for measuring AngularJS websites (now part of the {@link BOOMR.plugins.History} plugin)
* {@link BOOMR.plugins.AutoXHR} tracks `XMLHttpRequest`s and other in-page interactions
* {@link BOOMR.plugins.History BOOMR.plugins.Backbone} enables support for measuring Backbone.js websites (now part of the {@link BOOMR.plugins.History} plugin)
* {@link BOOMR.plugins.BFCache} measures BFCache navigations
* {@link BOOMR.plugins.BW} measures HTTP bandwidth
* {@link BOOMR.plugins.CACHE_RELOAD} forces the browser to update its cached copy of boomerang
* {@link BOOMR.plugins.Clicks} tracks in-page clicks
* {@link BOOMR.plugins.ConsentInlinedPlugin} allows for Opt-In and Opt-Out via user consent
* {@link BOOMR.plugins.Continuity} measures user-experience metrics such as Time to Interactive, Cumulative Layout Shift, Rage Clicks, etc
* {@link BOOMR.plugins.CT} tests whether a script was cached
* {@link BOOMR.plugins.DNS} measures DNS latency
* {@link BOOMR.plugins.Early} allows sending pre-Page Load beacons to ensure all page loads are tracked
* {@link BOOMR.plugins.History BOOMR.plugins.Ember} enables support for measuring Ember.js websites (now part of the {@link BOOMR.plugins.History} plugin)
* {@link BOOMR.plugins.Errors} adds JavaScript error tracking
* {@link BOOMR.plugins.EventTiming} measures user input events via the EventTiming API such as First Input Delay (FID)
* {@link BOOMR.plugins.GUID} adds a unique ID for each session
* {@link BOOMR.plugins.IPv6} measures various IPv6 metrics
* {@link BOOMR.plugins.IFrameDelay} allows delaying the page load measurements until IFRAMEs are loaded
* {@link BOOMR.plugins.History} enables support for measuring React and other `window.history` websites
* {@link BOOMR.plugins.Memory} captures browser memory metrics
* {@link BOOMR.plugins.Mobile} captures mobile connection type
* {@link BOOMR.plugins.NavigationTiming} captures NavigationTiming data
* {@link BOOMR.plugins.PaintTiming} captures paint events such as First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
* {@link BOOMR.plugins.ResourceTiming} captures ResoureTiming (waterfall) data
* {@link BOOMR.plugins.RT} captures round-trip (load) performance
* {@link BOOMR.plugins.SPA} is required by any of the SPA plugins
* {@link BOOMR.plugins.TPAnalytics} adds third-party analytics IDs to the beacon
* {@link BOOMR.plugins.UserTiming} captures all UserTiming marks and measures

There are also a few utility plugins:

* {@link BOOMR.utils.Compression} is used by some plugins for compressing their data
* {@link BOOMR_mq} adds a "method queue" API for Boomerang

To monitor basic page load performance for a traditional website, we would recommend:

* {@link BOOMR.plugins.RT}
* {@link BOOMR.plugins.NavigationTiming} captures NavigationTiming data

To monitor a Single Page App website, we would additionally recommend the following:

* {@link BOOMR.plugins.AutoXHR}
* {@link BOOMR.plugins.SPA}
* {@link BOOMR.plugins.History}

See the [build flavors](#build-flavors) section below for suggested ways of building Boomerang.

## Including Boomerang on your site

boomerang can be included on your page in one of two ways: [synchronously](#synchronously) or [asynchronously](#asynchronously).

The asynchronous method is recommended.

After the core JavaScript files are loaded, you will need to call {@link BOOMR.init}
to initialize Boomerang and all of its plugins.  See each plugin's documentation
for the available configuration options.

<a name="synchronously"></a>

## The simple synchronous way

Simply include `boomerang.js` and any desired plugins as a `<script>` tag.

```html
<script src="boomerang.js"></script>
<script src="plugins/rt.js"></script>
<!-- any other plugins you want to include -->
<script>
  BOOMR.init({
    beacon_url: "http://yoursite.com/beacon/"
  });
</script>
```

Each plugin has its own configuration as well -- these configuration options
should be included in the `BOOMR.init()` call:

```html
BOOMR.init({
  beacon_url: "http://yoursite.com/beacon/",
  ResourceTiming: {
    enabled: true,
    clearOnBeacon: true
  }
});
```

<a name="asynchronously"></a>

## The faster, more involved, asynchronous way

Loading boomerang asynchronously ensures that even if `boomerang.js` is
unavailable (or loads slowly), your host page will not be affected.

### 1. Add a plugin to init your code

Create a plugin (or use the sample `zzz-last-plugin.js`) with a call to `BOOMR.init`:

```javascript
BOOMR.init({
  config: parameters,
  ...
});
BOOMR.t_end = new Date().getTime();
```

You could also include any other code you need.  For example, you could include
a timer to measure when boomerang has finished loading (as above).

### 2. Build boomerang

The build process bundles `boomerang.js` and all of the plugins listed in
`plugins.json` (in that order).

If you want to have a custom set of plugins, you can create a `plugins.user.json` and that file will be used instead (this file is excluded from this repository's Git).

To build boomerang with all of your desired plugins, you would run:

```bash
grunt clean build
```

This creates a deployable boomerang in the `build` directory, e.g.
`build/boomerang-<version>.min.js`.

Install this file on your web server or origin server where your CDN can pick it
up.  Set a far future [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) header for it.  This file will never change.

## The Build Process

Build requires [NodeJS](https://nodejs.org/) to execute [Grunt.js](https://gruntjs.com/)
to build Boomerang.

To install Grunt globally:

```bash
npm install -g grunt-cli
```

You can get a full build of boomerang by running the following:

```bash
grunt clean build
```

The main build targets are:

* `clean` cleans the `build/` directory
* `build` builds a new version of Boomerang from scratch
* `lint` runs lint on the project
* `test` runs {@tutorial tests}

A full list of build targets are avaialble in `Gruntfile.js`.

Grunt build options:

* `--build-number` Specifies the minor build number
* `--build-revision` Specifies the revision build number

## Build Numbers

Boomerang follows [SemVer](http://semver.org/):

```text
major.minor.revision
```

For each build of Boomerang, the major build version is specified in `package.json` as
`releaseVersion`.

The minor version defaults to 0.  Each build can then specify its `--build-number` to
change the minor version.

The revision defaults to 0.  Each build can then specify its `--build-revision`
to change the revision.

## Build Flavors

By default Boomerang will bundle all plugins defined in `plugins.json` (under the top-level `"plugins": []` key) into the build.

It is recommended that you tune your build to include just the plugins/features you need, so you can reduce the size and complexity of the Boomerang build.

Some guidance on choosing plugins is [above](#choosing-plugins), but Boomerang also defines a few "flavors" of builds that bundle common plugins together.

These flavors are also defined in `plugins.json` under the `"flavors": {}` key.

For example, here's a definition of the **"minimal"** build we recommend:

```json
"minimal": {
    "comment": "Minimal recommended plugins",
    "revision": 10,
    "plugins": [
        "plugins/rt.js",
        "plugins/navtiming.js"
    ]
},
```

For each flavor, the `"plugins": []` key lists which plugins apply to that flavor.

To build Boomerang with a specific flavor, you can add a `--build-flavor=` argument to grunt:

```bash
grunt clean build --build-flavor=minimal --build-number=1000
```

The resulting output file will be set to the specified Revision in the `"revision"` field above, e.g. `1.1000.10` for the `minimal` flavor.

You can also create a `plugins.user.json` file and that will be used instead of `plugins.json` (this file is excluded from this repository's Git).
