"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverDatastore extends GeoserverRepository {

    // eslint-disable-next-line complexity
    async createDatastore(config) {
        const storeName = config && config.name || this.geoserver.datastore;
        const wsName = config && config.workspace || this.geoserver.workspace;
        const dbParams = config && config.connectionParameters || this.db;

        if (await this.datastoreExists(config)) {
            return true;
        }

        const datastoreConfig = {
            dataStore: {
                name: storeName,
                enabled: true,
                workspace: { name: wsName },
                connectionParameters: dbParams
            },
            name: storeName,
            workspace: wsName
        };

        return this.createGeoserverObject(this.types.DATASTORE, datastoreConfig);
    }

    async datastoreExists(config) {
        return this.geoserverObjectExists(this.types.DATASTORE, config);
    }

    async getDatastore(config) {
        const storeName = config && config.name || this.geoserver.datastore;
        const wsName = config && config.workspace || this.geoserver.workspace;

        const datastoreConfig = { name: storeName, workspace: wsName };
        const datastoreObject = await this.getGeoserverObject(this.types.DATASTORE, datastoreConfig);
        return datastoreObject.dataStore;
    }

    // eslint-disable-next-line complexity
    async deleteDatastore(config) {
        const dsName = config && config.name || this.geoserver.datastore;
        const wsName = config && config.workspace || this.geoserver.workspace;

        if (await this.datastoreExists({ name: dsName, workspace: wsName })) {
            return this.deleteGeoserverObject(this.types.DATASTORE, config, { recurse: true });
        }

        return true;
    }

}

module.exports = GeoserverDatastore;
