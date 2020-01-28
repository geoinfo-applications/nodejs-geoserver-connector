"use strict";

const request = require("request");
const _ = require("underscore");


class GeoserverDispatcher {

    constructor(geoserverRepositoryConfig) {
        this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

        this.timeout = this.geoserverConfig.timeout;
        this.user = this.geoserverConfig.user;
        this.pass = this.geoserverConfig.pass;

        this.defaultContentType = "application/json";
    }

    // eslint-disable-next-line complexity
    get(config) {
        const geoserverRestCall = config.url;
        const callback = config.callback;

        if (!callback || !geoserverRestCall) {
            throw new Error("URL and Callback required");
        }

        const headers = this.addRequestHeaders(this.defaultContentType, config);

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
    }

    addRequestHeaders(defaultContentType, config) {
        return {
            Accept: defaultContentType,
            "Content-type": config.contentType || defaultContentType
        };
    }

    post(config) {
        this.get(_.extend({ method: "POST" }, config));
    }

    put(config) {
        this.get(_.extend({ method: "PUT" }, config));
    }

    delete(config) {
        this.get(_.extend({ method: "DELETE" }, config));
    }
}


module.exports = GeoserverDispatcher;
