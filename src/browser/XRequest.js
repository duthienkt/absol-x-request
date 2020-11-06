import {XResponse} from "./XResponse";

export function makeXHRObject() {
    try {
        return new XMLHttpRequest();
    } catch (error) {
    }
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (error) {
    }
    try {
        return new ActiveXObject("Microsoft.XMLHTTP");
    } catch (error) {
    }

    throw new Error("Could not create HTTP request object.");
}

/***
 * @typedef XRequestAuth
 * @property {string} [user]
 * @property {string} [pass]
 */


/***
 * @typedef XRequestOption
 * @property  {string} [url]
 * @property  {"GET"|"POST"} [method]
 * @property  {boolean} [async]
 * @property {Object} [header]
 * @property {number} [timeout]
 * @property {XMLHttpRequestResponseType} [responseType]
 * @property {boolean} [withCredential]
 * @property {Object} [formData]
 * @property {Object} [jsonData]
 * @property {XRequestAuth} [auth]
 * @property {Object} [on]
 *
 */


/****
 *
 * @typedef {"uploadstart"|"uploadend"|"uploadprogress"|"uploadabort"|"uploadcomplete"|"uploadtimeout"|"uploaderror"|"error"|"load"|"timeout", "progress"} XRequestEventName
 */

export var XRequestEventRoutes = {};


var uploadEventMap = {
    uploadstart: 'loadstart',
    uploadend: 'loadend',
    uploadprogress: 'progress',
    uploadabort: 'abort',
    uploadcomplete: 'load',
    uploadtimeout: 'timeout',
    uploaderror: 'error'
};

Object.keys(uploadEventMap).map(function (name) {
    /***
     *
     * @param {XMLHttpRequest} xhr
     * @param {function} callback
     */
    XRequestEventRoutes[name] = function (xhr, callback) {
        xhr.upload.addEventListener(uploadEventMap[name], callback);
    };
});


/***
 *
 * @param {XMLHttpRequest} xhr
 * @param {function} callback
 * @param {string} name
 */
XRequestEventRoutes.default = function (xhr, callback, name) {
    xhr.addEventListener(name, callback);
};


/***
 *
 * @param {XRequestOption=} option
 * @constructor
 */
function XRequest(option) {
    this._method = "GET";
    this._url = option.url;
    this._events = {};
    this._headers = {};
    this._async = true;
    this._mineType = null;
    this._withCredentials = false;
    this._responseType = null;
    this._timeout = 0;
    this._body = null;
    if (option) {
        option.url && this.url(option.url);
        option.method && this.method(option.method);
        option.header && this.header(option.header);
        option.async && this.async(option.async);
        option.responseType && this.responseType(option.responseType);
        option.formData && this.form(option.formData);
        option.jsonData && this.json(option.formData);
        option.auth && this.auth(option.auth);
        option.on && this.on(option.on);
    }
}

/****
 *
 * @param {string} url
 * @returns {XRequest}
 */
XRequest.prototype.url = function (url) {
    this._url = url;
    return this;
};

/***
 *
 * @param {"GET"|"POST"} method
 * @returns {XRequest}
 */
XRequest.prototype.method = function (method) {
    method = method.toUpperCase();
    if (["GET", "POST"].indexOf(method) >= 0) {
        this._method = method;
    }
    return this;
};

/***
 *
 * @param {XRequestAuth} authData
 * @returns {XRequest}
 */
XRequest.prototype.auth = function (authData) {
    if (authData.user && authData.pass)
        this.header('WWW-Authenticate', 'Basic realm=' + btoa(authData.user + ':' + authData.pass));
    return this;
};


/***
 *
 * @param {boolean=} flag default: true
 * @returns {XRequest}
 */
XRequest.prototype.async = function (flag) {
    if (arguments.length === 0) {
        flag = true;
    }
    this._async = !!flag;
    return this;
};

/***
 *
 * @param {boolean=} flag default: true
 * @returns {XRequest}
 */
XRequest.prototype.withCredentials = function (flag) {
    if (arguments.length === 0) {
        flag = true;
    }
    this._withCredentials = !!flag;
    return this;
};


/***
 *
 * @returns {XRequest}
 */
XRequest.prototype.header = function () {
    if (arguments.length === 1) {
        Object.assign(this._headers, arguments[0])
    }
    else if (arguments.length === 2) {
        this._headers[arguments[0]] = arguments[1];
    }
    return this;
};


/***
 *
 * @param {XRequestEventName|string | Object} name
 * @param {function=} callback
 * @returns {XRequest}
 */
XRequest.prototype.on = function (name, callback) {
    if (typeof name === "object") {
        Object.keys(name).forEach(function (key) {
            this.on(key, name[key]);
        }.bind(this))
        return this;
    }
    if (!this._events[name]) {
        this._events[name] = [];
    }
    this._events[name].push(callback);
    return this;
};

/***
 *
 * @param {XMLHttpRequestResponseType} code
 * @returns {XRequest}
 */
XRequest.prototype.mineType = function (code) {
    this._mineType = code;
    return this;
};


/****
 *
 * @param {XMLHttpRequestResponseType} type
 * @returns {XRequest}
 */
XRequest.prototype.responseType = function (type) {
    this._responseType = type;
    return this;
};


XRequest.prototype.json = function (data) {
    this.header("Content-Type", "application/json;charset=UTF-8");
    this._body = JSON.stringify(data);
    return this;
};

XRequest.prototype.form = function (data) {
    this._body = Object.keys(data).reduce(function (formData, key) {
        formData.append(key, data[key]);
        return formData;
    }, new FormData());
    return this;
};

XRequest.prototype.binary = function (data) {
    this.header("Content-Type", " application/octet-stream");
    this._body = data;
    return this;
};

/***
 *
 * @returns {Promise<XResponse>}
 */
XRequest.prototype.exec = function () {
    return new Promise(function (resolve, reject) {
        var xhr = makeXHRObject();
        Object.keys(this._events).forEach(function (name) {
            var callbacks = this._events[name];
            callbacks.forEach(function (cb) {
                (XRequestEventRoutes[name] || XRequestEventRoutes.default)(xhr, cb, name);
            }.bind(this));
        }.bind(this));
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                resolve(new XResponse(xhr));
            }
        };

        xhr.onerror = function () {
            var error = new Error("Network Error!");
            reject(error);
        };
        if (this._mineType)
            xhr.overrideMimeType(this._mineType);
        if (this._responseType)
            xhr.overrideMimeType(this._responseType);
        xhr.timeout = this._timeout;
        xhr.open(this._method, this._url, this._async);
        xhr.withCredentials = this._withCredentials;
        var headers = this._headers
        Object.keys(headers).forEach(function (key) {
            xhr.setRequestHeader(key, headers[key]);
        });
        xhr.send(this._body);
    }.bind(this));
};


export default XRequest;
