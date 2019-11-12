QThrottle
=========

Throttles Q promises in Node.js


## Example

```javascript
var Q = require('q'),
    throttle = require('./Throttle');

var numbers = [1, 2, 3, 4, 5, 6];

// Invoke the iterator for each of the numbers, but only 2 at a time!
throttle(numbers, 3, function(number) {
  var deferred = Q.defer();
  setTimeout(function() {
    console.log(number);
    deferred.resolve();
  }, 1000);
  return deferred.promise;
});
```