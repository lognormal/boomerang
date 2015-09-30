<script>
(function(w){
	if (!w.BOOMR || !w.XMLHttpRequest || !(new XMLHttpRequest()).addEventListener) {
		return;
	}

	var a = document.createElement("A"), xhrNative = XMLHttpRequest, resources = [], sendResource;
	BOOMR.xhr = {
		stop: function(sr) {
			sendResource = sr;
			for (var i = 0; i < resources.length; i++) {
				sr(resources[i]);
			}

			w.XMLHttpRequest = xhrNative;
			delete BOOMR.xhr;
			resources = [];
		}
	};

	var now = (function() {
		try {
			if ("performance" in window)
				return function() { return Math.round(performance.now() + performance.timing.navigationStart); };
		}
		catch (ignore) {}
		return Date.now || function() { return new Date().getTime(); };
	})();

	w.XMLHttpRequest = function() {
		var xhr = new xhrNative(), open = xhr.open;
		xhr.open = function(method, url, async) {
			function loadFinished() {
				if (!resource.timing.loadEventEnd) {
					resource.timing.loadEventEnd = now();
					if (sendResource) {
						sendResource(resource);
					} else {
						resources.push(resource);
					}
				}
			}
			function addListener(ename, stat) {
				xhr.addEventListener(
						ename,
						function() {
							if (ename === "readystatechange") {
								resource.timing[readyStateMap[xhr.readyState]] = now();
								if (xhr.readyState === 4) {
									loadFinished();
								}
							}
							else {
								resource.status = (stat === undefined ? xhr.status : stat);
								loadFinished();
							}
						},
						false);
			}

			a.href = url;
			var resource = { timing: {}, url: a.href, method: method };

			if (async === true) {
				addListener("readystatechange");
			} else {
				resource.synchronous = true;
			}

			addListener("load");
			addListener("timeout", -1001);
			addListener("error",   -998);
			addListener("abort",   -999);

			try {
				open.apply(xhr, arguments);
				var send = xhr.send;
				xhr.send = function() {
					resource.timing.requestStart = now();
					send.apply(xhr, arguments);
				};
			}
			catch (e) {
				resource.status = -997;
				loadFinished();
			}
		};
		return xhr;
	};

})(window);
</script>
