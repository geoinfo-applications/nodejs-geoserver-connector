"use strict";

var _ = require("underscore");

function GeoserverLegend(geoserverConfig) {

    this.baseURL = geoserverConfig.baseURL;
    this.defaultWorkspace = geoserverConfig.workspace;

    this.defaultWidth = 200;
    this.defaultHeight = 100;
    this.defaultImageFormat = "image/png";

    _.bindAll.apply(_, [this].concat(_.functions(this)));
}

GeoserverLegend.prototype = {

    getRuleUrl: function (config) {
        if (this.requiredRuleParametersDontExist(config)) {
            return this.rejectRequest("rule, style and layer name required");
        }
        return this.getBaseURL(config) + this.formatParameters(config).join("&");
    },

    getBaseURL: function (config) {
        var workspace = config && config.workspace || this.defaultWorkspace;
        return this.baseURL + workspace + "/wms?";
    },

    formatParameters: function (config) {

        var paramaters = [
            "REQUEST=GetLegendGraphic",
            "VERSION=1.0.0",
            "FORMAT=" + (config.format || this.defaultImageFormat),
            "WIDTH=" + (config.width || this.defaultWidth),
            "HEIGHT=" + (config.height || this.defaultHeight),
            "LAYER=" + config.layer
        ];

        var ruleName = config.name;
        var styleName = config.style;

        if (ruleName) {
            paramaters.push("RULE=" + ruleName);
        }
        if (styleName) {
            paramaters.push("STYLE=" + styleName);
        }
        return paramaters;
    },

    requiredRuleParametersDontExist: function (config) {
        if (!config || !config.name || !config.style || !config.layer) {
            return true;
        }
    },

    rejectRequest: function (errorMessage) {
        throw new Error(errorMessage);
    }

};

module.exports = GeoserverLegend;
