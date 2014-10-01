"use strict";

var Q = require("q");

function nameDoesntExist(config) {
    if (!config || !config.name) {
        return true;
    }
}

function rejectRequest(errorMessage) {
    return Q.reject(new Error(errorMessage));
}

module.exports = function GeoserverLayer() {

    this.getGlobalStyle = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }
        return this.getGeoserverObject(this.types.STYLE, config)
            .then(function (styleObject) {
                return styleObject.style;
            });
    };

    this.getGlobalStyles = function () {
        return this.getGeoserverObject(this.types.STYLE)
            .then(function (styleObject) {
                return styleObject.styles.style;
            });
    };

    this.globalStyleExists = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }
        return this.geoserverObjectExists(this.types.STYLE, config);
    };

    this.createGlobalStyle = function (config) {
        this.defineGlobalStyle(config);
        return this.createStyle(config);
    };

    this.createGlobalStyleConfiguration = function (config) {
        this.defineGlobalStyle(config);
        return this.createStyleConfiguration(config);
    };

    this.uploadGlobalStyleContent = function (config) {
        this.defineGlobalStyle(config);
        return this.uploadStyleContent(config);
    };

    this.deleteGlobalStyle = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }
        return this.globalStyleExists(config).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.STYLE, config);
            }
            return true;
        }.bind(this))
    };

    this.getWorkspaceStyle = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }
        return this.getGeoserverObject(this.types.WORKSPACESTYLE, config)
            .then(function (styleObject) {
                return styleObject.style;
            });
    };

    this.getWorkspaceStyles = function (config) {
        return this.getGeoserverObject(this.types.WORKSPACESTYLE, config)
            .then(function (styleObject) {
                return styleObject.styles.style;
            });
    };

    this.workspaceStyleExists = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }
        return this.geoserverObjectExists(this.types.WORKSPACESTYLE, config);
    };

    this.createWorkspaceStyle = function (config) {
        this.defineWorkspaceStyle(config);
        return this.createStyle(config);
    };

    this.createWorkspaceStyleConfiguration = function (config) {
        this.defineWorkspaceStyle(config);
        return this.createStyleConfiguration(config);
    };

    this.uploadWorkspaceStyleContent = function (config) {
        this.defineWorkspaceStyle(config);
        return this.uploadStyleContent(config);
    };

    this.deleteWorkspaceStyle = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }

        return this.workspaceStyleExists(config).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.WORKSPACESTYLE, config);
            }
            return true;
        }.bind(this))

        return this.deleteGeoserverObject(this.types.WORKSPACESTYLE, config);
    };

    this.getLayerDefaultStyle = function (config) {

        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }
        return this.getLayer(config).then(function (layer) {
            return layer.defaultStyle;
        });
    };

    this.getLayerStyles = function (config) {

        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }

        return this.getLayer(config).then(function (layer) {
            return layer.styles.style;
        });
    };

//    this.setLayerDefaultStyle = function (config) {
//        throw new Error();
//    };
//
//    this.addLayerStyle = function (config) {
//        throw new Error();
//    };
//
//    this.removeLayerStyle = function (config) {
//        throw new Error();
//    };
//
//    this.deleteLayerStyle = function (config) {
//        throw new Error();
//    };

    this.defineGlobalStyle = function (config) {
        if (config) {
            config.styleType = this.types.STYLE;
        }
    };

    this.defineWorkspaceStyle = function (config) {
        if (config) {
            config.styleType = this.types.WORKSPACESTYLE;
        }
    };

    this.createStyle = function (config) {

        var uploadSLDContent = function () {
            return this.uploadStyleContent(config);
        }.bind(this, config);

        return this.createStyleConfiguration(config)
            .then(uploadSLDContent);

    };

    this.createStyleConfiguration = function (config) {

        if (nameDoesntExist(config)) {
            return rejectRequest("layer name required");
        }

        var styleConfig = {
            style: {
                name: config.name,
                filename: config.name + ".sld"
            }
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

        this.dispatcher.put({
            url: restUrl,
            body: sldBody,
            callback: response,
            contentType: "application/vnd.ogc.sld+xml"
        });

        return deferred.promise;

    };

};