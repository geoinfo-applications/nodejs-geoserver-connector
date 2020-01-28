"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverCoverage extends GeoserverRepository {

    async coverageExists(config) {
        const coverageConfig = this.resolveCoverageConfig(config);
        return this.geoserverObjectExists(this.types.COVERAGE, coverageConfig);
    }

    async getCoverage(config) {
        const coverageConfig = this.resolveCoverageConfig(config);
        const coverageObject = await this.getGeoserverObject(this.types.COVERAGE, coverageConfig);
        return coverageObject.coverage;
    }

    // eslint-disable-next-line complexity
    resolveCoverageConfig(config) {
        const coverageName = config && config.name;
        const coverageStoreName = config && config.store || coverageName;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: coverageName, store: coverageStoreName, workspace: workspaceName };
    }

    async updateCoverage(config) {
        if (!await this.coverageExists(config)) {
            throw new Error("Coverage doesn't exist");
        }

        return this.issueCoverageUpdateRequest(config);
    }

    async issueCoverageUpdateRequest(config) {
        if (!config || !config.updatedConfig) {
            throw new Error("updatedConfig parameter required");
        }

        const restUrl = this.resolver.get(this.types.COVERAGE, config);

        const deferred = this._makeDeferred();
        this.dispatcher.put({
            url: restUrl,
            body: JSON.stringify(config.updatedConfig),
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 200,
                errorMessage: "Error creating Geoserver object:" + this.types.COVERAGE
            })
        });

        return deferred.promise;
    }

}

module.exports = GeoserverCoverage;
