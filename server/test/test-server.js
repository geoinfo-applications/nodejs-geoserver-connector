"use strict";

var _ = require("underscore");
var util = require("util");
var express = require("express");
var timeout = require("connect-timeout");


module.exports = function (options) {

    var geoserverMockServer = express();

    geoserverMockServer.use(timeout(5000));

    var mockServer = geoserverMockServer.listen(function () {
        options.port = mockServer.address().port;
        options.url = util.format("http://%s:%d", options.host, options.port);
    });

    var baseUrl = "/" + options.context + "/rest";

    var geoserverRestAPI = {
        createLayer: "/workspaces/:ws/datastores/:ds/featuretypes.json",
        createDatastore: "/workspaces/:ws/datastores.json",
        createWorkspace: "/workspaces.json",
        getGeoserverDetails: "/about/version.json"
    };

    _.forEach(geoserverRestAPI, function (geoserverAPICall) {
        geoserverMockServer.post(baseUrl + geoserverAPICall, function (req, res) {
            res.status(201).json(1);
        });
    });

    geoserverMockServer.get(baseUrl + geoserverRestAPI.getGeoserverDetails, function (req, res) {
        res.json({
            about: {
                resource: [
                    {
                        "@name": "GeoServer",
                        Version: 2.5
                    }
                ]
            }
        });
    });

    geoserverMockServer.close = function () {
        mockServer.close();
    };

    console.log("GeoserverMockServer listening on port " + mockServer.address().port + " ...");
    return geoserverMockServer;

};
