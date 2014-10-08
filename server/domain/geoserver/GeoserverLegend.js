"use strict";

var _ = require("underscore");

function GeoserverLegend(geoserverConfig) {

    this.baseURL = geoserverConfig.wmsURL;
    this.WORKSPACE = "visualizers";
    this.DEFAULT_LAYER = "DEFAULT_LEGEND_LAYER";

    this.defaultWidth = 100;
    this.defaultHeight = 30;
    this.defaultImageFormat = "image/png";

    _.bindAll.apply(_, [this].concat(_.functions(this)));
}

GeoserverLegend.prototype = {

    getRuleUrl: function (config) {
        if (this.requiredRuleParametersDontExist(config)) {
            return this.rejectRequest("rule and style name required");
        }
        return this.baseURL + this.formatParameters(config).join("&");
    },

    formatParameters: function (config) {

        var ruleName = config.name;
        var styleName = config.style;
        var workspace = config.workspace || this.WORKSPACE;
        var layer = config.layer || this.DEFAULT_LAYER;

        var paramaters = [
            "REQUEST=GetLegendGraphic",
            "VERSION=1.0.0",
            "FORMAT=" + (config.format || this.defaultImageFormat),
            "WIDTH=" + (config.width || this.defaultWidth),
            "HEIGHT=" + (config.height || this.defaultHeight),
            "LAYER=" + workspace + ":" + layer
        ];

        if (ruleName) {
            paramaters.push("RULE=" + ruleName);
        }
        if (styleName) {
            paramaters.push("STYLE=" + styleName);
        }
        return paramaters;
    },

    requiredRuleParametersDontExist: function (config) {
        if (!config || !config.name || !config.style) {
            return true;
        }
    },

    rejectRequest: function (errorMessage) {
        throw new Error(errorMessage);
    }

};

module.exports = GeoserverLegend;
