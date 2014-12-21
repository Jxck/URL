;
var URLSearchParams = (function () {
    function URLSearchParams(init) {
        this.list = [];
        this.urlObject = [];
        if (typeof init === "string") {
            this.list = this.parse(init);
        }
        if (typeof init === "object") {
            this.list = init.list;
        }
    }
    URLSearchParams.prototype.append = function (name, value) {
        this.list.push({ name: name, value: value });
        this.update();
    };
    URLSearchParams.prototype.delete = function (name) {
        this.list = this.list.filter(function (pair) {
            return pair.name !== name;
        });
        this.update();
    };
    URLSearchParams.prototype.get = function (name) {
        return this.getAll(name).shift() || null;
    };
    URLSearchParams.prototype.getAll = function (name) {
        return this.list.reduce(function (acc, pair) {
            if (pair.name === name) {
                acc.push(pair.value);
            }
            return acc;
        }, []);
    };
    URLSearchParams.prototype.has = function (name) {
        return this.list.some(function (pair) {
            return pair.name === name;
        });
    };
    URLSearchParams.prototype.set = function (name, value) {
        // if exists, this appended will remove in filter.
        this.list.push({ name: name, value: value });
        // update all pair
        this.list.map(function (pair) {
            if (pair.name === name) {
                pair.value = value;
            }
            return pair;
        }).filter(function (pair) {
            if (pair.name === name) {
                if (this.emitted) {
                    // current pair is duplicate
                    return false;
                }
                else {
                    // first pair of key
                    this.emitted = true;
                    return true;
                }
            }
            // other pair
            return true;
        }, { emitted: false });
    };
    URLSearchParams.prototype.parse = function (input, encoding, useCharset, isIndex) {
        if (encoding !== "utf-8") {
            encoding = "utf-8"; // TODO: currently only support utf-8
        }
        // TODO: check 0x7F
        var sequences = input.split('&');
        if (isIndex) {
            var sequence = sequences[0];
            if (sequence.indexOf("=") === -1) {
                sequences[0] = "=" + sequence;
            }
        }
        var pairs = sequences.map(function (bytes) {
            if (bytes === "")
                return;
            // Split in "="
            var name, value;
            if (bytes.indexOf("=")) {
                var b = bytes.split("=");
                name = b.shift();
                value = b.join("");
            }
            else {
                name = bytes;
                value = "";
            }
            // replace "+" to 0x20
            var c0x20 = String.fromCharCode(0x20);
            name.replace(/\+/g, c0x20);
            value.replace(/\+/g, c0x20);
            if (useCharset && name === "_charset_") {
                throw new Error("not implemented yet");
            }
            return { name: name, value: value };
        });
        return null;
    };
    URLSearchParams.prototype.update = function () {
    };
    URLSearchParams.prototype.toString = function () {
        return "";
    };
    return URLSearchParams;
})();
