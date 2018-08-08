BOOMR_configt=new Date().getTime();
BOOMR.addVar({"h.t":{{H_T}},"h.cr":"{{H_CR}}"});
BOOMR.init({
	"autorun": false,
	"PageParams": {
		"pageGroups": [
			{
				"type": "Regexp",
				"parameter1": "/pages/",
				"parameter2": "FROMSERVER"
			}
		]
	},
	"LOGN": {
		"storeConfig": true
	}
});
