"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverWmsStore extends GeoserverRepository {

    wmsStoreExists(config) {
        return this.geoserverObjectExists(this.types.WMSSTORE, config);
    }

    getWmsStore(config) {
        const wmsStoreName = config && config.name;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        const wmsStoreConfig = { name: wmsStoreName, workspace: workspaceName };
        return this.getGeoserverObject(this.types.WMSSTORE, wmsStoreConfig).then((datastoreObject) => datastoreObject.wmsStore);
    }

    createWmsStore(config) {
        return this.wmsStoreExists(config).then((exists) => {
            if (exists) {
                throw new Error("Wms Store already exists");
            }
            return this.issueWmsStoreCreateRequest(config);
        });
    }

    issueWmsStoreCreateRequest(config) {
        const deferred = this._makeDeferred();

        const restUrl = this.resolver.create(this.types.WMSSTORE, config);
        const requestObject = JSON.stringify(this.wmsStoreRequestObject(config));

        this.dispatcher.post({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.WMSSTORE
            })
        });

        return deferred.promise;
    }

    deleteWmsStore(externalWmsService) {
        return this.deleteGeoserverObject(this.types.WMSSTORE, externalWmsService);
    }

    updateWmsStore(config) {
        const deferred = this._makeDeferred();
        const restUrl = this.resolver.get(this.types.WMSSTORE, config);
        const requestObject = JSON.stringify(this.wmsStoreRequestObject(config));

        this.dispatcher.put({
            url: restUrl,
            body: requestObject,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 200,
                errorMessage: "Error updating Geoserver object" + this.types.WMSSTORE
            })
        });

        return deferred.promise;
    }

    wmsStoreRequestObject(config) {
        return {
            wmsStore: {
                name: config.name,
                description: config.label,
                type: "WMS",
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

module.exports = GeoserverWmsStore;
