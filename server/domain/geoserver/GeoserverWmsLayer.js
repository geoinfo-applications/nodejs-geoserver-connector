"use strict";


var Q = require("q");
var _ = require("underscore");


module.exports = function GeoserverWmsLayer() {

    this.resolveLayerConfig = function (config) {
        var wmsLayerName = config && config.layerName;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: wmsLayerName, workspace: workspaceName };
    };


    this.wmsLayerExists = function (config) {
        return this.geoserverObjectExists(this.types.WMSLAYER, config);
    };

    this.getWmsLayers = function (config) {
        var wmsLayerName = config.name;
        var workspace = config.workspace ? config.workspace : this.geoserver.workspace;

        var wmsLayerConfig = { name: wmsLayerName, workspace: workspace };

        return this.getGeoserverObject(this.types.WMSLAYER, wmsLayerConfig).then(function (wmsLayerObject) {
            return wmsLayerObject;
        });
    };

    this.createWmsLayer = function (config) {
        var layers = config.layerNames.split(",");

        return Q.all(_.map(layers, function (nativeName) {
            var layerConfig = _.clone(config);

            layerConfig.layerName = (config.externalWmsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
            layerConfig.nativeName = nativeName;

            var layerSearchingParameters = this.resolveLayerConfig(layerConfig);

            return this.makeSureLayerExists(layerSearchingParameters, layerConfig);
        }.bind(this))).then(function (allLayers) {
            return this.issueLayerGroupCreateRequest(allLayers, config);
        }.bind(this));
    };

    this.makeSureLayerExists = function (searchingParameters, config) {
        return Q.all([
            this.geoserverObjectExists(this.types.LAYER, searchingParameters),
            this.geoserverObjectExists(this.types.WMSLAYER, config)
        ]).spread(function (layerExists, wmsLayerExists) {
            return Q.when(!(wmsLayerExists || layerExists) && this.issueWmsLayerCreateRequest(config)).then(function () {
                return config.layerName;
            });
        }.bind(this));
    };

    this.issueWmsLayerCreateRequest = function (config) {
        var deferred = Q.defer();

        var restUrl = this.resolver.create(this.types.WMSLAYER, config);
        var requestObject = JSON.stringify(this.wmsLayerRequestObject(config));

        this.dispatcher.post({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.WMSLAYER
            })
        });

        return deferred.promise;
    };

    this.wmsLayerRequestObject = function (config) {
        return {
            wmsLayer: {
                name: config.layerName,
                nativeName: config.nativeName,
                namespace: config.nameSpace ? config.nameSpace : this.geoserver.workspace,
                srs: config.srs ? config.srs : "EPSG:2056",
                wmsStore: { name: config.externalWmsService.name },
                projectionPolicy: "REPROJECT_TO_DECLARED"
            }
        };
    };

    this.issueLayerGroupCreateRequest = function (allLayerNames, config) {
        var deferred = Q.defer();

        var restUrl = this.resolver.create(this.types.LAYERGROUP, config);
        var requestObject = JSON.stringify(this.layerGroupRequestObject(allLayerNames, config));

        this.dispatcher.post({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.LAYERGROUP
            })
        });

        return deferred.promise;
    };

    this.layerGroupRequestObject = function (allLayerNames, config) {
        var layers = _.map(allLayerNames, function (layerName) {
            return { enabled: true, name: layerName };
        });

        return {
            layerGroup: {
                name: config.name,
                title: config.label,
                layers: {
                    layer: layers
                }
            },
            srs: config.srs ? config.srs : "EPSG:2056",
            projectionPolicy: "REPROJECT_TO_DECLARED"
        };
    };


    this.updateWmsLayer = function (config) {
        return this.wmsLayerExists(config).then(function (exists) {
            if (!exists) {
                return Q.reject("WmsLayer doesn't exist");
            }

            return this.issueWmslLayerUpdateRequest(config);
        }.bind(this));
    };

    this.issueWmslLayerUpdateRequest = function (config) {

        if (!config || !config.updatedConfig) {
            return Q.reject("updatedConfig parameter required");
        }
        var restUrl = this.resolver.get(this.types.COVERAGE, config);

        var deferred = Q.defer();
        this.dispatcher.put({
            url: restUrl,
            body: JSON.stringify(config.updatedConfig),
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error Updating Geoserver object:" + this.types.WMSLAYER
            })
        });

        return deferred.promise;
    };

    this.deleteWmsLayer = function (config) {
        var layers = config.layerNames.split(",");

        return this.deleteLayerGroup(config).then(function () {
            return Q.all(_.map(layers, function (layer) {
                config.layerName = (config.externalWmsService.name + "_" + layer).replace(/[^A-Za-z0-9_-]/g, "_");

                var layerDeletingParameters = this.resolveLayerConfig(config);

                return this.deleteWmsLayerFromLayerList(layerDeletingParameters).then(function () {
                    return this.deleteWmsLayerFromWmsStore(config);
                }.bind(this));
            }.bind(this)));
        }.bind(this));

    };


    this.deleteLayerGroup = function (config) {
        var deferred = Q.defer();
        var restUrl = this.resolver.delete(this.types.LAYERGROUP, config);

        this.dispatcher.delete({
            url: restUrl,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error deleting Geoserver object" + this.types.LAYERGROUP
            })
        });

        return deferred.promise;
    };

    this.deleteWmsLayerFromLayerList = function (deletingParameters) {
        var deferred = Q.defer();
        var restUrl = this.resolver.delete(this.types.LAYER, deletingParameters);

        this.dispatcher.delete({
            url: restUrl,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error deleting Geoserver object:" + this.types.LAYER
            })
        });

        return deferred.promise;
    };

    this.deleteWmsLayerFromWmsStore = function (deletingParameters) {
        var deferred = Q.defer();
        var restUrl = this.resolver.delete(this.types.WMSLAYER, deletingParameters);

        this.dispatcher.delete({
            url: restUrl,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error deleting Geoserver object:" + this.types.WMSLAYER
            })
        });

        return deferred.promise;
    };

};
