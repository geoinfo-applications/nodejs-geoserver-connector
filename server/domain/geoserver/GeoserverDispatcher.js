"use strict";

const request = require("request");
const _ = require("underscore");


function GeoserverDispatcher(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.timeout = this.geoserverConfig.timeout;
    this.user = this.geoserverConfig.user;
    this.pass = this.geoserverConfig.pass;

    this.defaultContentType = "application/json";
}

GeoserverDispatcher.prototype = {

    // eslint-disable-next-line complexity
    get: function (config) {
        const geoserverRestCall = config.url;
        const callback = config.callback;

        if (!callback || !geoserverRestCall) {
            throw new Error("URL and Callback required");
        }

        const headers = addRequestHeaders.call(null, this.defaultContentType);
        if (config.headers) {
            _.extend(headers, config.headers);
        }

        request({
            uri: geoserverRestCall,
            method: config.method || "GET",
            body: config.body || undefined,
            headers: headers,
            timeout: this.timeout,
            auth: {
                user: this.user,
                pass: this.pass,
                sendImmediately: true
            }
        }, callback);

        function addRequestHeaders(defaultContentType) {
            const headers = {
                Accept: defaultContentType,
                "Content-type": config.contentType || defaultContentType
            };
            return headers;
        }
    },

    post: function (config) {
        this.get(_.extend({ method: "POST" }, config));
    },

    put: function (config) {
        this.get(_.extend({ method: "PUT" }, config));
    },

    delete: function (config) {
        this.get(_.extend({ method: "DELETE" }, config));
    }
};

module.exports = GeoserverDispatcher;
