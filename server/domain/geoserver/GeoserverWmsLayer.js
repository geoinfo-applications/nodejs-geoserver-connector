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

    this.layerGroupExists = function (config) {
        return this.geoserverObjectExists(this.types.LAYERGROUP, config);
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
        return this.wmsLayerExists(searchingParameters, config).then(function (exists) {
            return Q.when(!exists && this.issueWmsLayerCreateRequest(config)).then(function () {
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

        var styles = new Array(allLayerNames.length).fill("");

        return {
            layerGroup: {
                name: config.name,
                title: config.label,
                layers: {
                    layer: layers
                },
                styles: {
                    style: styles
                }
            },
            srs: config.srs ? config.srs : "EPSG:2056",
            projectionPolicy: "REPROJECT_TO_DECLARED"
        };
    };


    this.updateWmsLayer = function (externalWmsLayer, existingExternalWmsLayer) {
        return this.layerGroupExists(externalWmsLayer).then(function (exists) {
            if (!exists) {
                return Q.reject("WmsLayer doesn't exist");
            }

            var layerNativeNames = externalWmsLayer.layerNames.split(",");
            var existingLayerNativeNames = existingExternalWmsLayer.layerNames.split(",");

            var layersToDelete = _.compact(_.difference(existingLayerNativeNames, layerNativeNames));

            return Q.all(_.map(layerNativeNames, function (nativeName) {
                var layerConfig = _.clone(externalWmsLayer);

                layerConfig.layerName = (externalWmsLayer.externalWmsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
                layerConfig.nativeName = nativeName;

                var layerSearchingParameters = this.resolveLayerConfig(layerConfig);

                return  this.makeSureLayerExists(layerSearchingParameters, layerConfig);
            }.bind(this))).then(function (allLayersNames) {
                return this.issueLayerGroupUpdateRequest(allLayersNames, externalWmsLayer);
            }.bind(this)).then(function () {
                if (layersToDelete.length) {
                    return Q.all(_.map(layersToDelete, function (nativeName) {
                        var layerConfig = _.clone(externalWmsLayer);

                        layerConfig.layerName = (externalWmsLayer.externalWmsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
                        layerConfig.nativeName = nativeName;

                        var layerDeletingParameters = this.resolveLayerConfig(layerConfig);

                        return this.wmsLayerExists(layerDeletingParameters, layerConfig).then(function (exists) {
                            if (exists) {
                                return this.deleteWmsLayerFromLayerList(layerDeletingParameters).then(function () {
                                    return this.deleteWmsLayerFromWmsStore(layerConfig);
                                }.bind(this)).catch(function () {
                                    return Q.when();
                                });
                            }
                            return;
                        }.bind(this));
                    }.bind(this)));
                }
                return;
            }.bind(this));
        }.bind(this));
    };

    this.issueLayerGroupUpdateRequest = function (allLayerNames, config) {

        var deferred = Q.defer();

        var restUrl = this.resolver.get(this.types.LAYERGROUP, config);
        var requestObject = JSON.stringify(this.layerGroupRequestObject(allLayerNames, config));

        this.dispatcher.put({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 200,
                errorMessage: "Error updating Geoserver object:" + this.types.LAYERGROUP
            })
        });

        return deferred.promise;
    };

    this.deleteWmsLayer = function (config) {
        var layerNames = config.layerNames.split(",");

        return this.deleteLayerGroup(config).then(function () {
            return Q.all(_.map(layerNames, function (nativeName) {
                var layerConfig = _.clone(config);


                layerConfig.layerName = (config.externalWmsService.name + "_" + nativeName)
                    .replace(/[^A-Za-z0-9_-]/g, "_");
                layerConfig.nativeName = nativeName;

                var layerDeletingParameters = this.resolveLayerConfig(layerConfig);

                return this.wmsLayerExists(layerDeletingParameters, layerConfig).then(function (exists) {
                    if (exists) {
                        return this.deleteWmsLayerFromLayerList(layerDeletingParameters).then(function () {
                            return this.deleteWmsLayerFromWmsStore(layerConfig);
                        }.bind(this));
                    }
                    return;
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
