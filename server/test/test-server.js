"use strict";

var _ = require("underscore");
var express = require("express");
var timeout = require("connect-timeout");
var bodyParser = require("body-parser");
var config = require("./config.js");

function GeoserverMockServer() {

    var options = config.test.geoserver;

    this.gsMockServer = express();
    this.gsMockServer.use(bodyParser.urlencoded({ extended: false }));
    this.gsMockServer.use(timeout(200000));

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
        getFeatureTypeDetails: "/workspaces/:ws/datastores/:ds/featuretypes/:layer"
    };

    this.geoserverRestPostAPI = {
        createLayer: "/workspaces/:ws/datastores/:ds/featuretypes",
        createGlobalStyle: "/styles",
        createDatastore: "/workspaces/:ws/datastores",
        createWorkspace: "/workspaces",
        createWorkspaceStyles: "/workspaces/:ws/styles"
    };

    this.geoserverRestDeleteAPI = {
        deleteLayer: "/layers/:layer",
        deleteFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer",
        getDeleteStyle: "/styles/:style",
        deleteWorkspaceStyle: "/workspaces/:ws/styles/:style"
    };

    this.geoserverRestPutAPI = {
        updateFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer"
    };

    this.geoserverRestAPI = {
        getLayer: "/layers/:layer",
        getGlobalStyle: "/styles/:style",
        getGlobalStyles: "/styles",
        getWorkspaceStyle: "/workspaces/:ws/styles/:style",
        getWorkspaceStyles: "/workspaces/:ws/styles",
        getInstanceDetails: "/about/version.json",

        uploadGlobalStyle: "/styles/:style"
    };

    this.files = {
        style: require("./domain/responses/getStyle"),
        styles: require("./domain/responses/getStyles"),
        layer: require("./domain/responses/getLayer")
    }

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

        var getStyle = function (req, res) {
            if (req.params.style !== config.style.name) {
                res.status(404);
            }
            var response = this.files.style;
            response.style.name = config.style.name;
            response.style.filename = config.style.filename;
            res.json(this.files.style);
        }.bind(this);

        var getStyles = function (req, res) {
            res.json(this.files.styles);
        }.bind(this);

        var getLayer = function (req, res) {
            if (req.params.layer !== config.layer.name) {
                res.status(404);
            }

            var response = this.files.layer;
            response.layer.name = config.layer.name;
            response.layer.defaultStyle.name = config.layer.defaultStyleName;
            response.layer.styles = this.files.styles.styles;
            res.json(response);
        }.bind(this);

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getLayer, getLayer.bind(this));
        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getGlobalStyle, getStyle);
        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getWorkspaceStyle, getStyle);
        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getGlobalStyles, getStyles);
        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getWorkspaceStyles, getStyles);

        this.gsMockServer.put(this.baseURL + this.geoserverRestAPI.uploadGlobalStyle, function (req, res) {

            var parseString = new require('xml2js').Parser().parseString;

            var buf = '';
            req.setEncoding('utf8');
            req.on('data', function (chunk) {
                buf += chunk
            });
            req.on('end', function () {
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
        });

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

