"use strict";

const Q = require("q");
const _ = require("underscore");


module.exports = function GeoserverFeatureType() {

    function nameDoesntExist(config) {
        return !(config && config.name);
    }

    function rejectRequest(errorMessage) {
        throw new Error(errorMessage);
    }

    this.getFeatureType = function (config) {
        return this.getGeoserverObject(this.types.FEATURETYPE, config).then(function (featureTypeObject) {
            return featureTypeObject.featureType;
        });
    };

    this.createFeatureType = function (config) {
        if (nameDoesntExist(config)) {
            return rejectRequest("featureType name required");
        }
        const featureTypeName = config.name;
        const featureType = config.featureType || { name: featureTypeName };
        const storeName = config.datastore || this.geoserver.datastore;
        const wsName = config.workspace || this.geoserver.workspace;

        return this.featureTypeExists(config).then(function (exists) {
            if (exists) {
                throw new Error("featureType already exists" + featureTypeName);
            }
            const featureTypeConfig = {
                featureType: featureType,
                name: featureTypeName,
                datastore: storeName,
                workspace: wsName
            };
            return this.createGeoserverObject(this.types.FEATURETYPE, featureTypeConfig);
        }.bind(this));
    };

    this.deleteFeatureType = function (config) {
        const featureTypeName = config && config.name;
        return this.featureTypeExists(config).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.FEATURETYPE, config, { recurse: true });
            }
            return new Error("featureTypeName does not exist" + featureTypeName);
        }.bind(this));
    };

    this.featureTypeExists = function (featureType) {
        return this.geoserverObjectExists(this.types.FEATURETYPE, featureType);
    };

    this.renameFeatureType = async function (config, newFeatureTypeName) {
        if (!newFeatureTypeName) {
            throw new Error("featureType name required");
        }

        const featureTypeConfig = _.extend({}, config);
        const renameFeatureType = function (newConfig) {

            const deferred = Q.defer();
            const restUrl = this.resolver.get(this.types.FEATURETYPE, featureTypeConfig);
            const payload = JSON.stringify(newConfig);

            function response(err, resp, body) {
                if (err) {
                    return deferred.reject(new Error(err));
                }
                if (resp.statusCode !== 200) {
                    // eslint-disable-next-line no-console
                    console.error("Error rename Geoserver featureType >", body);
                    return deferred.reject(new Error(body));
                }
                deferred.resolve(true);
            }

            this.dispatcher.put({
                url: restUrl,
                body: payload,
                callback: response
            });
            return deferred.promise;
        }.bind(this);

        function updateFeatureTypeConfig(featureType) {
            const newConfig = {};
            newConfig.featureType = _.extend({}, featureType);
            newConfig.featureType.name = newFeatureTypeName;
            newConfig.featureType.nativeName = newFeatureTypeName;
            return renameFeatureType(newConfig);
        }

        return this.getFeatureType(featureTypeConfig).then(updateFeatureTypeConfig);
    };

    // eslint-disable-next-line complexity
    this.recalculateFeatureTypeBBox = function (config) {
        const featureTypeName = config && config.name;
        const storeName = config && config.datastore || this.geoserver.datastore;
        const wsName = config && config.workspace || this.geoserver.workspace;

        const featureTypeConfig = {
            featureType: {
                name: featureTypeName,
                enabled: true
            },
            name: featureTypeName,
            datastore: storeName,
            workspace: wsName
        };

        const deferred = Q.defer();

        let restUrl = this.resolver.get(this.types.FEATURETYPE, featureTypeConfig);
        restUrl += "?recalculate=nativebbox,latlonbbox";

        const payload = JSON.stringify(featureTypeConfig);

        function response(err, resp, body) {
            if (err) {
                return deferred.reject(new Error(err));
            }
            if (resp.statusCode !== 200) {
                // eslint-disable-next-line no-console
                console.error("Error recalculate Geoserver featureType BBox >", body);
                return deferred.reject(new Error(body));
            }
            return deferred.resolve();
        }

        this.dispatcher.put({
            url: restUrl,
            body: payload,
            callback: response
        });

        return deferred.promise;
    };

};
