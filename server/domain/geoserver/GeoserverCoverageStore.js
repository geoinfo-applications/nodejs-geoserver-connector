"use strict";
var Q = require("q");


module.exports = function GeoserverDCoveragestore() {

    this.coverageStoreExists = function (config) {
        return this.geoserverObjectExists(this.types.COVERAGESTORE, config);
    };

    this.getCoverageStore = function (config) {
        var coverageStoreName = config && config.name;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        var datastoreConfig = { name: coverageStoreName, workspace: workspaceName };
        return this.getGeoserverObject(this.types.COVERAGESTORE, datastoreConfig).then(function (datastoreObject) {
            return datastoreObject.coverageStore;
        });
    };

    this.createCoverageStore = function (config) {
        return this.coverageStoreExists(config).then(function (exists) {
            if (exists) {
                return Q.reject("Coverage Store already exists");
            }

            // TODO pyramid/mosaic configs
            return this.issueCoverageStoreCreateRequest(config);
        }.bind(this));
    };

    this.issueCoverageStoreCreateRequest = function (config) {

        var coverageStoretype = config.coverageStoreType || "imagepyramid";
        var payload = config.coverageDirectory;

        var restUrl = this.resolver.create(this.types.COVERAGESTORE, config);
        restUrl += "/external." + coverageStoretype;

        var deferred = Q.defer();
        this.dispatcher.put({
            url: restUrl,
            body: payload,
            callback: this.createResponseListener({
                contentType: "text/plain",
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.COVERAGESTORE
            })
        });

        return deferred.promise;
    };

    this.deleteCoverageStore = function (config) {
        var coverageStoreName = config && config.name;
        var workspaceName = config && config.workspace || this.geoserver.workspace;

        return this.coverageStoreExists({ name: coverageStoreName, workspace: workspaceName }).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.COVERAGESTORE, config);
            }
            return true;
        }.bind(this));
    };

};
