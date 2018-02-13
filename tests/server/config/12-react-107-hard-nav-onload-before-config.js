BOOMR_configt=new Date().getTime();
BOOMR.addVar({"h.t":{{H_T}},"h.cr":"{{H_CR}}"});
BOOMR.init({
	instrument_xhr: true,
	autorun: false,
	History: {
		enabled: true,
		auto: true
	},
	testAfterOnBeacon: true
});
