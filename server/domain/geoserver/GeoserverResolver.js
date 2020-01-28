"use strict";

const _ = require("underscore");
const util = require("util");


class GeoserverResolver {

    constructor(geoserverRepositoryConfig) {
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

            resolveLayer: (config, method) => {
                let restUrl = this.restAPI.getLayer;
                let parameters = this.getParameters.getLayerParameters(config);

                if (method === "create") {
                    restUrl = this.restAPI.getLayers;
                    parameters = [];
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveFeatureType: (config, method) => {
                let restUrl = this.restAPI.getFeatureType;
                const parameters = this.getParameters.getFeatureTypeParameters(config);

                if (this.methodIsCreateOrConfigDoesntExist(method, config)) {
                    restUrl = this.restAPI.getFeatureTypes;
                    parameters.pop();
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveDatastore: (config, method) => {
                let restUrl = this.restAPI.getDatastore;
                const parameters = this.getParameters.getDatastoreParameters(config);

                if (method === "create") {
                    restUrl = this.restAPI.getDatastores;
                    parameters.pop();
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveCoverage: (config, method) => {
                let restUrl = this.restAPI.getCoverage;
                const parameters = this.getParameters.getCoverageParameters(config);

                if (method === "create") {
                    restUrl = this.restAPI.getCoverages;
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveCoverageStore: (config, method) => {
                let restUrl = this.restAPI.getCoverageStore;
                const parameters = this.getParameters.getCoverageStoreParameters(config);

                if (method === "create") {
                    restUrl = this.restAPI.getCoverageStores;
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveWmsStore: (config, method) => {
                const restUrl = method === "create" ? this.restAPI.getWmsStores : this.restAPI.getWmsStore;
                const parameters = this.getParameters.getWmsStoreParameters(config, method);

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveWmsLayer: (config, method) => {
                const restUrl = method === "create" ? this.restAPI.getWmsLayers : this.restAPI.getWmsLayer;
                const parameters = this.getParameters.getWmsLayerParameters(config, method);
                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveWmtsStore: (config, method) => {
                const restUrl = method === "create" ? this.restAPI.getWmtsStores : this.restAPI.getWmtsStore;
                const parameters = this.getParameters.getWmtsStoreParameters(config, method);

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveWmtsLayer: (config, method) => {
                const restUrl = method === "create" ? this.restAPI.getWmtsLayers : this.restAPI.getWmtsLayer;
                const parameters = this.getParameters.getWmtsLayerParameters(config, method);
                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveLayerGroup: (config, method) => {
                const restUrl = method === "create" ? this.restAPI.getLayerGroups : this.restAPI.getLayerGroup;
                const parameters = this.getParameters.getLayerGroupParameters(config, method);
                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveWorkspace: (config, method) => {
                let restUrl = this.restAPI.getWorkspace;
                const parameters = this.getParameters.getWorkspaceParameters(config);

                if (method === "create") {
                    restUrl = this.restAPI.getWorkspaces;
                    parameters.pop();
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveWorkspaceStyle: (config, method) => {
                let restUrl = this.restAPI.getWorkspaceStyle;
                const parameters = this.getParameters.getWorkspaceStyleParameters(config);

                if (this.methodIsCreateOrConfigDoesntExist(method, config)) {
                    restUrl = this.restAPI.getWorkspaceStyles;
                    parameters.pop();
                }

                return this.formatReturnUrl(restUrl, parameters);
            },

            resolveStyle: (config, method) => {
                let restUrl = this.restAPI.getStyle;
                let parameters = [];

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
            getLayerParameters: (config) => {
                const workspaceName = this.resolveWorkspaceName(config);
                return [workspaceName, config.name];
            },

            getFeatureTypeParameters: (config) => {
                const datastoreName = config && config.datastore || this.datastore;
                const workspaceName = this.resolveWorkspaceName(config);
                return [workspaceName, datastoreName, config.name];
            },

            getDatastoreParameters: (config) => {
                const datastoreName = config && config.name || this.datastore;
                const workspaceName = this.resolveWorkspaceName(config);
                return [workspaceName, datastoreName];
            },

            getCoverageParameters: (config) => {
                const coverageName = config && config.name;
                const coverageStoreName = config && config.store;
                const workspaceName = this.resolveWorkspaceName(config);
                return [workspaceName, coverageStoreName, coverageName];
            },

            getCoverageStoreParameters: (config) => {
                const coverageStoreName = config.name;
                const workspaceName = this.resolveWorkspaceName(config);
                return [workspaceName, coverageStoreName];
            },

            getWmsStoreParameters: (config, method) => {
                const wmsStoreName = method === "create" ? void 0 : encodeURIComponent(config.name);
                const workspaceName = encodeURIComponent(this.resolveWorkspaceName(config));
                return _.compact([workspaceName, wmsStoreName]);
            },

            getWmsLayerParameters: (config, method) => {
                const wmsLayerName = method === "create" ? void 0 : config.layerName;
                const wmsStoreName = config.externalWmsService.name;
                const workspaceName = this.resolveWorkspaceName(config);
                return _.compact([workspaceName, wmsStoreName, wmsLayerName]);
            },

            getWmtsStoreParameters: (config, method) => {
                const wmtsStoreName = method === "create" ? void 0 : encodeURIComponent(config.name);
                const workspaceName = encodeURIComponent(this.resolveWorkspaceName(config));
                return _.compact([workspaceName, wmtsStoreName]);
            },

            getWmtsLayerParameters: (config, method) => {
                const wmtsLayerName = method === "create" ? void 0 : config.layerName;
                const wmtsStoreName = config.externalWmtsService.name;
                const workspaceName = this.resolveWorkspaceName(config);
                return _.compact([workspaceName, wmtsStoreName, wmtsLayerName]);
            },

            getLayerGroupParameters: (config, method) => {
                const layerGroupName = method === "create" ? void 0 : config.name;
                return _.compact([layerGroupName]);
            },

            getWorkspaceParameters: (config) => {
                const workspaceName = config && config.name || this.workspace;
                return [workspaceName];
            },

            getWorkspaceStyleParameters: (config) => {
                const workspaceStyleName = config && config.name || "";
                const workspaceName = this.resolveWorkspaceName(config);
                return [workspaceName, workspaceStyleName];
            },

            getStyleParameters: (config) => {
                const styleName = config.name;
                return [styleName];
            }
        };

        _.functions(this.getParameters).forEach((key) => {
            this.getParameters[key] = this.getParameters[key].bind(this);
        });

        _.functions(this.getResolvers).forEach((key) => {
            this.getResolvers[key] = this.getResolvers[key].bind(this);
        });

    }

    resolveWorkspaceName(config) {
        return config && config.workspace || this.workspace;
    }

    methodIsCreateOrConfigDoesntExist(method, config) {
        return method === "create" || !config;
    }

    formatReturnUrl(restApiCall, restParameters) {
        const parameters = restParameters.slice(0);
        const fullRestUrl = this.baseURL + restApiCall;

        parameters.unshift(fullRestUrl);
        return util.format(...parameters);
    }

    delete(type, config) {
        return this.get(type, config, "delete");
    }

    create(type, config) {
        return this.get(type, config, "create");
    }

    get(type, config, method) {
        method = method ? method : "get";

        return this.getResolvers["resolve" + type](config, method);
    }
}


module.exports = GeoserverResolver;
