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

    this.deleteGlobalStyle = function (config) {
        return this.deleteGeoserverObject("style", config);
    };

    this.createGlobalStyle = function (config) {

        var uploadSLDContent = function () {
            return this.uploadGlobalStyleContent(config);
        }.apply(this, config);

        return this.createGlobalStyleConfiguration(config)
            .then(uploadSLDContent);
    };

    this.createGlobalStyleConfiguration = function (config) {

        var styleConfig = {
            name: config.name,
            filename: config.name + ".sld"
        };

        return this.createGeoserverObject("style", styleConfig);
    };

    this.uploadGlobalStyleContent = function (config) {

        var styleConfig = { name: config.name };
        var sldBody = config.sldBody;

        if (!sldBody) {
            return Q.reject(new Error("sld content required"));
        }

        var restUrl = this.resolver.get("style", styleConfig);

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

    this.createWorkspaceStyle = function (styleName, config) {

    };

    this.deleteWorkspaceStyle = function (styleName, config) {

    };


    this.getLayerDefaultStyle = function (config) {

        if (!config || !config.name) {
            return Q.reject(new Error("layer name required"));
        }

        var deferred = Q.defer();

        this.getLayer(config).then(function (layer) {
            deferred.resolve(layer.defaultStyle);
        }).catch(function (err) {
            console.error(err);
            deferred.reject(err);
        });

        return deferred.promise;
    };

    this.getLayerStyles = function (config) {
        throw new Error();
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


};