"use strict";

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

            return this.createGeoserverObject(this.types.WORKSPACE, workspaceConfig);

        }.bind(this));
    };

    this.workspaceExists = function (config) {
        return this.geoserverObjectExists(this.types.WORKSPACE, config);
    };

    this.deleteWorkspace = function (config) {

        return this.workspaceExists(config).then(function (exists) {

            if (exists) {
                return this.deleteGeoserverObject(this.types.WORKSPACE, config);
            }

            return true;

        }.bind(this));
    };
};
