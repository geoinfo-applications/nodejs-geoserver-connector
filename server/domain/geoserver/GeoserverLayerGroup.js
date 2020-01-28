"use strict";

const _ = require("underscore");
const GeoserverRepository = require("./GeoserverRepository");


class GeoserverLayerGroup extends GeoserverRepository {

    async layerGroupExists(config) {
        return this.geoserverObjectExists(this.types.LAYERGROUP, config);
    }

    async getLayerGroup(config) {
        return this.getGeoserverObject(this.types.LAYERGROUP, config);
    }

    async createLayerGroup(config, allLayerNames) {
        if (await this.layerGroupExists(config)) {
            throw new Error("Layer Group already exists");
        }

        return this.issueLayerGroupCreateRequest(config, allLayerNames);
    }

    async issueLayerGroupCreateRequest(config, allLayerNames) {
        const deferred = this._makeDeferred();

        const restUrl = this.resolver.create(this.types.LAYERGROUP, config);
        const requestObject = JSON.stringify(this.layerGroupRequestObject(config, allLayerNames));

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
    }

    layerGroupRequestObject(config, allLayerNames) {
        const layers = _.map(allLayerNames, (layerName) => ({ enabled: true, name: layerName }));
        const styles = new Array(allLayerNames.length).fill("");

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
    }

    updateLayerGroup(config, allLayerNames) {
        const deferred = this._makeDeferred();

        const restUrl = this.resolver.get(this.types.LAYERGROUP, config);
        const requestObject = JSON.stringify(this.layerGroupRequestObject(config, allLayerNames));

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
    }

}

module.exports = GeoserverLayerGroup;
