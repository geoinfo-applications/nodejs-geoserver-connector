"use strict";

var Q = require("q");
var _ = require("underscore");

module.exports = function GeoserverLayer() {

    this.getLayer = function (config) {
        return this.getGeoserverObject("layer", config);
    };

};