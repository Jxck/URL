var inRange = require('../url').inRange;
var isASCIIDigits = require('../url').isASCIIDigits;
var isASCIIHexDigits = require('../url').isASCIIHexDigits;
var isASCIIAlpha = require('../url').isASCIIAlpha;
var isASCIIAlphaNumeric = require('../url').isASCIIAlphaNumeric;
var isURLCodePoint = require('../url').isURLCodePoint;
var isRelativeScheme = require('../url').isRelativeScheme;
var toLower = require('../url').toLower;
var toUpper = require('../url').toUpper;
var toString = require('../url').toString;
var encode = require('../url').encode;
var decode = require('../url').decode;
var percentDecode = require('../url').percentDecode;
var utf8PercentEncode = require('../url').utf8PercentEncode;
var simpleEncodeSet = require('../url').simpleEncodeSet;

var obtainUnicode = obtainUnicode || require("obtain-unicode").obtainUnicode;

var serializeIPv6 = require('../url').serializeIPv6;
var parseIPv6 = require('../url').parseIPv6;

var jURL = require('../url').jURL;


function assert(actual, expected) {
  "use strict";
  console.log(".");
  console.assert(actual === expected, "\nact: " + actual + "\nexp: " + expected);
}

assert(inRange(1, 2, 3), true);
assert(inRange(1, 1, 1), true);
assert(inRange(1, 0, 1), false);

var t = true, f = false;           [ "a", "f", "z", "A", "F", "Z", "0", "9", "!", "?", "" ]
  .map(function(e) { return e.charCodeAt(0) })
  .forEach(function(a, i) {
    assert(isASCIIDigits(a),       [  f ,  f ,  f ,  f ,  f ,  f ,  t ,  t ,  f ,  f ,  f ][i]);
    assert(isASCIIHexDigits(a),    [  t ,  t ,  f ,  t ,  t ,  f ,  t ,  t ,  f ,  f ,  f ][i]);
    assert(isASCIIAlpha(a),        [  t ,  t ,  t ,  t ,  t ,  t ,  f ,  f ,  f ,  f ,  f ][i]);
    assert(isASCIIAlphaNumeric(a), [  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  f ,  f ,  f ][i]);
    assert(isURLCodePoint(a),      [  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  f ][i]);
  });

["ftp", "file", "gopher", "http", "https", "ws", "wss"].forEach(function(scheme) {
  assert(isRelativeScheme(scheme), true);
});

assert(isRelativeScheme("foo"), false);
assert(isRelativeScheme(""), false);
assert(isRelativeScheme(null), false);
assert(isRelativeScheme(undefined), false);

["!", "$", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "=", "?", "@", "_", "~"]
.forEach(function(c) {
  assert(isURLCodePoint(c.charCodeAt(0)), true);
});

assert("a".charCodeAt(0), toLower("A".charCodeAt(0)));
assert("a".charCodeAt(0), toLower("a".charCodeAt(0)));
assert("A".charCodeAt(0), toUpper("a".charCodeAt(0)));
assert("A".charCodeAt(0), toUpper("A".charCodeAt(0)));

assert("𠮟", toString(obtainUnicode("𠮟")));
assert("𠮟", decode(encode(obtainUnicode("𠮟"))));
assert("𠮟", decode(percentDecode(utf8PercentEncode(obtainUnicode("𠮟")[0], simpleEncodeSet))));

assert([1, 2, 3].includes(2), true);
assert([1, 2, 3].includes(-1), false);

