"use strict";

var _ = require("underscore");
var express = require("express");
var timeout = require("connect-timeout");
var bodyParser = require("body-parser");
var xml2js = require("xml2js");
var config = require("./config.js");

function GeoserverMockServer() {

    var options = config.unit_test.geoserver;

    this.gsMockServer = express();
    this.gsMockServer.use(bodyParser.urlencoded({ extended: false }));
    this.gsMockServer.use(bodyParser.json());
    this.gsMockServer.use(timeout(180 * 1000));

    this.mockServer = null;

    this.gsOptions = _.extend({}, options);
    if (this.gsOptions.context && !/^.*\/$/.test(this.gsOptions.context)) {
        this.gsOptions.context += "/";
    } else {
        this.gsOptions.context = "";
    }
    if (this.gsOptions.adminPath && !/^.*\/$/.test(this.gsOptions.adminPath)) {
        this.gsOptions.adminPath += "/";
    } else {
        this.gsOptions.adminPath = "";
    }
    this.baseURL = "/" + this.gsOptions.context + this.gsOptions.adminPath;
    this.restURL = this.baseURL + "rest";
    this.wmsURL = this.baseURL + "wms";

    this.geoserverRestGetAPI = {
        getLayerStyles: "/layers/:layer/styles",
        getFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer",
        getWorkspace: "/workspaces/:ws"
    };

    this.geoserverRestPostAPI = {
        createWorkspace: "/workspaces",
        createDatastore: "/workspaces/:ws/datastores",
        createFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes",
        createGlobalStyle: "/styles",
        createWorkspaceStyles: "/workspaces/:ws/styles"
    };

    this.geoserverRestDeleteAPI = {
        deleteLayer: "/layers/:layer",
        deleteFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer",
        deleteStyle: "/styles/:style",
        deleteWorkspaceStyle: "/workspaces/:ws/styles/:style"
    };

    this.geoserverRestPutAPI = {
        updateFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer"
    };

    this.geoserverRestAPI = {
        getLayer: "/layers/*",
        getGlobalStyle: "/styles/:style",
        getGlobalStyles: "/styles",
        getWorkspaceStyle: "/workspaces/:ws/styles/:style",
        getWorkspaceStyles: "/workspaces/:ws/styles",
        getInstanceDetails: "/about/version",
        reloadCatalog: "/reload",
        resetCache: "/reset",

        uploadGlobalStyle: "/styles/:style",
        uploadWorkspaceStyle: "/workspaces/:ws/styles/:style"
    };

    this.geoserverWmsAPI = {
        getLegendGraphic: "/wms?REQUEST=GetLegendGraphic*"
    };

    this.files = {
        style: require("./responses/getStyle"),
        styles: require("./responses/getStyles"),
        layer: require("./responses/getLayer")
    };

    this.handlers = {
        getStyle: function (req, res) {
            if (req.params.style !== config.style.name) {
                res.status(404);
            }
            var response = this.files.style;
            response.style.name = config.style.name;
            response.style.filename = config.style.filename;
            res.json(this.files.style);
        }.bind(this),

        getStyles: function (req, res) {
            res.json(this.files.styles);
        }.bind(this),

        putStyle: function (req, res) {

            if (!isContentTypeHeaderSLD(req)) {
                res.status(404).json("Content type must be set to application/vnd.ogc.sld+xml");
            }

            var buf = "";
            req.setEncoding("utf8");
            req.on("data", function (chunk) {
                buf += chunk;
            });
            req.on("end", function () {
                xml2js.parseString(buf, function (err, sldContent) {

                    if (err || isNotValidSldContent()) {
                        res.status(404).json(false);
                    } else {
                        res.status(200).json(true);
                    }

                    function isNotValidSldContent() {
                        try {
                            var rootElement = sldContent.StyledLayerDescriptor;
                            var namedLayer = rootElement.NamedLayer[0];
                            return namedLayer.Name[0] !== config.layer.name;
                        } catch (err) {
                            return false;
                        }
                    }
                });
            });
        }.bind(this),

        putLayer: function (req, res) {

            try {
                var defaultStyleName = req.body.layer.defaultStyle.name;
                res.status(200).json(defaultStyleName);
            } catch (err) {
                res.status(501).send("Layer configuration object not valid");
            }
        },

        getLayer: function (req, res) {

            var files = this.files;
            var layerName;

            try {
                layerName = resolveLayerName();

                if (layerName === config.layer.name) {
                    handleExistingLayer();
                } else {
                    handleNonExistingLayer();
                }

            } catch (err) {
                res.status(501).json(err);
                return;
            }

            function resolveLayerName() {
                var layerParameters = req.params[0] && req.params[0].split(":");

                if (layerParameters.length === 1) {
                    return layerParameters[0];
                } else if (layerParameters.length === 2) {
                    return layerParameters[1];
                } else {
                    throw new Error("More then 2 parameters found");
                }
            }

            function handleExistingLayer() {
                var response = files.layer;
                response.layer.name = config.layer.name;
                response.layer.defaultStyle.name = config.layer.defaultStyleName;
                response.layer.styles = files.styles.styles;
                res.status(200).json(response);
            }

            function handleNonExistingLayer() {
                res.status(404).send("No such layer: " + layerName);
            }
        }
    };

    _.functions(this.handlers).forEach(function (key) {
        this.handlers[key] = this.handlers[key].bind(this);
    }, this);

}

