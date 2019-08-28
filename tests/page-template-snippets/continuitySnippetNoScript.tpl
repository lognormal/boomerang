(function() {
if (window && window.requestAnimationFrame) {
    window.BOOMR = window.BOOMR || {};
    window.BOOMR.fpsLog = [];

    function frame(now) {
        if (!window.BOOMR.version && window.BOOMR.fpsLog) {
            window.BOOMR.fpsLog.push(Math.round(now));

            // if we've added more than 30 seconds of data, stop
            if (window.BOOMR.fpsLog.length > 30 * 60) {
                return;
            }

            window.requestAnimationFrame(frame);
        }
    }

    window.requestAnimationFrame(frame);
}
})();
