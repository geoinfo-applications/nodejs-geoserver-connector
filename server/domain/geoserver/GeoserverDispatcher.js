"use strict";

var request = require("request");
var _ = require("underscore");

function GeoserverDispatcher(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.timeout = this.geoserverConfig.timeout;
    this.user = this.geoserverConfig.user;
    this.pass = this.geoserverConfig.pass;
}

GeoserverDispatcher.prototype = {

    "get": function (config) {

        var geoserverRestCall = config.url;
        var callback = config.callback;

        if (!callback || !geoserverRestCall) {
            throw new Error("URL and Callback required");
        }

        request({
            uri: geoserverRestCall,
            method: config.method || "GET",
            body: config.body || undefined,
            headers: {
                "Content-type": "text/json"
            },
            timeout: this.timeout,
            auth: {
                user: this.user,
                pass: this.pass,
                sendImmediately: true
            }
        }, callback);
    },

    "post": function (config) {
        this.get(
            _.extend({ method: "POST" }, config));
    },

    "put": function (config) {
        this.get(
            _.extend({ method: "PUT" }, config));
    },

    "delete": function (config) {
        this.get(_.extend({ method: "DELETE" }, config));
    }
};

module.exports = GeoserverDispatcher;