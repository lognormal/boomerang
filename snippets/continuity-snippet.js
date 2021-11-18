(function(w) {
	if (w && w.requestAnimationFrame) {
		w.BOOMR = w.BOOMR || {};
		w.BOOMR.fpsLog = [];

		function frame(now) {
			// w.BOOMR.fpsLog will get deleted once Boomerang has loaded
			if (w.BOOMR.fpsLog) {
				w.BOOMR.fpsLog.push(Math.round(now));

				// if we've added more than 30 seconds of data, stop
				if (w.BOOMR.fpsLog.length > 30 * 60) {
					return;
				}

				w.requestAnimationFrame(frame);
			}
		}

		w.requestAnimationFrame(frame);
	}
})(window);
