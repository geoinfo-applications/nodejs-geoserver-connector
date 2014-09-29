"use strict";

var Q = require("q");

module.exports = function GeoserverLayer() {

    this.getGlobalStyle = function (config) {
        return this.getGeoserverObject("style", config).then(function (styleObject) {
            return styleObject.style;
        });
    };

    this.modifyGlobalStyle = function (config) {
        return this.getGeoserverObject("style", config).then(function (styleObject) {
            return styleObject.style;
        });
    };

    this.getGlobalStyles = function () {

        var deferred = Q.defer();

        function response(err, resp, body) {

            if (err || resp.statusCode !== 200) {
                deferred.reject(new Error(err || body));
            }

            var receivedObject = JSON.parse(body);
            deferred.resolve(receivedObject.styles.style);
        }

        this.dispatcher.get({
            url: this.resolver.styles("all").url,
            callback: response
        });

        return deferred.promise;
    };

    this.getWorkspaceStyle = function (styleName, config) {

        if (!styleName) {
            return Q.reject(new Error("style name required"));
        }

        return this.getWorkspaceStyles(config).then(function (styles) {
            if (styles && styles.some(styleName)) {
                return true;
            }
            return false;
        });
    };

    this.getWorkspaceStyles = function (config) {

        var deferred = Q.defer();

        function response(err, resp, body) {

            if (err || resp.statusCode !== 200) {
                deferred.reject(new Error(err || body));
            }

            var receivedObject = JSON.parse(body);
            deferred.resolve(receivedObject.styles);
        }

        var gsObject = this.resolver.styles("workspace", config);

        this.dispatcher.get({
            url: gsObject.url,
            callback: response
        });

        return deferred.promise;
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

    this.setLayerDefaultStyle = function (config, styleName ) {

/*        return this.getLayer(config).then(function (layer) {
            deferred.resolve(layer.defaultStyle);
        }).catch(function (err) {
            console.error(err);
            deferred.reject(err);
        });*/

    };

    this.getLayerStyles = function (config) {
        throw new Error();
    };

    this.createWorkspaceStyle = function (styleName, config) {
        var deferred = Q.defer();

        var styleConfig = {
            style: {
                name: styleName,
                workspace: { },
                filename: styleName + ".sld"
            }
        };

        function response(err, resp, body) {
            if (err || resp.statusCode !== 201) {
                deferred.reject(new Error(err || body));
            }
            deferred.resolve(true);
        }

        var gsObject = this.resolver.styles("workspace", config);

        styleConfig.style.workspace.name = gsObject.config.name;
        var payload = JSON.stringify(styleConfig);

        this.dispatcher.post({
            url: gsObject.url,
            body: payload,
            callback: response
        });

        return deferred.promise;
    };

    this.deleteWorkspaceStyle = function (styleName, config) {

        var deferred = Q.defer();

        var styleConfig = {
            style: {
                name: styleName,
                filename: styleName + ".sld"
            }
        };

        if (!config) {
            config = {};
        }

        config.name = styleName;

        function response(err, resp, body) {
            if (err || resp.statusCode !== 200) {
                deferred.reject(new Error(err || body));
            }
            deferred.resolve(true);
        }

        var gsObject = this.resolver.styles("style", config);

        if (config && config.deleteStyleFile) {
            gsObject.url += "?purge=true";
        }

        var payload = JSON.stringify(styleConfig);

        this.dispatcher.delete({
            url: gsObject.url,
            body: payload,
            callback: response
        });

        return deferred.promise;
    };

    this.uploadStyleContent = function (config) {
        throw new Error();
    };

};