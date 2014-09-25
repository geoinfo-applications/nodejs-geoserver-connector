"use strict";

var request = require("request");
var _ = require("underscore");
/*
 var Q = require("q");

 var util = require("util");
 */
function GeoserverDispatcher(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.baseURL = this.geoserverConfig.baseURL;
    this.timeout = this.geoserverConfig.timeout;
    this.user = this.geoserverConfig.user;
    this.pass = this.geoserverConfig.pass;
}

GeoserverDispatcher.prototype = {

    "get": function (config) {

        var geoserverRestCall = config.url;
        var callback = config.callback;

        if (!callback || !geoserverRestCall) {
            throw new Error("Url and callback required;");
        }

        request({
            uri: this.baseURL + geoserverRestCall,
            method: config.method || "GET",
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

    post: function (config) {
        this.get(_.extend({ method: "POST"}, config));
    },

    "delete": function (config) {
        this.get(_.extend({ method: "DELETE"}, config));
    }
};

module.exports = GeoserverDispatcher;