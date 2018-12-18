Boomerang has a suite of performance tests to ensure code changes do not introduce performance regressions.

The performance tests reside in `tests/perf/`.

## Running

To run the performance tests:

```
grunt perf
```

This should run all suites in `tests/perf/` and will save the results in `tests/perf/results/`:

* `tests/perf/results/metrics.json`: Results of each test
* `tests/perf/results/[scenario].[test]`: Raw results for each test
* `tests/perf/results/baseline.json`: Baseline comparison file (`grunt perf:baseline`)

Example results:

```
{
  "00-basic": {
    "00-empty": {
      "page_load_time": 27.5,
      "boomerang_javascript_time": 29.5,
      "total_javascript_time": 43,
      "mark_startup_called": 1,
      "mark_check_doc_domain_called": 4,
  ...
}
```

## Comparing to a Baseline

To compare performance results to a baseline, you first need to run this on the "before" codebase:

```
grunt perf
```

This will create `tests/perf/results/baseline.json`.

Then, you can run performance tests against the "current" code by executing:

```
grunt perf:compare
```

This will create a new `tests/perf/results/metrics.json` each run, and will compare those results to `tests/perf/results/baseline.json`:

```
$ grunt perf-compare --diff-only
Running "perf-compare" task
Results comparison to baseline:
00-basic.00-empty.page_load_time                                       :  28 -1 (-4%)
00-basic.00-empty.mark_fire_event_before_beacon_called                 : [missing in baseline]

Done.
```
