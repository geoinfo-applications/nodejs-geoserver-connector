"use strict";

module.exports = function GeoserverDatastore() {

    this.createDatastore = function (config) {

        var storeName = config && config.name || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;
        var dbParams = config && config.connectionParameters || this.db;

        return this.datastoreExists(config).then(function (exists) {

            if (exists) {
                return true;
            }

            var datastoreConfig = {
                dataStore: {
                    name: storeName,
                    enabled: true,
                    workspace: { name: wsName },
                    connectionParameters: dbParams
                },
                name: storeName
            };

            return this.createGeoserverObject(this.types.DATASTORE, datastoreConfig);

        }.bind(this));
    };

    this.datastoreExists = function (config) {
        return this.geoserverObjectExists(this.types.DATASTORE, config);
    };

    this.deleteDatastore = function (config) {

        var dsName = config && config.name || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        return this.datastoreExists({ name: dsName, workspace: wsName }).then(function (exists) {

            if (exists) {
                return this.deleteGeoserverObject(this.types.DATASTORE, config);
            }

            return true;

        }.bind(this));
    };
};
