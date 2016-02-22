BOOMR_configt=new Date().getTime();
BOOMR.addVar({"h.t":{{H_T}},"h.cr":"{{H_CR}}"});
BOOMR.init({
	Angular: {
		enabled: true
	},
	autorun: false,
	ResourceTiming: {
		enabled: true
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
