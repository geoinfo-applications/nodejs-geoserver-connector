"use strict";


class GeoserverLegend {

    constructor(geoserverConfig) {
        this.baseURL = geoserverConfig.baseURL;
        this.defaultWorkspace = geoserverConfig.workspace;

        this.defaultWidth = 200;
        this.defaultHeight = 100;
        this.defaultImageFormat = "image/png";
    }

    getRuleUrl(config) {
        if (this.requiredRuleParametersDontExist(config)) {
            throw new Error("rule, style and layer name required");
        }

        return this.getBaseURL(config) + this.formatParameters(config).join("&");
    }

    getBaseURL(config) {
        const workspace = config && config.workspace || this.defaultWorkspace;
        return this.baseURL + workspace + "/wms?";
    }

    // eslint-disable-next-line complexity
    formatParameters(config) {
        const paramaters = [
            "REQUEST=GetLegendGraphic",
            "VERSION=1.0.0",
            "FORMAT=" + (config.format || this.defaultImageFormat),
            "WIDTH=" + (config.width || this.defaultWidth),
            "HEIGHT=" + (config.height || this.defaultHeight),
            "LAYER=" + config.layer,
            "TRANSPARENT=true"
        ];

        const ruleName = config.name;
        const styleName = config.style;

        if (ruleName) {
            paramaters.push("RULE=" + ruleName);
        }
        if (styleName) {
            paramaters.push("STYLE=" + styleName);
        }
        return paramaters;
    }

    requiredRuleParametersDontExist(config) {
        return !(config && config.name && config.style && config.layer);
    }

}


module.exports = GeoserverLegend;
