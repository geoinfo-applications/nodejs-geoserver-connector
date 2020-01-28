"use strict";

const GeoserverRepository = require("./GeoserverRepository");
const _ = require("underscore");


class GeoserverWmtsLayer extends GeoserverRepository {

    resolveWmtsLayerConfig(config) {
        const wmtsLayerName = config && config.layerName;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: wmtsLayerName, workspace: workspaceName };
    }


    async wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters) {
        return Promise.all([
            this.geoserverObjectExists(this.types.LAYER, layerSearchingParameters),
            this.geoserverObjectExists(this.types.WMTSLAYER, wmtsLayerSearchingParameters)
        ]).then(([layerExists, wmtsLayerExists]) => {
            return !!(wmtsLayerExists && layerExists);
        });
    }

    async getWmtsLayer(config) {
        return this.getGeoserverObject(this.types.WMTSLAYER, config);
    }

    async getWmtsLayerRequestParameters(config, layerList) {
        const layers = layerList ? layerList : config.layerNames.split(",");

        return Promise.all(_.map(layers, (nativeName) => {
            const layerConfig = _.clone(config);

            layerConfig.layerName = (config.externalWmtsService.name + "_" + nativeName).replace(/[^A-Za-z0-9_-]/g, "_");
            layerConfig.nativeName = nativeName;

            const layerSearchingParameters = this.resolveWmtsLayerConfig(layerConfig);

            return {
                wmtsLayerRequestParameters: layerConfig,
                layerRequestParameters: layerSearchingParameters
            };
        }));
    }

    async createWmtsLayer(externalWmtsLayer) {
        const allLayers = await this.createNotExistingWmtsLayers(externalWmtsLayer);
        return this.createLayerGroup(externalWmtsLayer, allLayers);
    }

    async createNotExistingWmtsLayers(externalWmtsLayer) {
        const requestParameters = await this.getWmtsLayerRequestParameters(externalWmtsLayer);

        return Promise.all(_.map(requestParameters, (requestParameter) => {
            return this.makeSureWmtsLayerExists(requestParameter.layerRequestParameters, requestParameter.wmtsLayerRequestParameters);
        }));
    }

    async makeSureWmtsLayerExists(searchingParameters, config) {
        if (!await this.wmtsLayerExists(searchingParameters, config)) {
            await this.issueWmtsLayerCreateRequest(config);
        }

        return config.layerName;
    }

    async issueWmtsLayerCreateRequest(config) {
        const deferred = this._makeDeferred();

        const restUrl = this.resolver.create(this.types.WMTSLAYER, config);
        const requestObject = JSON.stringify(this.wmtsLayerRequestObject(config));

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
    }

    wmtsLayerRequestObject(config) {
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
    }

    async deleteWmtsLayer(config) {
        await this.deleteGeoserverObject(this.types.LAYERGROUP, config);
        const requestParameters = await this.getWmtsLayerRequestParameters(config);

        return Promise.all(_.map(requestParameters, (requestParameter) => {
            return this.deleteWmtsLayerEverywhere(requestParameter.layerRequestParameters, requestParameter.wmtsLayerRequestParameters);
        }));
    }

    async deleteWmtsLayerEverywhere(layerRequestParameters, wmtsLayerRequestParameters) {
        const exists = await this.wmtsLayerExists(layerRequestParameters, wmtsLayerRequestParameters);

        if (!exists) {
            return;
        }

        try {
            await this.deleteGeoserverObject(this.types.LAYER, layerRequestParameters);
            return this.deleteGeoserverObject(this.types.WMTSLAYER, wmtsLayerRequestParameters);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    async updateWmtsLayer(externalWmtsLayer, existingExternalWmtsLayer) {
        const exists = await this.layerGroupExists(externalWmtsLayer);

        if (!exists) {
            throw new Error("WmtsLayer doesn't exist");
        }

        const layerNativeNames = externalWmtsLayer.layerNames.split(",");
        const existingLayerNativeNames = existingExternalWmtsLayer.layerNames.split(",");
        const layersToDelete = _.difference(existingLayerNativeNames, layerNativeNames);
        const allLayerNames = await this.createNotExistingWmtsLayers(externalWmtsLayer);
        await this.updateLayerGroup(externalWmtsLayer, allLayerNames);

        return this.deleteAllUnnecessaryGeoserverWmtsLayers(externalWmtsLayer, layersToDelete);
    }

    async deleteAllUnnecessaryGeoserverWmtsLayers(externalWmtsLayer, layersToDelete) {
        if (!layersToDelete.length) {
            return;
        }

        const requestParameters = await this.getWmtsLayerRequestParameters(externalWmtsLayer, layersToDelete);

        return Promise.all(_.map(requestParameters, (requestParameter) => {
            return this.deleteWmtsLayerEverywhere(requestParameter.layerRequestParameters, requestParameter.wmtsLayerRequestParameters);
        }));
    }

}

module.exports = GeoserverWmtsLayer;
