---
layout: default
title: Boomerang Howto 5
---

# Request/page tagging

See [use case \#5](../use-cases.html#uc-5) for a description of this
requirement.

There will be several occassions when you need to add more information
to the beacon that's sent back to the server. For example, you may want
to tag the beacon with a `page_id` or you may want to do A/B testing and
tag the beacon with a parameter specifying which bucket this beacon is
for. You can achieve all this using the `BOOMR.addVar()` method.

Before you use this method, remember that each plugin adds its own
parameters and you shouldn't overwrite these with your own values. See
[Howto \#0](howto-0.html) for a list of parameters set by boomerang's
built-in plugins. Other plugins may add their own parameters, consult
the documentation of the plugin to find out what these are.

{% highlight javascript %}
    BOOMR.addVar("page_id", 123);
{% endhighlight %}

The parameter name must be a string. We recommend only using
alphanumeric characters and underscores, but you can really use anything
you like. Parameter values may only be numbers or strings, ie, something
that you can put into a URL.

If you need to set multiple parameters, you can pass in an object
instead:

    {% highlight javascript %}
    BOOMR.addVar({
            "bucket": "test#1",
            "page_id": 123
        });
    {% endhighlight %}

Make sure you've included boomerang.js before calling `BOOMR.addVar()`.

## The beacon

The beacon will include all variables that you add in the URL. Both keys
and values will be URI encoded. Your back end application will need to
understand the passed in parameters.

    http://yoursite.com/path/to/beacon.php?bucket=test%231&page_id=123&t_done=.....

## Removing variables

You can also remove a parameter that you've added (or that a plugin has
added) from the beacon. To do this, call the `BOOMR.removeVar()` method.
This method takes in a list of name, and removes all of them from the
parameter list. Any name that isn't in the parameter list is ignored.

    {% highlight javascript %}
    // don't send the stooges to the server
    BOOMR.removeVar("larry", "moe", "curly");
    {% endhighlight %}

## Stopping the beacon

You can also this as a crude way to prevent the beacon from firing.
Inside your `before_beacon` event handler, simply remove all parameters.

    {% highlight javascript %}
    BOOMR.subscribe('before_beacon', function(o) {
        var p_names = [], k;

        if( "t_done" in o ) {
            return;
        }

        // t_done is not set, so don't beacon
        for(k in o) {
            if(o.hasOwnProperty(k)) {
                p_names.push(k);
            }
        }

        // removeVar accepts either a list or an array
        BOOMR.removeVar(p_names);
    });
    {% endhighlight %}

<div id="results"></div>

<script src="/boomerang/boomerang.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/bw.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/navtiming.js" type="text/javascript"> </script>
<script src="/boomerang/plugins/rt.js" type="text/javascript"> </script>
<script src="howtos.js" type="text/javascript"> </script>
<script type="text/javascript">
BOOMR.init({
		user_ip: '10.0.0.1',
		BW: {
			base_url: '/boomerang/images/',
			cookie: 'HOWTO-BA'
		},
		RT: {
			cookie: 'HOWTO-RT'
		}
	}).
	addVar({
		"author": "bluesmoon",
		"page_id": "howto-5"
	});
</script>
