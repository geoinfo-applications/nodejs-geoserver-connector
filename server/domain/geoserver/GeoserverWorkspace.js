"use strict";

var Q = require("q");
var _ = require("underscore");

module.exports = function GeoserverWorkspace() {

    this.createWorkspace = function (config) {

        var wsName = config && config.name || this.geoserver.workspace;

        return this.workspaceExists(config).then(function (exists) {

            if (exists) {
                return true;
            }

            var workspaceConfig = {
                workspace: {
                    name: wsName
                },
                name: wsName
            };

            return this.createGeoserverObject("workspace", workspaceConfig);

        }.bind(this));
    };

    this.workspaceExists = function (ws) {
        return this.geoserverObjectExists("workspace", ws);
    };

    this.deleteWorkspace = function (config) {

        return this.workspaceExists(config).then(function (exists) {

            if (exists) {
                return this.deleteGeoserverObject("workspace", config);
            }

            return config;

        }.bind(this));
    };
};