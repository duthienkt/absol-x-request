
/****
 *
 * @param {XMLHttpRequest} xhr
 * @constructor
 */
export function XResponse(xhr) {
    this._xhr = xhr;
    this._result = null;
    this._headers = null;
    this._filename = null;
    this._blobUrl = null;
}

Object.defineProperty(XResponse.prototype, 'result', {
    get: function () {
        return this._result || this._xhr.response;
    }
});

Object.defineProperty(XResponse.prototype, 'filename', {
    get: function () {
        var filename = "response.bin";
        var disposition = this.headers['content-disposition'];
        if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            var matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        this._filename = filename;
        return this._filename;
    }
});

Object.defineProperty(XResponse.prototype, 'error', {
    get: function () {
        if (this._xhr.status === 200) return false;
        return this._xhr.statusText;
    }
});


Object.defineProperty(XResponse.prototype, 'headers', {
    get: function () {
        if (!this._headers) {
            var headerText = this._xhr.getAllResponseHeaders();
            this._headers = headerText.trim().split(/[\r\n]+/).reduce(function (ac, line) {
                var p = line.split(':');
                ac[p[0].trim().toLowerCase()] = p[1].trim();
                return ac;
            }, {});
        }
        return this._headers;
    }
})

/***
 *
 * @returns {Object}
 */
XResponse.prototype.json = function () {
    if (this._xhr.responseType === 'json') {
        this._result = this._xhr.response;
    }
    else {
        this._result = JSON.parse(this._xhr.responseText);
    }
    return this._result;
};

/***
 *
 * @returns {Blob}
 */
XResponse.prototype.blob = function () {
    if (this._xhr.responseType === 'blob') {
        this._result = this._xhr.response;
    }
    else {
        this._result = new Blob([this._xhr.response]);
    }
    return this._result;
};

XResponse.prototype.download = function () {
    this._blobUrl = this._blobUrl || URL.createObjectURL(this.blob());
    var url = this._blobUrl;
    var fileName = this.filename;
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
};
