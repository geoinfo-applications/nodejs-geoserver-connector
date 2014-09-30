"use strict";

var Q = require("q");

module.exports = function GeoserverLayer() {

    this.getGlobalStyle = function (config) {
        return this.getGeoserverObject("style", config)
            .then(function (styleObject) {
                return styleObject.style;
            });
    };

    this.getGlobalStyles = function () {

        return this.getGeoserverObject("style")
            .then(function (styleObject) {
                return styleObject.styles.style;
            });
    };

    this.globalStyleExists = function (config) {
        return this.geoserverObjectExists("style", config);
    };

    this.createGlobalStyle = function (config) {
        config.styleType = "style";
        return this.createStyle(config);
    };

    this.createGlobalStyleConfiguration = function (config) {
        config.styleType = "style";
        return this.createStyleConfiguration(config);
    };

    this.uploadGlobalStyleContent = function (config) {
        config.styleType = "style";
        return this.uploadStyleContent(config);
    };

    this.deleteGlobalStyle = function (config) {
        return this.deleteGeoserverObject("style", config);
    };

    this.getWorkspaceStyle = function (config) {

        if (!config || !config.name) {
            return Q.reject(new Error("style name required"));
        }

        return this.getGeoserverObject("workspaceStyle", config)
            .then(function (styleObject) {
                return styleObject.style;
            });
    };

    this.getWorkspaceStyles = function () {

        return this.getGeoserverObject("workspaceStyle")
            .then(function (styleObject) {
                return styleObject.styles.style;
            });
    };

    this.workspaceStyleExists = function (config) {
        return this.geoserverObjectExists("workspaceStyle", config);
    };

    this.createWorkspaceStyle = function (config) {
        config.styleType = "workspaceStyle";
        return this.createStyle(config);
    };

    this.deleteWorkspaceStyle = function (styleName, config) {

    };

    this.getLayerDefaultStyle = function (config) {

        if (!config || !config.name) {
            return Q.reject(new Error("layer name required"));
        }

        return this.getLayer(config).then(function (layer) {
            return layer.defaultStyle;
        });
    };

    this.getLayerStyles = function (config) {

        if (!config || !config.name) {
            return Q.reject(new Error("layer name required"));
        }

        return this.getLayer(config).then(function (layer) {
            return layer.styles.style;
        });
    };

    this.setLayerDefaultStyle = function (config, styleName) {
        throw new Error();
        /*        return this.getLayer(config).then(function (layer) {
         deferred.resolve(layer.defaultStyle);
         }).catch(function (err) {
         console.error(err);
         deferred.reject(err);
         });*/

    };


    this.createStyle = function (config) {

        var uploadSLDContent = function () {
            return this.uploadStyleContent(config);
        }.apply(this, config);

        return this.createStyleConfiguration(config)
            .then(uploadSLDContent);
    };

    this.createStyleConfiguration = function (config) {

        if (!config || !config.name) {
            return Q.reject(new Error("style name required"));
        }

        var styleConfig = {
            name: config.name,
            filename: config.name + ".sld"
        };

        return this.createGeoserverObject(config.styleType, styleConfig);
    };

    this.uploadStyleContent = function (config) {

        var styleName = config && config.name;
        var sldBody = config && config.sldBody;
        var styleConfig = { name: styleName };

        if (!sldBody || !styleName) {
            return Q.reject(new Error("style name and sld content required"));
        }

        var restUrl = this.resolver.get(config.styleType, styleConfig);

        var deferred = Q.defer();

        function response(err, resp, body) {

            if (err) {
                deferred.reject(err);
            }

            if (resp.statusCode !== 200) {
                console.error("Error uploading style SLD file", body);
                deferred.reject(new Error(body));
            }

            //console.info("SLD file uploaded>", body);
            deferred.resolve(true);
        }

        this.dispatcher.put({url: restUrl, body: sldBody, callback: response});

        return deferred.promise;

    };

};