"use strict";

var _ = require("underscore");
var util = require("util");

function GeoserverResolver(geoserverRepositoryConfig) {

    this.geoserverConfig = _.extend({}, geoserverRepositoryConfig);

    this.baseURL = this.geoserverConfig.restURL;
    this.datastore = this.geoserverConfig.datastore;
    this.workspace = this.geoserverConfig.workspace;

    this.restAPI = {

        about: "/about/version",
        reloadCatalog: "/reload",
        resetCache: "/reset",

        getWorkspaces: "/workspaces",
        getWorkspace: "/workspaces/%s",

        getDatastores: "/workspaces/%s/datastores",
        getDatastore: "/workspaces/%s/datastores/%s",

        getWmsStores: "/workspaces/%s/wmsstores/",
        getWmsStore: "/workspaces/%s/wmsstores/%s",

        getWmsLayers: "/workspaces/%s/wmsstores/%s/wmslayers",
        getWmsLayer: "/workspaces/%s/wmsstores/%s/wmslayers/%s",

        getWmtsStores: "/workspaces/%s/wmtsstores/",
        getWmtsStore: "/workspaces/%s/wmtsstores/%s",

        getWmtsLayers: "/workspaces/%s/wmtsstores/%s/wmtslayers",
        getWmtsLayer: "/workspaces/%s/wmtsstores/%s/wmtslayers/%s",

        getLayerGroups: "/layergroups",
        getLayerGroup: "/layergroups/%s",

        getCoverages: "/workspaces/%s/coveragestores/%s/coverages/%s",
        getCoverage: "/workspaces/%s/coveragestores/%s/coverages/%s",

        getCoverageStores: "/workspaces/%s/coveragestores/%s",
        getCoverageStore: "/workspaces/%s/coveragestores/%s",

        getFeatureTypes: "/workspaces/%s/datastores/%s/featuretypes",
        getFeatureType: "/workspaces/%s/datastores/%s/featuretypes/%s",

        getLayers: "/layers",
        getLayer: "/layers/%s:%s",

        getLayerStyles: "/layers/%s/styles",
        getLayerStyle: "/layers/%s/styles/%s",

        getStyles: "/styles",
        getStyle: "/styles/%s",

        getWorkspaceStyles: "/workspaces/%s/styles",
        getWorkspaceStyle: "/workspaces/%s/styles/%s",

        getFonts: "/fonts.json"
    };

    this.getResolvers = {
        resolveLayer: function (config, method) {

            var restUrl = this.restAPI.getLayer;
            var parameters = this.getParameters.getLayerParameters(config);

            if (method === "create") {
                restUrl = this.restAPI.getLayers;
                parameters = [];
            }

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveFeatureType: function (config, method) {

            var restUrl = this.restAPI.getFeatureType;
            var parameters = this.getParameters.getFeatureTypeParameters(config);

            if (this.methodIsCreateOrConfigDoesntExist(method, config)) {
                restUrl = this.restAPI.getFeatureTypes;
                parameters.pop();
            }

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveDatastore: function (config, method) {

            var restUrl = this.restAPI.getDatastore;
            var parameters = this.getParameters.getDatastoreParameters(config);

            if (method === "create") {
                restUrl = this.restAPI.getDatastores;
                parameters.pop();
            }

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveCoverage: function (config, method) {
            var restUrl = this.restAPI.getCoverage;
            var parameters = this.getParameters.getCoverageParameters(config);

            if (method === "create") {
                restUrl = this.restAPI.getCoverages;
            }

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveCoverageStore: function (config, method) {
            var restUrl = this.restAPI.getCoverageStore;
            var parameters = this.getParameters.getCoverageStoreParameters(config);

            if (method === "create") {
                restUrl = this.restAPI.getCoverageStores;
            }

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveWmsStore: function (config, method) {
            var restUrl = method === "create" ? this.restAPI.getWmsStores : this.restAPI.getWmsStore;
            var parameters = this.getParameters.getWmsStoreParameters(config, method);

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveWmsLayer: function (config, method) {
            var restUrl = method === "create" ? this.restAPI.getWmsLayers : this.restAPI.getWmsLayer;
            var parameters = this.getParameters.getWmsLayerParameters(config, method);
            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveWmtsStore: function (config, method) {
            var restUrl = method === "create" ? this.restAPI.getWmtsStores : this.restAPI.getWmtsStore;
            var parameters = this.getParameters.getWmtsStoreParameters(config, method);

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveWmtsLayer: function (config, method) {
            var restUrl = method === "create" ? this.restAPI.getWmtsLayers : this.restAPI.getWmtsLayer;
            var parameters = this.getParameters.getWmtsLayerParameters(config, method);
            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveLayerGroup: function (config, method) {
            var restUrl = method === "create" ? this.restAPI.getLayerGroups : this.restAPI.getLayerGroup;
            var parameters = this.getParameters.getLayerGroupParameters(config, method);
            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveWorkspace: function (config, method) {

            var restUrl = this.restAPI.getWorkspace;
            var parameters = this.getParameters.getWorkspaceParameters(config);

            if (method === "create") {
                restUrl = this.restAPI.getWorkspaces;
                parameters.pop();
            }

            var formattedUrl = this.formatReturnUrl(restUrl, parameters);

            return formattedUrl;
        },

        resolveWorkspaceStyle: function (config, method) {
            var restUrl = this.restAPI.getWorkspaceStyle;
            var parameters = this.getParameters.getWorkspaceStyleParameters(config);

            if (this.methodIsCreateOrConfigDoesntExist(method, config)) {
                restUrl = this.restAPI.getWorkspaceStyles;
                parameters.pop();
            }

            return this.formatReturnUrl(restUrl, parameters);
        },

        resolveStyle: function (config, method) {

            var restUrl = this.restAPI.getStyle;
            var parameters = [];

            if (config) {
                parameters = this.getParameters.getStyleParameters(config);
            }

            if (this.methodIsCreateOrConfigDoesntExist(method, config)) {
                restUrl = this.restAPI.getStyles;
                parameters.pop();
            }

            return this.formatReturnUrl(restUrl, parameters);
        }
    };

    this.getParameters = {
        getLayerParameters: function (config) {
            var workspaceName = this.resolveWorkspaceName(config);
            return [workspaceName, config.name];
        },

        getFeatureTypeParameters: function (config) {
            var datastoreName = config && config.datastore || this.datastore;
            var workspaceName = this.resolveWorkspaceName(config);
            return [workspaceName, datastoreName, config.name];
        },

        getDatastoreParameters: function (config) {
            var datastoreName = config && config.name || this.datastore;
            var workspaceName = this.resolveWorkspaceName(config);
            return [workspaceName, datastoreName];
        },

        getCoverageParameters: function (config) {
            var coverageName = config && config.name;
            var coverageStoreName = config && config.store;
            var workspaceName = this.resolveWorkspaceName(config);
            return [workspaceName, coverageStoreName, coverageName];
        },

        getCoverageStoreParameters: function (config) {
            var coverageStoreName = config.name;
            var workspaceName = this.resolveWorkspaceName(config);
            return [workspaceName, coverageStoreName];
        },

        getWmsStoreParameters: function (config, method) {
            var wmsStoreName = method === "create" ? void 0 : encodeURIComponent(config.name);
            var workspaceName = encodeURIComponent(this.resolveWorkspaceName(config));
            return _.compact([workspaceName, wmsStoreName]);
        },

        getWmsLayerParameters: function (config, method) {
            var wmsLayerName = method === "create" ? void 0 : config.layerName;
            var wmsStoreName = config.externalWmsService.name;
            var workspaceName = this.resolveWorkspaceName(config);
            return _.compact([workspaceName, wmsStoreName, wmsLayerName]);
        },

        getWmtsStoreParameters: function (config, method) {
            var wmtsStoreName = method === "create" ? void 0 : encodeURIComponent(config.name);
            var workspaceName = encodeURIComponent(this.resolveWorkspaceName(config));
            return _.compact([workspaceName, wmtsStoreName]);
        },

        getWmtsLayerParameters: function (config, method) {
            var wmtsLayerName = method === "create" ? void 0 : config.layerName;
            var wmtsStoreName = config.externalWmtsService.name;
            var workspaceName = this.resolveWorkspaceName(config);
            return _.compact([workspaceName, wmtsStoreName, wmtsLayerName]);
        },

        getLayerGroupParameters: function (config, method) {
            var layerGroupName = method === "create" ? void 0 : config.name;
            return _.compact([layerGroupName]);
        },

        getWorkspaceParameters: function (config) {
            var workspaceName = config && config.name || this.workspace;
            return [workspaceName];
        },

        getWorkspaceStyleParameters: function (config) {
            var workspaceStyleName = config && config.name || "";
            var workspaceName = this.resolveWorkspaceName(config);
            return [workspaceName, workspaceStyleName];
        },

        getStyleParameters: function (config) {
            var styleName = config.name;
            return [styleName];
        }
    };

    _.functions(this.getParameters).forEach(function (key) {
        this.getParameters[key] = this.getParameters[key].bind(this);
    }, this);

    _.functions(this.getResolvers).forEach(function (key) {
        this.getResolvers[key] = this.getResolvers[key].bind(this);
    }, this);

}

GeoserverResolver.prototype = {

    resolveWorkspaceName: function (config) {
        return config && config.workspace || this.workspace;
    },

    methodIsCreateOrConfigDoesntExist: function (method, config) {
        return method === "create" || !config;
    },

    formatReturnUrl: function (restApiCall, restParameters) {
        var parameters = restParameters.slice(0);
        var fullRestUrl = this.baseURL + restApiCall;

        parameters.unshift(fullRestUrl);
        return util.format.apply(null, parameters);
    },

    delete: function (type, config) {
        return this.get(type, config, "delete");
    },

    create: function (type, config) {
        return this.get(type, config, "create");
    },

    get: function (type, config, method) {

        method = method ? method : "get";

        return this.getResolvers["resolve" + type](config, method);
    }
};

module.exports = GeoserverResolver;
