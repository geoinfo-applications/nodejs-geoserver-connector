"use strict";

var _ = require("underscore");
var util = require("util");

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

GeoserverResolver.prototype = {

    methodIsCreateOrNoConfig: function (method, config) {
        return method === "create" || !config;
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

    getWorkspaceParameters: function (config) {
        var workspaceName = config && config.name || this.workspace;
        return [ workspaceName ];
    },

    getWorkspaceStyleParameters: function (config) {
        var workspaceStyleName = config && config.name || "";
        var workspaceName = config && config.workspace || this.workspace;
        return [ workspaceName, workspaceStyleName ];
    },

    getStyleParameters: function (config) {
        var styleName = config.name;
        return [ styleName ];
    },

    resolveLayer: function (config) {
        return this.formatReturnUrl(
            this.restAPI.getLayer,
            this.getLayerParameters(config)
        );
    },

    resolveFeatureType: function (config, method) {

        var restUrl = this.restAPI.getFeatureType;
        var parameters = this.getFeatureTypeParameters(config);

        if (this.methodIsCreateOrNoConfig(method, config)) {
            restUrl = this.restAPI.getFeatureTypes;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveDatastore: function (config, method) {

        var restUrl = this.restAPI.getDatastore;
        var parameters = this.getDatastoreParameters(config);

        if (this.methodIsCreateOrNoConfig(method, config)) {
            restUrl = this.restAPI.getDatastores;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveWorkspace: function (config, method) {

        var restUrl = this.restAPI.getWorkspace;
        var parameters = [];

        if (config) {
            parameters = this.getWorkspaceParameters(config);
        }

        if (this.methodIsCreateOrNoConfig(method, config)) {
            restUrl = this.restAPI.getWorkspaces;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveWorkspaceStyle: function (config, method) {
        var restUrl = this.restAPI.getWorkspaceStyle;
        var parameters = this.getWorkspaceStyleParameters(config);

        if (this.methodIsCreateOrNoConfig(method, config)) {
            restUrl = this.restAPI.getWorkspaceStyles;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveStyle: function (config, method) {

        var restUrl = this.restAPI.getGlobalStyle;
        var parameters = [];

        if (config) {
            parameters = this.getStyleParameters(config);
        }

        if (this.methodIsCreateOrNoConfig(method, config)) {
            restUrl = this.restAPI.getGlobalStyles;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
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
            return this.resolveLayer(config, method);
        } else if (type === "featureType") {
            return this.resolveFeatureType(config, method);
        } else if (type === "datastore") {
            return this.resolveDatastore(config, method);
        } else if (type === "workspace") {
            return this.resolveWorkspace(config, method);
        } else if (type === "workspaceStyle") {
            return this.resolveWorkspaceStyle(config, method);
        } else if (type === "style") {
            return this.resolveStyle(config, method);
        }
    }
};

module.exports = GeoserverResolver;