// http://www.gestioip.net/docu/ipv6_address_examples.html
// TODO: https://bitbucket.org/kwi/py2-ipaddress/src/991cf901295a14e77c795691afbec552461865f0/test_ipaddress.py?at=default
// TODO: https://github.com/golang/go/blob/master/src/net/ip_test.go
// TODO: https://github.com/ruby/ruby/blob/trunk/test/test_ipaddr.rb
// TODO: http://search.cpan.org/~luismunoz/NetAddr-IP-4.007/MANIFEST
[
["2001:0db8:0a0b:12f0:0000:0000:0000:0001", "2001:db8:a0b:12f0::1"],
["3731:54:65fe:2::a7", "3731:54:65fe:2::a7"],
["::", "::"],
["::1", "::1"],
// ["::ffff:10.0.0.3", "::ffff:10.0.0.3"],
// ["::ffff:0:10.0.0.3", "::ffff:0:10.0.0.3"],
["100::", "100::"],
["2001:0000:6dcd:8c74:76cc:63bf:ac32:6a1", "2001:0:6dcd:8c74:76cc:63bf:ac32:6a1"],
["2001:0002:cd:65a:753::a1", "2001:2:cd:65a:753::a1"],
["2001:db8::a3", "2001:db8::a3"],
["2001:11::3f4b:1aff:f7b2", "2001:11::3f4b:1aff:f7b2"],
["2002:6dcd:8c74:6501:fb2:61c:ac98:6be", "2002:6dcd:8c74:6501:fb2:61c:ac98:6be"],
["fd07:a47c:3742:823e:3b02:76:982b:463", "fd07:a47c:3742:823e:3b02:76:982b:463"],
["fea3:c65:43ee:54:e2a:2357:4ac4:732", "fea3:c65:43ee:54:e2a:2357:4ac4:732"],
// ["::10.0.0.3", "::10.0.0.3"],

// ["fe80:4:6c:8c74:0000:5efe:109.205.140.116", "fe80:4:6c:8c74:0000:5efe:109.205.140.116"],
// ["24a6:57:c:36cf:0000:5efe:109.205.140.116", "24a6:57:c:36cf:0000:5efe:109.205.140.116"],
// ["2002:5654:ef3:c:0000:5efe:109.205.140.116", "2002:5654:ef3:c:0000:5efe:109.205.140.116"],

].forEach(function(test) {
  assert(serializeIPv6(parseIPv6(obtainUnicode(test[0]))), test[1]);
});

var href = "http://jxck:fooo@example.com:3000/a/b/c?key1=value1&key2=value2#yey";
var u = new jURL(href);
assert(u.href,     href);
assert(u.origin,   "http://example.com:3000");
assert(u.protocol, "http:");
assert(u.username, "jxck");
assert(u.password, "fooo");
assert(u.host,     "example.com:3000");
assert(u.hostname, "example.com");
assert(u.port,     "3000");
assert(u.pathname, "/a/b/c");
assert(u.search,   "?key1=value1&key2=value2");
assert(u.hash,     "#yey");
assert(u.searchParams.get("key1"), "value1");
assert(u.searchParams.get("key2"), "value2");

var href = "http://ゆーざ:パスワード@host.com:3000/ぱす/です/よ/?きー=ばりゅー&もう=いっこ#いぇーい";
var u = new jURL(href);
assert(u.href,     "http://%E3%82%86%E3%83%BC%E3%81%96:%E3%83%91%E3%82%B9%E3%83%AF%E3%83%BC%E3%83%89@host.com:3000/%E3%81%B1%E3%81%99/%E3%81%A7%E3%81%99/%E3%82%88/?%E3%81%8D%E3%83%BC=%E3%81%B0%E3%82%8A%E3%82%85%E3%83%BC&%E3%82%82%E3%81%86=%E3%81%84%E3%81%A3%E3%81%93#いぇーい");
assert(u.username, "%E3%82%86%E3%83%BC%E3%81%96");
assert(u.password, "%E3%83%91%E3%82%B9%E3%83%AF%E3%83%BC%E3%83%89");
assert(u.pathname, "/%E3%81%B1%E3%81%99/%E3%81%A7%E3%81%99/%E3%82%88/");
assert(u.search,   "?%E3%81%8D%E3%83%BC=%E3%81%B0%E3%82%8A%E3%82%85%E3%83%BC&%E3%82%82%E3%81%86=%E3%81%84%E3%81%A3%E3%81%93");
assert(u.hash,     "#いぇーい");
assert(u.searchParams.get("きー"), "ばりゅー");
assert(u.searchParams.get("もう"), "いっこ");

var href = "http://[2001:0db8:0a0b:12f0:0000:0000:0000:0001]";
var u = new jURL(href);
assert(u.origin, "http://[2001:db8:a0b:12f0::1]");
assert(u.host, "[2001:db8:a0b:12f0::1]");


var href = "http://ExAmPlE.CoM";
var u = new jURL(href);
console.log(u);
