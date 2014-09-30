"use strict";

var _ = require("underscore");
var util = require("util");

function GeoserverResolver(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.baseURL = this.geoserverConfig.baseURL;
    this.datastore = this.geoserverConfig.datastore;
    this.workspace = this.geoserverConfig.workspace;

    this.restAPI = {

        getWorkspaces: "/workspaces.json",
        getWorkspace: "/workspaces/%s.json",

        getDatastores: "/workspaces/%s/datastores.json",
        getDatastore: "/workspaces/%s/datastores/%s.json",

        getFeatureTypes: "/workspaces/%s/datastores/%s/featuretypes.json",
        getFeatureType: "/workspaces/%s/datastores/%s/featuretypes/%s.json",

        getLayers: "/layers.json",
        getLayer: "/layers/%s.json",

        getLayerStyles: "/layers/%s/styles.json",
        getLayerStyle: "/layers/%s/styles/%s.json",

        getGlobalStyles: "/styles.json",
        getGlobalStyle: "/styles/%s.json",

        getWorkspaceStyles: "/workspaces/%s/styles.json",
        getWorkspaceStyle: "/workspaces/%s/styles/%s.json",
    };

}

GeoserverResolver.prototype = {

    methodIsCreateOrConfigNotExist: function (method, config) {
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

        if (this.methodIsCreateOrConfigNotExist(method, config)) {
            restUrl = this.restAPI.getFeatureTypes;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveDatastore: function (config, method) {

        var restUrl = this.restAPI.getDatastore;
        var parameters = this.getDatastoreParameters(config);

        if (method === "create") {
            restUrl = this.restAPI.getDatastores;
            parameters.pop();
        }

        return this.formatReturnUrl(restUrl, parameters);
    },

    resolveWorkspace: function (config, method) {

        var restUrl = this.restAPI.getWorkspace;
        var parameters = this.getWorkspaceParameters(config);

        if (method === "create") {
            restUrl = this.restAPI.getWorkspaces;
            parameters.pop();
        }

        var formattedUrl = this.formatReturnUrl(restUrl, parameters);

        return formattedUrl;
    },

    resolveWorkspaceStyle: function (config, method) {
        var restUrl = this.restAPI.getWorkspaceStyle;
        var parameters = this.getWorkspaceStyleParameters(config);

        if (this.methodIsCreateOrConfigNotExist(method, config)) {
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

        if (this.methodIsCreateOrConfigNotExist(method, config)) {
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

        return this["resolve" + type](config, method);
    }
};

module.exports = GeoserverResolver;