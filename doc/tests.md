Boomerang has extensive test coverage in the form of Unit Tests and End-to-End (E2E)
Test suites.

## Test Environment

To configure the test environment, you will need to install all of the required
NPM and Bower dependencies:

```
npm install
bower install
node node_modules/protractor/bin/webdriver-manager update
```

In addition, you should map the following two domains to `127.0.0.1`:

* `boomerang-test.local`
* `boomerang-test2.local`

e.g.

```
# /etc/hosts or C:\windows\system32\drivers\etc\hosts
127.0.0.1 boomerang-test.local boomerang-test2.local
```

## Unit Tests

Boomerang's Unit Tests validate Boomerang's public APIs and utility functions.

Unit Tests should not depend on the environment (e.g. HTML structure, a specific
browser, or other environment setup).  If you need a specific environment, you
should create an End-to-End (E2E) test.

Unit Tests are located in `tests/unit/*.js`.  They are loosely organized into
components or plugins.

Boomerang's Unit Tests can be run from your local browser or in headless mode.

To build, run or debug the Unit Tests in your local browser, you will need to spawn
a local webserver to host the `tests/unit/*` files.  You can do this by running
the following:

```
grunt test:debug
```

Once the webserver has started, you should be able to visit the following URL
in your browser:

http://boomerang-test.local:4002/unit/

All Unit Test files are manually included via `tests/unit/index.html`.

In addition, you can run any of the following combinations to automatically run
all `tests/unit/*.js` files via Grunt and [Karma](https://karma-runner.github.io/):

* `grunt test:unit`
* `grunt test:unit:all`
* `grunt test:unit:allHeadless`
* `grunt test:unit:Chrome`
* `grunt test:unit:ChromeHeadless`
* `grunt test:unit:Firefox`
* `grunt test:unit:FirefoxHeadless`
* `grunt test:unit:Edge`
* `grunt test:unit:IE`
* `grunt test:unit:Opera`
* `grunt test:unit:Safari`
* `grunt test:unit:PhantomJS`

The Unit Tests utilize [Chai Assert](http://www.chaijs.com/api/assert/) for validations.

## End-to-End (E2E) Tests

Boomerang's End-to-End (E2E) Tests validate how Boomerang behaves in various
scenarios and environments: user actions (e.g. navigating between pages), page
constructions (e.g. with specific DOM elements), frameworks (e.g. SPAs), etc.

E2E Tests are located in `tests/page-templates/**/*.[js|html]`.  They are loosely organized into
subdirectories of scenarios or plugins.

Each E2E test has two files: `01-name.html` contains the scenario (e.g. what is happening
in the test) while `01-name.js` contains the test validations.

When `grunt test` or `grunt build:test` is called, the `tests/page-templates/**/*`
files are processed (templates applied) and output into `tests/pages/`, whose
files are loaded by the browser during test execution.  Some of the templates live in `tests/page-templates/*`.

The E2E Tests utilize [Chai Assert](http://www.chaijs.com/api/assert/) for validations.

Boomerang's E2E Tests can be run from your local browser or in headless mode.

To build, run or debug the E2E Tests in your local browser, you will need to spawn
a local webserver to host the `tests/pages/*` files.  You can do this by running
the following:

```
grunt test:debug
```

In addition, you can run any of the following combinations to automatically run
all E2E tests files via Grunt and [Protractor](https://www.protractortest.org/):

* `grunt test:e2e`
* `grunt test:e2e:browser`
* `grunt test:e2e:debug` - will only run tests in `tests/e2e/e2e-debug.json`
* `grunt test:e2e:PhantomJS`
* `grunt test:e2e:Chrome`
* `grunt test:e2e:ChromeHeadless`
* `grunt test:e2e:Firefox`
* `grunt test:e2e:FirefoxHeadless`
* `grunt test:e2e:Edge`
* `grunt test:e2e:IE`
* `grunt test:e2e:Safari`
