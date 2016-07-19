(function(w){
	if (!w.XMLHttpRequest || !(new XMLHttpRequest()).addEventListener) {
		return;
	}

	var a = document.createElement("A"),
	    xhrNative = XMLHttpRequest,
	    resources = [],
	    sendResource,
	    readyStateMap = ["uninitialized", "open", "responseStart", "domInteractive", "responseEnd"];

	w.BOOMR = w.BOOMR || {};
	BOOMR.xhr = {
		stop: function(sr) {
			sendResource = sr;

			w.XMLHttpRequest = xhrNative;
			delete BOOMR.xhr;
			setTimeout(function(){
				resources = [];
			});
			return resources;
		}
	};

	var now = (function() {
		try {
			if ("performance" in w)
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

					if ("performance" in w && w.performance && typeof w.performance.getEntriesByName === "function") {
						var entries = w.performance.getEntriesByName(resource.url);
						var entry = entries && entries.length && entries[entries.length - 1];
						if (entry) {
							var navSt = w.performance.timing.navigationStart;
							if (entry.responseEnd !== 0) {
								resource.timing.responseEnd = Math.round(navSt + entry.responseEnd);
							}
							if (entry.responseStart !== 0) {
								resource.timing.responseStart = Math.round(navSt + entry.responseStart);
							}
							if (entry.startTime !== 0) {
								resource.timing.requestStart = Math.round(navSt + entry.startTime);
							}
						}
					}

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
