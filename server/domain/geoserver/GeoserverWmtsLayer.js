"use strict";


var Q = require("q");
var _ = require("underscore");


module.exports = function GeoserverWmtsLayer() {

    this.resolveWmtsLayerConfig = function (config) {
        var wmtsLayerName = config && config.layerName;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: wmtsLayerName, workspace: workspaceName };
    };


    this.wmtsLayerExists = function (layerSearchingParameters, wmtsLayerSearchingParameters) {
        return Q.all([
            this.geoserverObjectExists(this.types.LAYER, layerSearchingParameters),
            this.geoserverObjectExists(this.types.WMTSLAYER, wmtsLayerSearchingParameters)
        ]).spread(function (layerExists, wmtsLayerExists) {
            return Q.when(wmtsLayerExists && layerExists);
        });
    };

    this.getWmtsLayer = function (config) {
        return this.getGeoserverObject(this.types.WMTSLAYER, config);
    };

    this.getWmtsLayerRequestParameters = function (config, layerList) {
        var layers = layerList ? layerList : config.layerNames.split(",");

        return Q.all(_.map(layers, function (nativeName) {
            var layerConfig = _.clone(config);

            layerConfig.layerName = (config.externalWmtsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
            layerConfig.nativeName = nativeName;

            var layerSearchingParameters = this.resolveWmtsLayerConfig(layerConfig);

            return {
                wmtsLayerRequestParameters: layerConfig,
                layerRequestParameters: layerSearchingParameters
            };
        }.bind(this)));
    };

    this.createWmtsLayer = function (externalWmtsLayer) {
        return this.createNotExistingWmtsLayers(externalWmtsLayer).then(function (allLayers) {
            return this.createLayerGroup(externalWmtsLayer, allLayers);
        }.bind(this));
    };

    this.createNotExistingWmtsLayers = function (externalWmtsLayer) {
        return this.getWmtsLayerRequestParameters(externalWmtsLayer).then(function (requestParameters) {
            return Q.all(_.map(requestParameters, function (requestParameter) {
                return this.makeSureWmtsLayerExists(requestParameter.layerRequestParameters, requestParameter.wmtsLayerRequestParameters);
            }.bind(this)));
        }.bind(this));
    };

    this.makeSureWmtsLayerExists = function (searchingParameters, config) {
        return this.wmtsLayerExists(searchingParameters, config).then(function (exists) {
            return Q.when(exists || this.issueWmtsLayerCreateRequest(config)).then(function () {
                return config.layerName;
            });
        }.bind(this));
    };

    this.issueWmtsLayerCreateRequest = function (config) {
        var deferred = Q.defer();

        var restUrl = this.resolver.create(this.types.WMTSLAYER, config);
        var requestObject = JSON.stringify(this.wmtsLayerRequestObject(config));

        this.dispatcher.post({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.WMTSLAYER
            })
        });

        return deferred.promise;
    };

    this.wmtsLayerRequestObject = function (config) {
        return {
            wmtsLayer: {
                name: config.layerName,
                nativeName: config.nativeName,
                namespace: config.nameSpace ? config.nameSpace : this.geoserver.workspace,
                srs: config.srs ? config.srs : "EPSG:2056",
                wmtsStore: { name: config.externalWmtsService.name },
                projectionPolicy: "REPROJECT_TO_DECLARED"
            }
        };
    };

    this.deleteWmtsLayer = function (config) {
        return this.deleteGeoserverObject(this.types.LAYERGROUP, config).then(function () {
            return this.getWmtsLayerRequestParameters(config).then(function (requestParameters) {
                return Q.all(_.map(requestParameters, function (requestParameter) {
                    return this.deleteWmtsLayerEverywhere(requestParameter.layerRequestParameters,
                        requestParameter.wmtsLayerRequestParameters);
                }.bind(this)));
            }.bind(this));
        }.bind(this));
    };

    this.deleteWmtsLayerEverywhere = function (layerRequestParameters, wmtsLayerRequestParameters) {
        return this.wmtsLayerExists(layerRequestParameters, wmtsLayerRequestParameters).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.LAYER, layerRequestParameters).then(function () {
                    return this.deleteGeoserverObject(this.types.WMTSLAYER, wmtsLayerRequestParameters);
                }.bind(this)).catch(function () {
                    return Q.when();
                });
            }
        }.bind(this));
    };

    this.updateWmtsLayer = function (externalWmtsLayer, existingExternalWmtsLayer) {
        return this.layerGroupExists(externalWmtsLayer).then(function (exists) {
            if (!exists) {
                return Q.reject("WmtsLayer doesn't exist");
            }
            var layerNativeNames = externalWmtsLayer.layerNames.split(",");
            var existingLayerNativeNames = existingExternalWmtsLayer.layerNames.split(",");
            var layersToDelete = _.difference(existingLayerNativeNames, layerNativeNames);

            return this.createNotExistingWmtsLayers(externalWmtsLayer).then(function (allLayerNames) {
                return this.updateLayerGroup(externalWmtsLayer, allLayerNames);
            }.bind(this)).then(function () {
                return this.deleteAllUnnecessaryGeoserverWmtsLayers(externalWmtsLayer, layersToDelete);
            }.bind(this));
        }.bind(this));
    };

    this.deleteAllUnnecessaryGeoserverWmtsLayers = function (externalWmtsLayer, layersToDelete) {
        if (layersToDelete.length) {
            return this.getWmtsLayerRequestParameters(externalWmtsLayer, layersToDelete)
                .then(function (requestParameters) {
                    return Q.all(_.map(requestParameters, function (requestParameter) {
                        return this.deleteWmtsLayerEverywhere(requestParameter.layerRequestParameters,
                            requestParameter.wmtsLayerRequestParameters);
                    }.bind(this)));
                }.bind(this));
        }
        return new Q();
    };

};
