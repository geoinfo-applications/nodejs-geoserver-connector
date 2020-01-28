"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverWmtsStore extends GeoserverRepository {

    wmtsStoreExists(config) {
        return this.geoserverObjectExists(this.types.WMTSSTORE, config);
    }

    getWmtsStore(config) {
        const wmtsStoreName = config && config.name;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        const wmtsStoreConfig = { name: wmtsStoreName, workspace: workspaceName };
        return this.getGeoserverObject(this.types.WMTSSTORE, wmtsStoreConfig).then((datastoreObject) => datastoreObject.wmtsStore);
    }

    createWmtsStore(config) {
        return this.wmtsStoreExists(config).then((exists) => {
            if (exists) {
                throw new Error("Wmts Store already exists");
            }
            return this.issueWmtsStoreCreateRequest(config);
        });
    }

    issueWmtsStoreCreateRequest(config) {
        const deferred = this._makeDeferred();

        const restUrl = this.resolver.create(this.types.WMTSSTORE, config);
        const requestObject = JSON.stringify(this.wmtsStoreRequestObject(config));

        this.dispatcher.post({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.WMTSSTORE
            })
        });

        return deferred.promise;
    }

    deleteWmtsStore(externalWmtsService) {
        return this.deleteGeoserverObject(this.types.WMTSSTORE, externalWmtsService);
    }

    updateWmtsStore(config) {
        const deferred = this._makeDeferred();
        const restUrl = this.resolver.get(this.types.WMTSSTORE, config);
        const requestObject = JSON.stringify(this.wmtsStoreRequestObject(config));

        this.dispatcher.put({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 200,
                errorMessage: "Error updating Geoserver object" + this.types.WMTSSTORE
            })
        });

        return deferred.promise;
    }

    wmtsStoreRequestObject(config) {
        return {
            wmtsStore: {
                name: config.name,
                description: config.label,
                type: "WMTS",
                enabled: true,
                workspace: { name: config.workspace ? config.workspace : this.geoserver.workspace },
                capabilitiesURL: config.url,
                user: config.username,
                password: config.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        };
    }

}

module.exports = GeoserverWmtsStore;
