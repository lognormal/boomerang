(function() {
	return performance.getEntriesByType("mark").map(function(mark) {
		return {
			name: mark.name,
			startTime: mark.startTime
		};
	});
})();
