"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverLayer extends GeoserverRepository {

    async getLayer(config) {
        const layerObject = await this.getGeoserverObject(this.types.LAYER, config);
        return layerObject.layer;
    }

    async updateLayer(config) {
        return this.updateGeoserverObject(this.types.LAYER, config);
    }

    async layerExists(config) {
        return this.geoserverObjectExists(this.types.LAYER, config);
    }

}

module.exports = GeoserverLayer;
