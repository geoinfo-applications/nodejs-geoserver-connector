"use strict";

var _ = require("underscore");
var util = require("util");

//var Q = require("q");


function GeoserverResolver(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.baseURL = this.geoserverConfig.baseURL;
    this.datastore = this.geoserverConfig.datastore;
    this.workspace = this.geoserverConfig.workspace;

}

GeoserverResolver.prototype = {
    "get": function (type, config) {

        var requestUrl, requestParams, wsName, storeName;

        if (type === "layer") {
            requestUrl = "/workspaces/%s/datastores/%s/featuretypes/%s.json";
            wsName = config && config.workspace || this.workspace;
            storeName = config && config.datastore || this.datastore;
            requestParams = [ wsName, storeName, config.name ];

        } else if (type === "datastore") {
            requestUrl = "/workspaces/%s/datastores/%s.json";
            wsName = config && config.workspace || this.workspace;
            storeName = config && config.name || this.datastore;
            if (!config) {
                config = { name: storeName };
            }
            requestParams = [ wsName, storeName ];

        } else if (type === "workspace") {
            requestUrl = "/workspaces/%s.json";
            wsName = config && config.name || this.workspace;
            if (!config) {
                config = { name: wsName };
            }
            requestParams = [ wsName ];
        }

        requestParams.unshift(this.baseURL + requestUrl);

        return {
            url: util.format.apply(null, requestParams),
            config: config
        };
    },
};

module.exports = GeoserverResolver;