(function(){
	// mPulse Loader Snippet version 10
	if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
		return;
	}

	window.BOOMR = window.BOOMR || {};
	window.BOOMR.snippetExecuted = true;

	var dom, doc, where, iframe = document.createElement("iframe"), win = window;

	function boomerangSaveLoadTime(e) {
		win.BOOMR_onload = (e && e.timeStamp) || new Date().getTime();
	}

	if (win.addEventListener) {
		win.addEventListener("load", boomerangSaveLoadTime, false);
	} else if (win.attachEvent) {
		win.attachEvent("onload", boomerangSaveLoadTime);
	}

	iframe.src = "javascript:void(0)";
	iframe.title = "";
	iframe.role = "presentation";
	(iframe.frameElement || iframe).style.cssText = "width:0;height:0;border:0;display:none;";
	where = document.getElementsByTagName("script")[0];
	where.parentNode.insertBefore(iframe, where);

	try {
		doc = iframe.contentWindow.document;
	} catch (e) {
		dom = document.domain;
		iframe.src = "javascript:var d=document.open();d.domain='" + dom + "';void(0);";
		doc = iframe.contentWindow.document;
	}

	doc.open()._l = function() {
		var js = this.createElement("script"), prefix, suffix;
		if (dom) {
			this.domain = dom;
		}
		js.id = "boomr-if-as";
		if (window.BOOMR_script_delay) {
			prefix = "/delay?delay=3000&file=build/";
			suffix = "&rnd=" + Math.random();
		}
		else {
			prefix = "../../build/";
			suffix = "";
		}
		js.src = prefix + (window.BOOMR_script_minified ? "boomerang-latest-debug.min.js" : "boomerang-latest-debug.js") + suffix;
		BOOMR_lstart = new Date().getTime();
		this.body.appendChild(js);
	};
	doc.write('<bo' + 'dy onload="document._l();">');
	doc.close();
})();
