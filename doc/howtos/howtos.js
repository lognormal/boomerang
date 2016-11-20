// Since we don't set a beacon_url, we'll just subscribe to the before_beacon function
// and print the results into the browser itself.
BOOMR.subscribe("before_beacon", function(o) {
	var html = "", t_other, others = [];

	if (!o.t_other) {
		o.t_other = "";
	}

	for (var k in o) {
		if (!k.match(/^(t_done|t_other|bw|lat|bw_err|lat_err|u|r2?)$/)) {
			if (k.match(/^t_/)) {
				o.t_other += "," + k + "|" + o[k];
			}
			else {
				others.push(k + " = " + o[k]);
			}
		}
	}

	if (o.t_done) {
		html += "This page took " + o.t_done + " ms to load<br>";
	}

	if (o.t_other) {
		t_other = o.t_other.replace(/^,/, "").replace(/\|/g, " = ").split(",");
		html += "Other timers measured: <br>";
		for (var i = 0; i < t_other.length; i++) {
			html += "&nbsp;&nbsp;&nbsp;" + t_other[i] + " ms<br>";
		}
	}
	if (o.bw) {
		html += "Your bandwidth to this server is " + parseInt(o.bw * 8 / 1024) + "kbps (&#x00b1;" + parseInt(o.bw_err * 100 / o.bw) + "%)<br>";
	}

	if (o.lat) {
		html += "Your latency to this server is " + parseInt(o.lat) + "&#x00b1;" + o.lat_err + "ms<br>";
	}

	var r = document.getElementById("results");
	r.innerHTML = html;

	if (others.length) {
		r.innerHTML += "Other parameters:<br>";

		for (i = 0; i < others.length; i++) {
			var t = document.createTextNode(others[i]);
			r.innerHTML += "&nbsp;&nbsp;&nbsp;";
			r.appendChild(t);
			r.innerHTML += "<br>";

		}
	}

});
