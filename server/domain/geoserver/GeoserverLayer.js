"use strict";

module.exports = function GeoserverLayer() {

    this.getLayer = function (config) {
        return this.getGeoserverObject("layer", config).then(function (layerObject) {
            return layerObject.layer;
        });
    };

    this.layerExists = function (config) {
        return this.geoserverObjectExists("layer", config);
    };

};