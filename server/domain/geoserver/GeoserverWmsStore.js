"use strict";

var Q = require("q");


module.exports = function GeoserverWmsStore() {

    this.wmsStoreExists = function (config) {
        return this.geoserverObjectExists(this.types.WMSSTORE, config);
    };

    this.getWmsStores = function (config) {
        var wmsStoreName = config && config.name;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        var wmsStoreConfig = { name: wmsStoreName, workspace: workspaceName };
        return this.getGeoserverObject(this.types.WMSSTORE, wmsStoreConfig).then(function (datastoreObject) {
            return datastoreObject.wmsStore;
        });
    };

    this.createWmsStore = function (config) {
        return this.wmsStoreExists(config).then(function (exists) {
            if (exists) {
                return Q.reject("Wms Store already exists");
            }
            return this.issueWmsStoreCreateRequest(config);
        }.bind(this));
    };

    this.issueWmsStoreCreateRequest = function (config) {

        var deferred = Q.defer();

        var restUrl = this.resolver.create(this.types.WMSSTORE, config);
        var requestObject = JSON.stringify(this.wmsStoreRequestObject(config));

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
    };

    this.deleteWmsStore = function (externalWmsService) {
        var deferred = Q.defer();
        var restUrl = this.resolver.delete(this.types.WMSSTORE, externalWmsService);

        this.dispatcher.delete({
            url: restUrl,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error deleting Geoserver object:" + this.types.WMSSTORE
            })
        });

        return deferred.promise;
    };

    this.updateWmsStore = function (config) {
        var deferred = Q.defer();
        var restUrl = this.resolver.get(this.types.WMSSTORE, config);
        var requestObject = JSON.stringify(this.wmsStoreRequestObject(config));

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
    };

    this.wmsStoreRequestObject = function (config) {
        return {
            wmsStore: {
                name: config.name,
                description: config.label,
                type: "WMS",
                enabled: true,
                workspace: { name: config.workspace ? config.workspace : this.geoserver.workspace },
                _default: false,
                capabilitiesURL: config.url,
                user: config.username,
                password: config.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        };
    };
};
