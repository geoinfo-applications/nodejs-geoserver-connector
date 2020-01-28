"use strict";

const Q = require("q");

module.exports = function GeoserverCoverage() {

    // eslint-disable-next-line complexity
    const resolveCoverageConfig = function (config) {
        const coverageName = config && config.name;
        const coverageStoreName = config && config.store || coverageName;
        const workspaceName = config && config.workspace || this.geoserver.workspace;

        return { name: coverageName, store: coverageStoreName, workspace: workspaceName };
    };

    this.coverageExists = function (config) {
        const coverageConfig = resolveCoverageConfig.call(this, config);
        return this.geoserverObjectExists(this.types.COVERAGE, coverageConfig);
    };

    this.getCoverage = function (config) {
        const coverageConfig = resolveCoverageConfig.call(this, config);
        return this.getGeoserverObject(this.types.COVERAGE, coverageConfig).then(function (coverageObject) {
            return coverageObject.coverage;
        });
    };

    this.updateCoverage = function (config) {
        return this.coverageExists(config).then(function (exists) {
            if (!exists) {
                return Q.reject("Coverage doesn't exist");
            }

            return this.issueCoverageUpdateRequest(config);
        }.bind(this));
    };

    this.issueCoverageUpdateRequest = function (config) {

        if (!config || !config.updatedConfig) {
            return Q.reject("updatedConfig parameter required");
        }
        const restUrl = this.resolver.get(this.types.COVERAGE, config);

        const deferred = Q.defer();
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
    };

};
