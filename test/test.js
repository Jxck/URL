var fs = require('fs');
var jURL = require('../url').jURL;
var URLTestParser = require('./urltestparser').URLTestParser;

function assert(actual, expected) {
  console.log('.');
  console.assert(actual === expected, '\nact: ' + actual + '\nexp: ' + expected);
}

function t(urltests) {

  var expected = urltests.shift();

  try {
    var url = new jURL(expected.input, expected.base);

    if (expected.protocol === ':' && url.protocol !== ':') {
      assert('Expected URL to fail parsing');
    }

    assert(url.protocol, expected.protocol, 'scheme');
    assert(url.hostname, expected.host, 'host');
    assert(url.port, expected.port, 'port');
    assert(url.pathname, expected.path, 'path');
    assert(url.search, expected.search, 'search');
    assert(url.hash, expected.hash, 'hash');
    assert(url.href, expected.href, 'href');
  } catch(err) {
    if (expected.invalid === false) {
      console.log(expected, urltests.length);
      console.log(err);
    }
  } finally {
    setTimeout(function() {
      if (urltests.length > 0) {
        t(urltests);
      }
    }, 0);
  }
}

function runURLTests(raw) {
  var urltests = URLTestParser(raw);
  t(urltests);
}

fs.readFile('./test/urltestdata.txt', function(err, data) {
  runURLTests(data.toString());
});
