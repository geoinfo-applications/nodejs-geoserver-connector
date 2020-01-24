"use strict";

var Q = require("q");


module.exports = function GeoserverWmtsStore() {

    this.wmtsStoreExists = function (config) {
        return this.geoserverObjectExists(this.types.WMTSSTORE, config);
    };

    this.getWmtsStore = function (config) {
        var wmtsStoreName = config && config.name;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        var wmtsStoreConfig = { name: wmtsStoreName, workspace: workspaceName };
        return this.getGeoserverObject(this.types.WMTSSTORE, wmtsStoreConfig).then(function (datastoreObject) {
            return datastoreObject.wmtsStore;
        });
    };

    this.createWmtsStore = function (config) {
        return this.wmtsStoreExists(config).then(function (exists) {
            if (exists) {
                return Q.reject("Wmts Store already exists");
            }
            return this.issueWmtsStoreCreateRequest(config);
        }.bind(this));
    };

    this.issueWmtsStoreCreateRequest = function (config) {

        var deferred = Q.defer();

        var restUrl = this.resolver.create(this.types.WMTSSTORE, config);
        var requestObject = JSON.stringify(this.wmtsStoreRequestObject(config));

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
    };

    this.deleteWmtsStore = function (externalWmtsService) {
        return this.deleteGeoserverObject(this.types.WMTSSTORE, externalWmtsService);
    };

    this.updateWmtsStore = function (config) {
        var deferred = Q.defer();
        var restUrl = this.resolver.get(this.types.WMTSSTORE, config);
        var requestObject = JSON.stringify(this.wmtsStoreRequestObject(config));

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
    };

    this.wmtsStoreRequestObject = function (config) {
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
    };
};
