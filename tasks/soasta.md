# Maintaining the Open-Source Repo

Before back-porting changes to the OS repo, please copy `lib/pre-commit-os` to that
repository's `.git/config/pre-commit` and `lib/pre-commit-bad-files.dat` to
`.git/config/pre-commit-bad-files.dat`.

This ensures commits you make don't contain any SOASTA-proprietary files or contents.

## Files That Should Not Be Included

Please see `lib/pre-commit-bad-files.dat` for a list of files that should not live
in the OS repository.

## Files That Have Different Contents

`plugins.json` has the following additional plugins:

* `plugins/config-override.js`
* `plugins/page-params.js`
* `plugins/cross-domain.js`
* `plugins/akamai.js`
* `plugins/logn.js`

The following files should have blocks with `/* SOASTA PRIVATE START */`
through `/* SOASTA PRIVATE END */`, or have other differences:

* `doc/version-history.md` (has Akamai-specific changes)
* `tests/unit/index.html` (has two additional test files for Akamai plugins)
* `Gruntfile.js` (has Akamai-specific tasks and config)
* `package.json` and `package-lock.json` (has `soasta-repostitory` package)

We use `/* SOASTA PRIVATE START */` to make it easier to notice any private code
when comparing to the OS repo.
