"use strict";

var _ = require("underscore");
var util = require("util");

//var Q = require("q");


function GeoserverResolver(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.baseURL = this.geoserverConfig.baseURL;
    this.datastore = this.geoserverConfig.datastore;
    this.workspace = this.geoserverConfig.workspace;

    this.baseRestAPI = {
        datastores: "/workspaces/%s/datastores",
        datastore: "/workspaces/%s/datastores/%s"
    };

    this.restAPI = {

        getWorkspaces: "/workspaces",
        createWorkspaces: "/workspaces",
        getWorkspace: "/workspaces/%s",
        modifyWorkspace: "/workspaces/%s",	//PUT
        deleteWorkspace: "/workspaces/%s",

        getDatastores: "/workspaces/%s/datastores",
        getDatastore: "/workspaces/%s/datastores/%s",
        createDatastore: "/workspaces/%s/datastores",
        modifyDatastore: "/workspaces/%s/datastores/%s",
        deleteDatastore: "/workspaces/%s/datastores/%s",

        getFeatureTypes: "/workspaces/%s/datastores/%s/featuretypes",
        createFeatureType: "/workspaces/%s/datastores/%s/featuretypes",
        getFeatureType: "/workspaces/%s/datastores/%s/featuretypes/%s",
        modifyFeatureType: "/workspaces/%s/datastores/%s/featuretypes/%s",
        deleteFeatureType: "/workspaces/%s/datastores/%s/featuretypes/%s",

        getLayers: "/layers",
        createLayer: "/layers",
        getLayer: "/layers/%s",
        modifyLayer: "/layers/%s",	//PUT
        deleteLayer: "/layers/%s",

        getLayerStyles: "/layers/%s/styles",
        addLayerStyle: "/layers/%s/styles",	//POST

        getGlobalStyles: "/styles",
        createGlobalStyle: "/styles",		//POST
        getGlobalStyle: "/styles/%s",
        uploadGlobalStyleSLD: "/styles/%s",		//PUT
        deleteGlobalStyle: "/styles/%s",

        getWorkspaceStyles: "/workspaces/%s/styles",
        createWorkspaceStyle: "/workspaces/%s/styles",	//POST
        getWorkspaceStyle: "/workspaces/%s/styles/%s",
        uploadWorkspaceStyleSLD: "/workspaces/%s/styles/%s",	//PUT
        deleteWorkspaceStyle: "/workspaces/%s/styles/%s"
    };

}

// TODO refactor !!!
GeoserverResolver.prototype = {

    methodNotCreate: function (method) {
        return method !== "create";
    },

    formatReturnUrl: function (restApiCall, parameters) {
        var fullRestUrl = this.baseURL + restApiCall;

        parameters.unshift(fullRestUrl);
        return util.format.apply(null, parameters);
    },

    getLayerParameters: function (config) {
        return [ config.name ];
    },

    getFeatureTypeParameters: function (config) {
        var datastoreName = config && config.datastore || this.datastore;
        var workspaceName = config && config.workspace || this.workspace;
        return [ workspaceName, datastoreName, config.name ];
    },

    getDatastoreParameters: function (config) {
        var datastoreName = config && config.name || this.datastore;
        var workspaceName = config && config.workspace || this.workspace;
        return [ workspaceName, datastoreName ];
    },

    getWorkspaceParameters: function (config, method) {
        var workspaceName = config && config.name || this.workspace;
        return [ workspaceName ];
    },

    getStyleParameters: function (config) {
        var styleName = config.name;
        return [ styleName ];
    },

    resolveLayer: function (config, method) {
        return this.formatReturnUrl(
            this.restAPI.getLayer,
            this.getLayerParameters(config)
        );
    },

    resolveFeatureType: function (config, method) {

        var restUrl = this.restAPI.getFeatureTypes;
        var parameters = this.getFeatureTypeParameters(config);

        if (this.methodNotCreate(method)) {
            restUrl = this.restAPI.getFeatureType;
        } else {
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveDatastore: function (config, method) {

        var restUrl = this.restAPI.getDatastores;
        var parameters = this.getDatastoreParameters(config);

        if (this.methodNotCreate(method)) {
            restUrl = this.restAPI.getDatastore;
        } else {
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveWorkspace: function (config, method) {

        var restUrl = this.restAPI.getWorkspaces;
        var parameters = this.getWorkspaceParameters(config);

        if (this.methodNotCreate(method)) {
            restUrl = this.restAPI.getWorkspace;
        } else {
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveStyle: function (config, method) {

        var restUrl = this.restAPI.getGlobalStyles;
        var parameters = this.getStyleParameters(config);

        if (this.methodNotCreate(method)) {
            restUrl = this.restAPI.getGlobalStyle;
        } else {
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    styles: function (type, config) {

        var requestUrl, wsName, storeName;
        var requestParams = [];

        if (type === "all") {
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

        } else if (type === "style") {
            requestUrl = "/workspaces/%s/styles/%s.json";
            wsName = config && config.wsName || this.workspace;
            if (!config) {
                config = { name: wsName };
            }
            requestParams = [ wsName, config.name ];
        }

        requestParams.unshift(this.baseURL + requestUrl);

        return {
            url: util.format.apply(null, requestParams),
            config: config
        };

    },

    "delete": function (type, config) {
        return this.get(type, config, "delete");
    },

    "create": function (type, config) {
        return this.get(type, config, "create");
    },

    "get": function (type, config, method) {

        if (!method) {
            method = "get";
        }

        if (type === "layer") {
            return this.resolveLayer(config, method)
        } else if (type === "featureType") {
            return this.resolveFeatureType(config, method);
        } else if (type === "datastore") {
            return this.resolveDatastore(config, method);
        } else if (type === "workspace") {
            return this.resolveWorkspace(config, method);
        } else if (type === "style") {
            return this.resolveStyle(config, method);
        }
        /*
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
         */
    }
};

module.exports = GeoserverResolver;