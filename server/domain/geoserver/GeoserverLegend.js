"use strict";

var Q = require("q");

function requiredParamtersDontExist(config) {
    if (!config || !config.name || config.style) {
        return true;
    }
}

function rejectRequest(errorMessage) {
    return Q.reject(new Error(errorMessage));
}

module.exports = function GeoserverLegend() {

    this.getRuleGraphic = function (config) {

        if (requiredParamtersDontExist(config)) {
            return rejectRequest("rule and style name required");
        }

        var ruleName = config && config.name;
        var styleName = config && config.style;
        var workspace = config && config.workspace;

        return this.getGeoserverObject(this.types.LEGENDGRAPHIC, config)
            .then(function (styleObject) {
                return styleObject.style;
            });
    };

    this.getGlobalStyles = function () {
        return this.getGeoserverObject(this.types.STYLE)
            .then(function (styleObject) {
                return styleObject.styles.style || [];
            });
    };

};
