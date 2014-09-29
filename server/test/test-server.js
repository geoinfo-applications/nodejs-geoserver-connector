"use strict";

var _ = require("underscore");
var express = require("express");
var timeout = require("connect-timeout");
var config = require("./config.js");

function GeoserverMockServer() {

    var options = config.test.geoserver;

    this.gsMockServer = express();
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
        getWorkspaceStyles: "/workspaces/:ws/styles.json",
        getLayerStyles: "/layers/:layer/styles.json",
        getGlobalStyles: "/styles",
        getLFeatureTypeDetails: "/workspaces/:ws/datastores/:ds/featuretypes/:layer"
    };

    this.geoserverRestPostAPI = {
        createLayer: "/workspaces/:ws/datastores/:ds/featuretypes.json",
        createGlobalStyle: "/styles",
        createDatastore: "/workspaces/:ws/datastores",
        createWorkspace: "/workspaces",
        createWorkspaceStyles: "/workspaces/:ws/styles.json"
    };

    this.geoserverRestDeleteAPI = {
        deleteLayer: "/layers/:layer",
        deleteFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer",
        getDeleteStyle: "/styles/:style",
        deleteWorkspaceStyle: "/workspaces/:ws/styles/:style"
    };

    this.geoserverRestPutAPI = {
        getLayerDetails: "/workspaces/:ws/datastores/:ds/featuretypes/:layer"
    };

    this.geoserverRestAPI = {
        getLayer: "/layers/:layer",
        getGlobalStyle: "/styles/:style",
        getInstanceDetails: "/about/version.json"
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

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getLayer, function (req, res) {

            if(req.params.layer !== config.layer.name){
                res.status(404);
            }

            var response = require("./domain/responses/getLayer");
            response.layer.name = config.layer.name;
            response.layer.defaultStyle.name = config.layer.defaultStyleName;
            res.json(response);
        });

        this.gsMockServer.get(this.baseURL + this.geoserverRestAPI.getGlobalStyle, function (req, res) {

            if(req.params.style !== config.style.name){
                res.status(404);
            }

            var response = require("./domain/responses/getPublicStyle");
            response.style.name = config.style.name;
            res.json(response);
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

