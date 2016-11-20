AutoXHR - Instrument and measure AJAX requests and DOM manipulations triggering network requests

With this plugin sites can not only monitor their page load but also the XMLHttpRequests after the page has been loaded
as well as the DOM manipulations that trigger an asset to be fetched.

### Configuring Boomerang with AutoXHR included

You can enable the AutoXHR plugin with:

```js
BOOMR.init({
  instrument_xhr: true
})
```

Once this has been done and the site has been loaded and instrumented with this plugin, we have replaced the `XMLHttpRequest` object
on the site with our very own!

### Monitoring XHRs

If you were to send an `XMLHttpRequest` on your page now you can see not only a page load beacon but also an XHR beacon:

```js
xhr = new XMLHttpRequest();
xhr.open("GET", "support/script200.js"); //200, async
xhr.send(null);
```

If you have boomerang with the auto_xhr.js plugin included in your page and someone visited the page, we are able
to measure the time this asset takes to come down from the server. Measured performance data will include:

 - `u`: the URL of the image that has been fetched
 - `http.initiator`: The type of Beacon or Request that has been triggered in this case `xhr` 

### Using AutoXHR to monitor DOM events

Say for example that you have button on the page that will insert a new picture, we can monitor this asset coming down and
send timing information for that page:

```html
<script type="text/javascript">
(function(w, d) {
	var imageHolder = d.getElementById("picture");
	var clickable = d.getElementById("clickable");
	function clickCb() {
		var imageElement = d.createElement("img");
		imageElement.src = "support/img.jpg";
		imageHolder.appendChild(imageElement);
	}

	function addEvent(element, event, funct){
		if (element.attachEvent) {
			return element.attachEvent("on"+event, funct);
		}
		else {
			return element.addEventListener(event, funct);
		}
	}
	addEvent(clickable, "mouseup", clickCb);
}(this, this.document));
</script>

<div id="clickable">Click Me!</div>
<div id="picture"></div>
```

### Before Page Load XHR Beacons 

By default AutoXHR will wait until the pages page load beacon has been sent to enable itself to start sending beacons that will correspond with the pages
XHRs. If you wish to enable AutoXHR Beacons sending before the site itself has loaded, you can set a config flag for the AutoXHR plugin to enable it to
send beacons as soon as it has instrumented the page.

```
BOOMR.init({
  instrument_xhr: true,
  AutoXHR: {
    alwaysSendXhr: true
  }
})
```

### Compatibility and Browser Support

Currently supported Browsers and platforms that AutoXHR will work on:

 - IE 9+ (not in quirks mode)
 - Chrome 38+
 - Firefox 25+

In general we support all browsers that support `MutationObserver`, `XMLHttpRequest` with `addEventListener` on the XMLHttpRequest instance


