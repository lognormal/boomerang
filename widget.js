BOOMR.subscribe('before_beacon', function(o) {
	var html = [], fe,
	    widget = document.getElementById("ln_widget");

	if(!widget) {
		return;
	}

	if('rt.quit' in o || !o.t_done || o.t_done <= 0 || o.t_done > 20000) {
		return;
	}

	html.push('<div style="max-width:20em;font-family:Trebuchet,Helvetica,sans-serif;border:solid 1px #ccc;background-color:#eee;opacity:0.7;padding:0.5em 0.5em 0.1em;">');
	html.push('This page loaded in <span class="ln_load_time">');
	html.push((o.t_done/1000).toFixed(2));
	html.push('</span> seconds');

	if('t_page' in o && o.t_page > 0) {
		fe = o.t_page*100/o.t_done;

		html.push(' with <span class="ln_souders_score">');
		html.push(fe.toFixed(0));
		html.push('%</span> on the front end');
	}
	html.push('.');
	html.push('<p style="font-size:0.8em;">Performance Metrics by <a style="text-decoration:none;" title="LogNormal Real User Measurement" href="http://www.lognormal.com/"><span style="color:#000;font-size:1.4em;font-weight:bolder;font-family:Baskerville,\'Cooper Black\',serif;background-color:#eee;"><span style="color:#800">log</span>normal</span></a></p>');
	html.push('</div>');

	widget.innerHTML = html.join('');
});
