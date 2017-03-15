setTimeout(function(w) {
	w.BOOMR_configt=new Date().getTime();
	w.BOOMR.addVar({"h.t":{{H_T}},"h.cr":"{{H_CR}}"});
	w.BOOMR.init({
		autorun: false,
		History: {
			enabled: true,
			auto: true
		},
		testAfterOnBeacon: true
	});
}(window), 5000);
