"use strict";

const GeoserverRepository = require("./GeoserverRepository");

const classes = [
    require("./GeoserverDatastore"),
    require("./GeoserverWmsStore"),
    require("./GeoserverWmsLayer"),
    require("./GeoserverWmtsStore"),
    require("./GeoserverWmtsLayer"),
    require("./GeoserverCoverageStore"),
    require("./GeoserverCoverage"),
    require("./GeoserverWorkspace"),
    require("./GeoserverFeatureType"),
    require("./GeoserverLayer"),
    require("./GeoserverLayerGroup"),
    require("./GeoserverStyle")
];


for (const mixin of classes) {

    const properties = Object.getOwnPropertyNames(mixin.prototype).filter((property) => property !== "constructor");

    for (const property of properties) {
        if (Object.hasOwnProperty.call(GeoserverRepository.prototype, property)) {
            throw new Error("Duplicate property: " + property);
        }

        GeoserverRepository.prototype[property] = mixin.prototype[property];
    }
}

module.exports = GeoserverRepository;
