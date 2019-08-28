(function() {
	return performance.getEntriesByType("measure").map(function(measure) {
		return {
			name: measure.name,
			startTime: measure.startTime,
			duration: measure.duration
		};
	});
})();
