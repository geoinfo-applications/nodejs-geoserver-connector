"use strict";


var Q = require("q");
var _ = require("underscore");


module.exports = function GeoserverLayerGroup() {

    this.layerGroupExists = function (config) {
        return this.geoserverObjectExists(this.types.LAYERGROUP, config);
    };

    this.getLayerGroup = function (config) {
        return this.getGeoserverObject(this.types.LAYERGROUP, config);
    };

    this.createLayerGroup = function (config, allLayerNames) {
        return this.layerGroupExists(config).then(function (exists) {
            if (exists) {
                return Q.reject("Layer Group already exists");
            }
            return this.issueLayerGroupCreateRequest(config, allLayerNames);
        }.bind(this));
    };

    this.issueLayerGroupCreateRequest = function (config, allLayerNames) {
        var deferred = Q.defer();

        var restUrl = this.resolver.create(this.types.LAYERGROUP, config);
        var requestObject = JSON.stringify(this.layerGroupRequestObject(config, allLayerNames));

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

    this.layerGroupRequestObject = function (config, allLayerNames) {
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

    this.updateLayerGroup = function (config, allLayerNames) {
        var deferred = Q.defer();

        var restUrl = this.resolver.get(this.types.LAYERGROUP, config);
        var requestObject = JSON.stringify(this.layerGroupRequestObject(config, allLayerNames));

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

};
