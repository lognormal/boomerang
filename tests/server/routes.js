module.exports = function(app) {
	// potential config locations
	app.get("/config", require("./route-config"));
	app.get("/config.json", require("./route-config"));
	app.get("/api/config.json", require("./route-config"));
	app.get("/api/v2/config.json", require("./route-config"));
	app.get("/concerto/api/config.json", require("./route-config"));
	app.get("/concerto/api/v2/config.json", require("./route-config"));
};
