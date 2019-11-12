"use strict";


var Q = require("q");
var _ = require("underscore");


module.exports = function GeoserverWmsLayer() {

    this.resolveLayerConfig = function (config) {
        var wmsLayerName = config && config.layerName;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: wmsLayerName, workspace: workspaceName };
    };


    this.wmsLayerExists = function (layerSearchingParameters, wmsLayerSearchingParameters) {
        return Q.all([
            this.geoserverObjectExists(this.types.LAYER, layerSearchingParameters),
            this.geoserverObjectExists(this.types.WMSLAYER, wmsLayerSearchingParameters)
        ]).spread(function (layerExists, wmsLayerExists) {
            return Q.when(wmsLayerExists && layerExists);
        });
    };

    this.getWmsLayer = function (config) {
        return this.getGeoserverObject(this.types.WMSLAYER, config);
    };

    this.getWmsLayerRequestParameters = function (config, layerList) {
        var layers = layerList ? layerList : config.layerNames.split(",");

        return Q.all(_.map(layers, function (nativeName) {
            var layerConfig = _.clone(config);

            layerConfig.layerName = (config.externalWmsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
            layerConfig.nativeName = nativeName;

            var layerSearchingParameters = this.resolveLayerConfig(layerConfig);

            return {
                wmsLayerRequestParameters: layerConfig,
                layerRequestParameters: layerSearchingParameters
            };
        }.bind(this)));
    };

    this.createWmsLayer = function (externalWmsLayer) {
        return this.createNotExistingLayers(externalWmsLayer).then(function (allLayers) {
            return this.createLayerGroup(externalWmsLayer, allLayers);
        }.bind(this));
    };

    this.createNotExistingLayers = function (externalWmsLayer) {
        return this.getWmsLayerRequestParameters(externalWmsLayer).then(function (requestParameters) {
            return Q.all(_.map(requestParameters, function (requestParameter) {
                return this.makeSureLayerExists(requestParameter.layerRequestParameters, requestParameter.wmsLayerRequestParameters);
            }.bind(this)));
        }.bind(this));
    };

    this.makeSureLayerExists = function (searchingParameters, config) {
        return this.wmsLayerExists(searchingParameters, config).then(function (exists) {
            return Q.when(exists || this.issueWmsLayerCreateRequest(config)).then(function () {
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

    this.deleteWmsLayer = function (config) {
        return this.deleteGeoserverObject(this.types.LAYERGROUP, config).then(function () {
            return this.getWmsLayerRequestParameters(config).then(function (requestParameters) {
                return Q.all(_.map(requestParameters, function (requestParameter) {
                    return this.deleteWmsLayerEverywhere(requestParameter.layerRequestParameters,
                        requestParameter.wmsLayerRequestParameters);
                }.bind(this)));
            }.bind(this));
        }.bind(this));
    };

    this.deleteWmsLayerEverywhere = function (layerRequestParameters, wmsLayerRequestParameters) {
        return this.wmsLayerExists(layerRequestParameters, wmsLayerRequestParameters).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.LAYER, layerRequestParameters).then(function () {
                    return this.deleteGeoserverObject(this.types.WMSLAYER, wmsLayerRequestParameters);
                }.bind(this)).catch(function () {
                    return Q.when();
                });
            }
        }.bind(this));
    };

    this.updateWmsLayer = function (externalWmsLayer, existingExternalWmsLayer) {
        return this.layerGroupExists(externalWmsLayer).then(function (exists) {
            if (!exists) {
                return Q.reject("WmsLayer doesn't exist");
            }
            var layerNativeNames = externalWmsLayer.layerNames.split(",");
            var existingLayerNativeNames = existingExternalWmsLayer.layerNames.split(",");
            var layersToDelete = _.difference(existingLayerNativeNames, layerNativeNames);

            return this.createNotExistingLayers(externalWmsLayer).then(function (allLayerNames) {
                return this.updateLayerGroup(externalWmsLayer, allLayerNames);
            }.bind(this)).then(function () {
                return this.deleteAllUnnecessaryGeoserverLayers(externalWmsLayer, layersToDelete);
            }.bind(this));
        }.bind(this));
    };

    this.deleteAllUnnecessaryGeoserverLayers = function (externalWmsLayer, layersToDelete) {
        if (layersToDelete.length) {
            return this.getWmsLayerRequestParameters(externalWmsLayer, layersToDelete)
                .then(function (requestParameters) {
                return Q.all(_.map(requestParameters, function (requestParameter) {
                    return this.deleteWmsLayerEverywhere(requestParameter.layerRequestParameters,
                        requestParameter.wmsLayerRequestParameters);
                }.bind(this)));
            }.bind(this));
        }
        return new Q();
    };

};
