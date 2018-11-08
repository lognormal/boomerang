Boomerang may override (wrap) native DOM functions for monitoring purposes, depending
on the plugins and features that are enabled.

Generally, Boomerang wraps these functions to add a small amount of custom instrumentation,
prior to executing the original function.

The following is a list of known DOM overrides:

| Method                       | Plugin                        | Option                                        | Purpose                                                            |
|:-----------------------------|:------------------------------|:----------------------------------------------|:-------------------------------------------------------------------|
| `XMLHttpRequest` constructor | {@link BOOMR.plugins.AutoXHR} | `instrument_xhr`                              | Monitor timing for XHRs (individual and during SPA navigations)    |
| `fetch`                      | {@link BOOMR.plugins.AutoXHR} | `AutoXHR.monitorFetch`                        | Monitor timing for fetches (individual and during SPA navigations) |
| `window.onerror`             | {@link BOOMR.plugins.Errors}  | `Errors.monitorGlobal`                        | Monitor global exceptions                                          |
| `console.error`              | {@link BOOMR.plugins.Errors}  | `Errors.monitorConsole`                       | Monitor app-generated error messages                               |
| `addEventListener`           | {@link BOOMR.plugins.Errors}  | `Errors.monitorEvents`                        | Wrapped so messages from cross-origin frames have a full stack     |
| `removeEventListener`        | {@link BOOMR.plugins.Errors}  | `Errors.monitorEvents`                        | Wrapped so messages from cross-origin frames have a full stack     |
| `setTimeout`                 | {@link BOOMR.plugins.Errors}  | `Errors.monitorTimeout`                       | Wrapped so messages from cross-origin frames have a full stack     |
| `setInterval`                | {@link BOOMR.plugins.Errors}  | `Errors.monitorTimeout`                       | Wrapped so messages from cross-origin frames have a full stack     |
| `history.back`               | {@link BOOMR.plugins.History} | When {@link BOOMR.plugins.History} is enabled | SPA Soft Navigation monitoring                                     |
| `history.forward`            | {@link BOOMR.plugins.History} | When {@link BOOMR.plugins.History} is enabled | SPA Soft Navigation monitoring                                     |
| `history.pushState`          | {@link BOOMR.plugins.History} | When {@link BOOMR.plugins.History} is enabled | SPA Soft Navigation monitoring                                     |
| `history.replaceState`       | {@link BOOMR.plugins.History} | When {@link BOOMR.plugins.History} is enabled | SPA Soft Navigation monitoring                                     |
| `history.go`                 | {@link BOOMR.plugins.History} | When {@link BOOMR.plugins.History} is enabled | SPA Soft Navigation monitoring                                     |
