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
            headers: addRequestHeaders(),
            timeout: this.timeout,
            auth: {
                user: this.user,
                pass: this.pass,
                sendImmediately: true
            }
        }, callback);

        function addRequestHeaders() {
            var headers = { "Accept": "application/json" };
            if(config.contentType){
                headers["Content-type"] = config.contentType;
            }
            return headers;
        }
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