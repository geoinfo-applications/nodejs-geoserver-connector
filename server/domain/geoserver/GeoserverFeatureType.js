"use strict";

const _ = require("underscore");
const GeoserverRepository = require("./GeoserverRepository");


class GeoserverFeatureType extends GeoserverRepository {

    async getFeatureType(config) {
        const featureTypeObject = await this.getGeoserverObject(this.types.FEATURETYPE, config);
        return featureTypeObject.featureType;
    }

    // eslint-disable-next-line complexity
    async createFeatureType(config) {
        if (!(config && config.name)) {
            throw new Error("featureType name required");
        }

        const featureTypeName = config.name;
        const featureType = config.featureType || { name: featureTypeName };
        const storeName = config.datastore || this.geoserver.datastore;
        const wsName = config.workspace || this.geoserver.workspace;

        if (await this.featureTypeExists(config)) {
            throw new Error("featureType already exists" + featureTypeName);
        }

        const featureTypeConfig = {
            featureType: featureType,
            name: featureTypeName,
            datastore: storeName,
            workspace: wsName
        };

        return this.createGeoserverObject(this.types.FEATURETYPE, featureTypeConfig);
    }

    async deleteFeatureType(config) {
        const featureTypeName = config && config.name;

        if (await this.featureTypeExists(config)) {
            return this.deleteGeoserverObject(this.types.FEATURETYPE, config, { recurse: true });
        }

        return new Error("featureTypeName does not exist" + featureTypeName);
    }

    async featureTypeExists(featureType) {
        return this.geoserverObjectExists(this.types.FEATURETYPE, featureType);
    }

    async renameFeatureType(config, newFeatureTypeName) {
        if (!newFeatureTypeName) {
            throw new Error("featureType name required");
        }

        const featureTypeConfig = _.extend({}, config);
        const renameFeatureType = (newConfig) => {

            const deferred = this._makeDeferred();
            const restUrl = this.resolver.get(this.types.FEATURETYPE, featureTypeConfig);
            const payload = JSON.stringify(newConfig);

            const response = (error, resp, body) => {
                if (error) {
                    return deferred.reject(new Error(error));
                }
                if (resp.statusCode !== 200) {
                    // eslint-disable-next-line no-console
                    console.error("Error rename Geoserver featureType >", body);
                    return deferred.reject(new Error(body));
                }
                deferred.resolve(true);
            };

            this.dispatcher.put({
                url: restUrl,
                body: payload,
                callback: response
            });
            return deferred.promise;
        };

        const updateFeatureTypeConfig = (featureType) => {
            const newConfig = {};
            newConfig.featureType = _.extend({}, featureType);
            newConfig.featureType.name = newFeatureTypeName;
            newConfig.featureType.nativeName = newFeatureTypeName;
            return renameFeatureType(newConfig);
        };

        return this.getFeatureType(featureTypeConfig).then(updateFeatureTypeConfig);
    }

    // eslint-disable-next-line complexity
    async recalculateFeatureTypeBBox(config) {
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

        const deferred = this._makeDeferred();

        let restUrl = this.resolver.get(this.types.FEATURETYPE, featureTypeConfig);
        restUrl += "?recalculate=nativebbox,latlonbbox";

        const payload = JSON.stringify(featureTypeConfig);

        const response = (error, resp, body) => {
            if (error) {
                return deferred.reject(new Error(error));
            }
            if (resp.statusCode !== 200) {
                // eslint-disable-next-line no-console
                console.error("Error recalculate Geoserver featureType BBox >", body);
                return deferred.reject(new Error(body));
            }
            return deferred.resolve();
        };

        this.dispatcher.put({
            url: restUrl,
            body: payload,
            callback: response
        });

        return deferred.promise;
    }

}

module.exports = GeoserverFeatureType;
