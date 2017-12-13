Boomerang plugins can be used for adding core functionality (such
as ResourceTiming support) as well as for site-specific custom needs.

Use the below example for creating a new Boomerang plugin.

Once created, you can add the new plugin to your Boomerang build by adding
it to `plugins.json`.  See {@tutorial building} for more details.

```
/**
 * Skeleton template for all boomerang plugins.
 *
 * Use this code as a starting point for your own plugins.
 */
(function() {
	// First, make sure BOOMR is actually defined.  It's possible that your plugin
	// is loaded before boomerang, in which case you'll need this.
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	// A private object to encapsulate all your implementation details
	// This is optional, but the way we recommend you do it.
	var impl = {
	};

	//
	// Public exports
	//
	BOOMR.plugins.MyPlugin = {
		init: function(config) {
			// list of user configurable properties
			var properties = ["prop1", "prop2"];

			// This block is only needed if you actually have user configurable properties
			BOOMR.utils.pluginConfig(impl, config, "MyPlugin", properties);

			// Other initialization code here

			// Subscribe to any BOOMR events here.
			// Unless your code will explicitly be called by the developer
			// or by another plugin, you must to do this.

			return this;
		},

		// Any other public methods would be defined here

		is_complete: function() {
			// This method should determine if the plugin has completed doing what it
			// needs to do and return true if so or false otherwise
		}
	};
}());
```
