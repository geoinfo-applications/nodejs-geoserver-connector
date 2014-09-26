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

// TODO refactor !!!
GeoserverResolver.prototype = {

    styles: function (type, config) {

        var requestUrl, wsName, storeName;
        var requestParams = [];

        if(type === "all"){
            requestUrl = "/styles.json";

        } else if (type === "layer") {
            requestUrl = "/layer/%s/styles.json";
            requestParams = [ config.name ];

        } else if (type === "workspace") {
            requestUrl = "/workspaces/%s/styles.json";
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

    create: function (type, config) {

        var requestUrl, requestParams, wsName, storeName;

        if (type === "layer") {
            requestUrl = "/workspaces/%s/datastores/%s/featuretypes.json";
            wsName = config && config.workspace || this.workspace;
            storeName = config && config.datastore || this.datastore;
            requestParams = [ wsName, storeName ];

        } else if (type === "datastore") {
            requestUrl = "/workspaces/%s/datastores.json";
            wsName = config && config.workspace || this.workspace;
            storeName = config && config.name || this.datastore;
            if (!config) {
                config = { name: storeName };
            }
            requestParams = [ wsName ];

        } else if (type === "workspace") {
            requestUrl = "/workspaces.json";
            wsName = config && config.name || this.workspace;
            if (!config) {
                config = { name: wsName };
            }
            requestParams = [];
        }

        requestParams.unshift(this.baseURL + requestUrl);

        return {
            url: util.format.apply(null, requestParams),
            config: config
        };

    },

    "get": function (type, config) {

        var requestUrl, wsName, storeName;
        var requestParams = [];

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