# UserTiming Plugin

## Collect W3C UserTiming API performance marks and measures


This plugin collects all W3C UserTiming API performance marks and measures that were added since navigation start or since the last beacon fired for the current navigation. The data is added to the beacon as the `usertiming` parameter. The value is a compressed string using Nic Jansma's [usertiming-compression.js](https://github.com/nicjansma/usertiming-compression.js) library. A decompression function is also available in the library.

Timing data is rounded to the nearest millisecond.

Please see the [W3C UserTiming API Reference](https://www.w3.org/TR/user-timing/) for details on how to use the UserTiming API.

### Configuring Boomerang

You can enable the `UserTiming` plugin with:
```js
BOOMR.init({
  UserTiming: {
    'enabled': true
  }
})
```

### Example

```js
performance.mark('mark1');  //mark current timestamp as mark1
performance.mark('mark2');
performance.measure('measure1', 'mark1', 'mark2');  //measure1 will be the delta between mark1 and mark2 timestamps
performance.measure('measure2', 'mark2');  //measure2 will be the delta between the mark2 timestamp and the current time
```

The compressed data added to the beacon will look similar to the following:

`usertiming=~(m~(ark~(1~'2s~2~'5k)~easure~(1~'2s_2s~2~'5k_5k)))`


Decompressing the above value will give us the original data for the marks and measures collected:
```json
[{"name":"mark1","startTime":100,"duration":0,"entryType":"mark"},
{"name":"measure1","startTime":100,"duration":100,"entryType":"measure"},
{"name":"mark2","startTime":200,"duration":0,"entryType":"mark"},
{"name":"measure2","startTime":200,"duration":200,"entryType":"measure"}]
```

### Compatibility and Browser Support


Many browsers [support](http://caniuse.com/#feat=user-timing) the UserTiming API, e.g.:
* Chrome 25+
* Edge
* Firefox 38+
* IE 10+
* Opera 15+

See Nic Jansma's [usertiming.js](https://github.com/nicjansma/usertiming.js) polyfill library to add UserTiming API support for browsers that don't implement it natively.
