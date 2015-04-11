// https://github.com/w3c/web-platform-tests/tree/master/url
var jURL = jURL || require('../url').jURL;
var URLTestParser = URLTestParser || require('./urltestparser').URLTestParser;

function assert(actual, expected) {
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
      console.log(err.message);
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

if (typeof window !== 'undefined') {
  var request = new XMLHttpRequest();
  request.open('GET', 'urltestdata.txt');
  request.send();
  request.responseType = 'text';
  request.onload = function() {
    runURLTests(request.response);
  };
} else {
  require('fs').readFile('./test/urltestdata.txt', function(err, data) {
    runURLTests(data.toString());
  });
}
