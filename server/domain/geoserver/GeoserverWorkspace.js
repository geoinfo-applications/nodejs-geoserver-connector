"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverWorkspace extends GeoserverRepository {

    async createWorkspace(config) {

        const wsName = config && config.name || this.geoserver.workspace;

        const exists = await this.workspaceExists(config);

        if (exists) {
            return true;
        }

        const workspaceConfig = {
            workspace: {
                name: wsName
            },
            name: wsName
        };

        return this.createGeoserverObject(this.types.WORKSPACE, workspaceConfig);
    }

    async workspaceExists(config) {
        return this.geoserverObjectExists(this.types.WORKSPACE, config);
    }

    async deleteWorkspace(config) {
        const exists = await this.workspaceExists(config);

        if (exists) {
            return this.deleteGeoserverObject(this.types.WORKSPACE, config, { recurse: true });
        }

        return true;
    }
}

module.exports = GeoserverWorkspace;
