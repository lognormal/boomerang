We welcome all Pull Requests, though we ask that you follow our guidelines for
new code:

## Contribution Check-List

1. Ensure your code passes the lint checks: `grunt lint`
2. Ensure your code passes all existing tests: `grunt test`
3. New code must be accompanied by new Unit or End-to-End {@tutorial tests}
4. [Open a Pull Request](github.com/akamai/boomerang/pulls) with a thorough
    description of your change

## Browser Compatibility

Boomerang is compatible with all browsers from Internet Explorer 5.5 through all
modern browsers.  While not all plugins work in older browsers, Boomerang should
still be able to execute in older browsers and not cause any script errors.

To ensure Boomerang works in as many browsers as possible, please pay attention
to the following guidelines:

1. Boomerang code should not directly rely on any EcmaScript 5 features.
2. Polyfills for utility functions (such as `Array.filter`) should **not** be added
   directly to the page.  Instead, add a {@link BOOMR.utils} utility
   function such as {@link BOOMR.utils.arrayFilter} that uses native interfaces when
   available, and when not, executes polyfill-like code.
3. For plugins that depend entirely on newer browser features (such as ResourceTiming
   for the {@link BOOMR.plugins.ResourceTiming ResourceTiming plugin}), the plugin
   should attempt to do feature-detection and disable itself if browser support
   does not exist.