GeoserverMockServer.prototype = {

    listen: function (done) {
        this.mockServer = this.gsMockServer.listen(this.gsOptions.port, function () {
            done();
        });
    },

    tearDown: function () {
        try {
            this.mockServer.close();
            this.mockServer = null;
        } catch (err) {
            // already closed
            console.err(err);
        }
    },

    getRestUrl: function (restCall) {
        return this.restURL + restCall;
    },

    addDefaultRequestHandlers: function () {

        _.forEach(this.geoserverRestGetAPI, function (geoserverAPICall) {
            this.gsMockServer.get(this.getRestUrl(geoserverAPICall), function (req, res) {
                checkJSONHeaders(req, res);
            });
        }.bind(this));

        _.forEach(this.geoserverRestPostAPI, function (geoserverAPICall) {
            this.gsMockServer.post(this.getRestUrl(geoserverAPICall), function (req, res) {
                res.status(201).json(true);
            });
        }.bind(this));

        _.forEach(this.geoserverRestPutAPI, function (geoserverAPICall) {
            this.gsMockServer.put(this.getRestUrl(geoserverAPICall), function (req, res) {
                res.status(200).json(true);
            });
        }.bind(this));

        _.forEach(this.geoserverRestDeleteAPI, function (geoserverAPICall) {
            this.gsMockServer.delete(this.getRestUrl(geoserverAPICall), function (req, res) {
                checkJSONHeaders(req, res);
            });
        }.bind(this));

        this.gsMockServer.route(this.getRestUrl(this.geoserverRestAPI.getLayer))
            .get(this.handlers.getLayer)
            .put(this.handlers.putLayer);

        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getGlobalStyle), this.handlers.getStyle);
        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getWorkspaceStyle), this.handlers.getStyle);

        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getGlobalStyles), this.handlers.getStyles);
        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getWorkspaceStyles), this.handlers.getStyles);

        this.gsMockServer.put(this.getRestUrl(this.geoserverRestAPI.uploadGlobalStyle), this.handlers.putStyle);
        this.gsMockServer.put(this.getRestUrl(this.geoserverRestAPI.uploadWorkspaceStyle), this.handlers.putStyle);

        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getInstanceDetails), function (req, res) {
            res.json({
                about: {
                    resource: [
                        { "@name": "GeoServer", Version: 2.5 }
                    ]
                }
            });
        });

        this.gsMockServer.post(this.getRestUrl(this.geoserverRestAPI.reloadCatalog), function (req, res) {
            res.json(true);
        });

        this.gsMockServer.post(this.getRestUrl(this.geoserverRestAPI.resetCache), function (req, res) {
            res.json(true);
        });

        this.gsMockServer.get(this.wmsURL + this.geoserverWmsAPI.getLegendGraphic, function (req, res) {
            checkJSONHeaders(req, res);
        });

    },

    addTimeoutRequestHandler: function () {
        this.gsMockServer.get(this.restURL + "/*", function () {
            // timeout
        });
    }
};

function checkJSONHeaders(req, res) {
    if (isContentTypeHeaderJSON(req) && isAcceptHeaderJSON(req)) {
        res.status(200).json(true);
    } else {
        res.status(404).json("Content-type/Accept headers must be json");
    }
}

function isContentTypeHeaderJSON(req) {
    return req.get("Content-Type") === "application/json";
}

function isContentTypeHeaderSLD(req) {
    return req.get("Content-Type") === "application/vnd.ogc.sld+xml";
}

function isAcceptHeaderJSON(req) {
    return req.get("Content-Type") === "application/json";
}

module.exports = GeoserverMockServer;
