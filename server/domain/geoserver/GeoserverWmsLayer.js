"use strict";

const GeoserverRepository = require("./GeoserverRepository");
const _ = require("underscore");


class GeoserverWmsLayer extends GeoserverRepository {

    resolveWmsLayerConfig(config) {
        const wmsLayerName = config && config.layerName;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: wmsLayerName, workspace: workspaceName };
    }


    async wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters) {
        return Promise.all([
            this.geoserverObjectExists(this.types.LAYER, layerSearchingParameters),
            this.geoserverObjectExists(this.types.WMSLAYER, wmsLayerSearchingParameters)
        ]).then(([layerExists, wmsLayerExists]) => {
            return !!(wmsLayerExists && layerExists);
        });
    }

    async getWmsLayer(config) {
        return this.getGeoserverObject(this.types.WMSLAYER, config);
    }

    async getWmsLayerRequestParameters(config, layerList) {
        const layers = layerList ? layerList : config.layerNames.split(",");

        return Promise.all(_.map(layers, (nativeName) => {
            const layerConfig = _.clone(config);

            layerConfig.layerName = (config.externalWmsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
            layerConfig.nativeName = nativeName;

            const layerSearchingParameters = this.resolveWmsLayerConfig(layerConfig);

            return {
                wmsLayerRequestParameters: layerConfig,
                layerRequestParameters: layerSearchingParameters
            };
        }));
    }

    async createWmsLayer(externalWmsLayer) {
        const allLayers = await this.createNotExistingWmsLayers(externalWmsLayer);
        return this.createLayerGroup(externalWmsLayer, allLayers);
    }

    async createNotExistingWmsLayers(externalWmsLayer) {
        const requestParameters = await this.getWmsLayerRequestParameters(externalWmsLayer);

        return Promise.all(_.map(requestParameters, (requestParameter) => {
            return this.makeSureWmsLayerExists(requestParameter.layerRequestParameters, requestParameter.wmsLayerRequestParameters);
        }));
    }

    async makeSureWmsLayerExists(searchingParameters, config) {
        if (!await this.wmsLayerExists(searchingParameters, config)) {
            await this.issueWmsLayerCreateRequest(config);
        }

        return config.layerName;
    }

    async issueWmsLayerCreateRequest(config) {
        const deferred = this._makeDeferred();

        const restUrl = this.resolver.create(this.types.WMSLAYER, config);
        const requestObject = JSON.stringify(this.wmsLayerRequestObject(config));

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
    }

    wmsLayerRequestObject(config) {
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
    }

    async deleteWmsLayer(config) {
        await this.deleteGeoserverObject(this.types.LAYERGROUP, config);
        const requestParameters = await this.getWmsLayerRequestParameters(config);

        return Promise.all(_.map(requestParameters, (requestParameter) => {
            return this.deleteWmsLayerEverywhere(requestParameter.layerRequestParameters, requestParameter.wmsLayerRequestParameters);
        }));
    }

    async deleteWmsLayerEverywhere(layerRequestParameters, wmsLayerRequestParameters) {
        const exists = await this.wmsLayerExists(layerRequestParameters, wmsLayerRequestParameters);

        if (!exists) {
            return;
        }

        try {
            await this.deleteGeoserverObject(this.types.LAYER, layerRequestParameters);
            return this.deleteGeoserverObject(this.types.WMSLAYER, wmsLayerRequestParameters);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    async updateWmsLayer(externalWmsLayer, existingExternalWmsLayer) {
        const exists = await this.layerGroupExists(externalWmsLayer);

        if (!exists) {
            throw new Error("WmsLayer doesn't exist");
        }

        const layerNativeNames = externalWmsLayer.layerNames.split(",");
        const existingLayerNativeNames = existingExternalWmsLayer.layerNames.split(",");
        const layersToDelete = _.difference(existingLayerNativeNames, layerNativeNames);
        const allLayerNames = await this.createNotExistingWmsLayers(externalWmsLayer);
        await this.updateLayerGroup(externalWmsLayer, allLayerNames);

        return this.deleteAllUnnecessaryGeoserverWmsLayers(externalWmsLayer, layersToDelete);
    }

    async deleteAllUnnecessaryGeoserverWmsLayers(externalWmsLayer, layersToDelete) {
        if (!layersToDelete.length) {
            return;
        }

        const requestParameters = await this.getWmsLayerRequestParameters(externalWmsLayer, layersToDelete);

        return Promise.all(_.map(requestParameters, (requestParameter) => {
            return this.deleteWmsLayerEverywhere(requestParameter.layerRequestParameters, requestParameter.wmsLayerRequestParameters);
        }));
    }

}

module.exports = GeoserverWmsLayer;
