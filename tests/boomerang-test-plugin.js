//
// This should be the last plugin in boomerang.js for test builds.
//
// if BOOMR_test.init() was called but Boomerang wasn't on the page yet,
// it leaves a BOOMR_test_config variable with the config.  We should call
// it now, which will run BOOMR.init().
//
if (BOOMR.window && BOOMR.window.BOOMR_test_config) {
	BOOMR.window.BOOMR_test.init(BOOMR.window.BOOMR_test_config);
	delete BOOMR.window.BOOMR_test_config;
}
