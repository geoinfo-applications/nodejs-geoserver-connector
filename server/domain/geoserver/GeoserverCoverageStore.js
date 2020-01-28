"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverCoverageStore extends GeoserverRepository {

    async coverageStoreExists(config) {
        return this.geoserverObjectExists(this.types.COVERAGESTORE, config);
    }

    async getCoverageStore(config) {
        const coverageStoreName = config && config.name;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        const datastoreConfig = { name: coverageStoreName, workspace: workspaceName };
        const datastoreObject = await this.getGeoserverObject(this.types.COVERAGESTORE, datastoreConfig);
        return datastoreObject.coverageStore;
    }

    async createCoverageStore(config) {
        if (await this.coverageStoreExists(config)) {
            throw new Error("Coverage Store already exists");
        }

        return this.issueCoverageStoreCreateRequest(config);
    }

    async issueCoverageStoreCreateRequest(config) {
        const coverageStoreType = config.coverageStoreType || "imagepyramid";
        if (!config || !config.coverageDirectory) {
            throw new Error("coverageDirectory parameter required");
        }

        let restUrl = this.resolver.create(this.types.COVERAGESTORE, config);
        restUrl += "/external." + coverageStoreType;

        const deferred = this._makeDeferred();
        this.dispatcher.put({
            url: restUrl,
            body: config.coverageDirectory,
            contentType: "text/plain",
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + this.types.COVERAGESTORE
            })
        });

        return deferred.promise;
    }

    async deleteCoverageStore(config) {
        const coverageStoreName = config && config.name;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        if (await this.coverageStoreExists({ name: coverageStoreName, workspace: workspaceName })) {
            return this.deleteGeoserverObject(this.types.COVERAGESTORE, config, {
                recurse: true,
                purge: "metadata"
            });
        }

        return true;
    }

}

module.exports = GeoserverCoverageStore;
