"use strict";

var _ = require("underscore");
var express = require("express");
var timeout = require("connect-timeout");
var bodyParser = require("body-parser");
var config = require("./config.js");

function GeoserverMockServer() {

    var options = config.unit_test.geoserver;

    this.gsMockServer = express();
    this.gsMockServer.use(bodyParser.urlencoded({ extended: false }));
    this.gsMockServer.use(timeout(180 * 1000));

    var gsOptions = _.extend({}, options);
    if (gsOptions.context) {
        if (!/^.*\/$/.test(gsOptions.context)) {
            gsOptions.context += "/";
        }
    } else {
        gsOptions.context = "";
    }
    this.baseURL = "/" + gsOptions.context + "rest";

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

        uploadGlobalStyle: "/styles/:style",
        uploadWorkspaceStyle: "/workspaces/:ws/styles/:style"
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

            var parseString = new require("xml2js").Parser().parseString;

            var buf = "";
            req.setEncoding("utf8");
            req.on("data", function (chunk) {
                buf += chunk;
            });
            req.on("end", function () {
                parseString(buf, function (err, sldContent) {

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

        getLayer: function (req, res) {

            var layerParameters = req.params[0] && req.params[0].split(":");
            var files = this.files;
            var layerName;

            if (layerParameters.length === 1) {
                layerName = layerParameters[0];
            } else if (layerParameters.length === 2) {
                layerName = layerParameters[1];
            } else {
                res.status(501).end();
            }

            if (layerName === config.layer.name) {
                handleExistingLayer();
            } else {
                handleNonExistingLayer();
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

        }.bind(this)
    };

}

GeoserverMockServer.prototype = {

    getServer: function () {
        return this.gsMockServer;
    },

    addDefaultRequestHandlers: function () {

        _.forEach(this.geoserverRestGetAPI, function (geoserverAPICall) {
            this.gsMockServer.get(this.baseURL + geoserverAPICall, function (req, res) {
                res.status(200).json(true);
            });
        }.bind(this));

        _.forEach(this.geoserverRestPostAPI, function (geoserverAPICall) {
            this.gsMockServer.post(this.baseURL + geoserverAPICall, function (req, res) {
                res.status(201).json(true);
            });
        }.bind(this));

        _.forEach(this.geoserverRestPutAPI, function (geoserverAPICall) {
            this.gsMockServer.put(this.baseURL + geoserverAPICall, function (req, res) {
                res.status(200).json(true);
            });
        }.bind(this));

        _.forEach(this.geoserverRestDeleteAPI, function (geoserverAPICall) {
            this.gsMockServer.delete(this.baseURL + geoserverAPICall, function (req, res) {
                res.status(200).json(true);
            });
        }.bind(this));

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getLayer, this.handlers.getLayer);

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getGlobalStyle, this.handlers.getStyle);
        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getWorkspaceStyle, this.handlers.getStyle);

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getGlobalStyles, this.handlers.getStyles);
        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getWorkspaceStyles, this.handlers.getStyles);

        this.gsMockServer.put(this.baseURL + this.geoserverRestAPI.uploadGlobalStyle, this.handlers.putStyle);
        this.gsMockServer.put(this.baseURL + this.geoserverRestAPI.uploadWorkspaceStyle, this.handlers.putStyle);

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getInstanceDetails, function (req, res) {
            res.json({
                about: { resource: [
                    { "@name": "GeoServer", Version: 2.5 }
                ]}
            });
        });
    },

    addTimeoutRequestHandler: function () {
        this.gsMockServer.get(this.baseURL + "/*", function () {
            // timeout
        });
    }
};

module.exports = GeoserverMockServer;

