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

    this.mockServer = null;

    this.gsOptions = _.extend({}, options);
    if (this.gsOptions.context) {
        if (!/^.*\/$/.test(this.gsOptions.context)) {
            this.gsOptions.context += "/";
        }
    } else {
        this.gsOptions.context = "";
    }
    this.baseURL = "/" + this.gsOptions.context + "rest";

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

            if(!isContentTypeHeaderSLD(req)){
                res.status(404).json("Content type must be set to application/vnd.ogc.sld+xml");
            }

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

        // TODO split this function
        getLayer: function (req, res) {

            var layerParameters = req.params[0] && req.params[0].split(":");
            var files = this.files;
            var layerName;

            if (layerParameters.length === 1) {
                layerName = layerParameters[0];
            } else if (layerParameters.length === 2) {
                layerName = layerParameters[1];
            } else {
                res.status(501).json("More then 2 parameters found");
                return;
            }

            if (layerName === config.layer.name) {

                if(req.method === "GET"){
                    getExistingLayer();
                } else if(req.method === "PUT"){
                    putExistingLayer();
                }
            } else {
                handleNonExistingLayer();
            }

            function getExistingLayer() {
                var response = files.layer;
                response.layer.name = config.layer.name;
                response.layer.defaultStyle.name = config.layer.defaultStyleName;
                response.layer.styles = files.styles.styles;
                res.status(200).json(response);
            }

            function putExistingLayer() {
                res.status(200).json();
            }

            function handleNonExistingLayer() {
                res.status(404).send("No such layer: " + layerName);
            }

        }.bind(this)
    };

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

    addDefaultRequestHandlers: function () {

        function checkJSONHeaders(req, res){
            if (isContentTypeHeaderJSON(req) && isAcceptHeaderJSON(req)) {
                res.status(200).json(true);
            } else {
                res.status(404).json("Content-type/Accept headers must be json");
            }
        }

        _.forEach(this.geoserverRestGetAPI, function (geoserverAPICall) {
            this.gsMockServer.get(this.baseURL + geoserverAPICall, function (req, res) {
                checkJSONHeaders(req, res);
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
                checkJSONHeaders(req, res);
            });
        }.bind(this));

        this.gsMockServer.route(this.baseURL + this.geoserverRestAPI.getLayer)
            .get(this.handlers.getLayer)
            .put(this.handlers.getLayer);

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

