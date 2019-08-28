BOOMR_configt=new Date().getTime();
BOOMR.addVar({"h.t":{{H_T}},"h.cr":"{{H_CR}}"});
BOOMR.init({
	Continuity: {
		enabled: true,
		afterOnloadMaxLength: 60000,
		afterOnloadMinWait: 1000
	},
	PageParams: {
		pageGroups: [
			{
				type: "Regexp",
				parameter1: "/pages/",
				parameter2: "MATCH"
			}
		]
	}
});
