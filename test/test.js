var fs = require('fs');
var jURL = require('../url').jURL;
var URLTestParser = require('./urltestparser').URLTestParser;

function assert(actual, expected) {
  console.log('.');
  console.assert(actual === expected, '\nact: ' + actual + '\nexp: ' + expected);
}

function runURLTests(raw) {
  var urltests = URLTestParser(raw);
  for(var i = 0, l = urltests.length; i < l; i++) {
    var expected = urltests[i]
    var url = new jURL(expected.input, expected.base)
    if(expected.protocol === ':' && url.protocol !== ':') {
      assert.fail('Expected URL to fail parsing')
    }
    assert(url.protocol, expected.protocol, "scheme")
    assert(url.hostname, expected.host, "host")
    assert(url.port, expected.port, "port")
    assert(url.pathname, expected.path, "path")
    assert(url.search, expected.search, "search")
    assert(url.hash, expected.hash, "hash")
    assert(url.href, expected.href, "href")
  }
}

fs.readFile('./test/urltestdata.txt', function(err, data) {
  runURLTests(data.toString());
});
