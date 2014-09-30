"use strict";

module.exports = function GeoserverLayer() {

    this.getLayer = function (config) {
        return this.getGeoserverObject(this.types.LAYER, config).then(function (layerObject) {
            return layerObject.layer;
        });
    };

    this.layerExists = function (config) {
        return this.geoserverObjectExists(this.types.LAYER, config);
    };

};