<!DOCTYPE html>
<!--[if IE 8]>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 1.0 Transitional//EN" "http://www.w3.org/TR/html1/DTD/html1-transitional.dtd">
<![endif]-->

<html>
<head>
	<!--[if IE 8]>
	<meta http-equiv="X-UA-Compatible" content="EmulateIE8">
	<![endif]-->
	<title>Boomerang Test <%= fileName %></title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="../../vendor/mocha/mocha.css" />
	<script type="text/javascript">
	// Clear localstorage
	if (typeof window.localStorage === "object" && typeof window.localStorage.clear === "function") {
		window.localStorage.clear();
	}
	// BOOMR API Key is required so LOGN doesn't fail to setup
	window.BOOMR_API_key="API_KEY";
	// Set RT Cookie to empty, preventing navigation related issues with session tests
	document.cookie = "RT=\"\";domain=.<%= mainServer %>;path=/";
	// Prevent Boomerang from setting a cookie on unload so as to prevent cookies to show up when we load the next E2E test
	window.addEventListener("beforeunload", function (e) {
		if (BOOMR) {
			BOOMR.disable();
		}

		e.preventDefault();
	});

	</script>
	<script src="../../vendor/mocha/mocha.js"></script>
	<script src="../../vendor/assertive-chai/dist/assertive-chai.js"></script>
	<script src="../../vendor/lodash/lodash.js"></script>
	<script src="../../boomerang-test-framework.js" type="text/javascript"></script>
	</head>
<body>
	<div id="mocha"></div>
	<script>
	mocha.setup("bdd");
	</script>


