"use strict";

var Q = require("q");
var _ = require("underscore");

module.exports = function GeoserverFeatureType() {

    function nameDoesntExist(config) {
        if (!config || !config.name) {
            return true;
        }
        return false;
    }

    function rejectRequest(errorMessage) {
        return Q.reject(new Error(errorMessage));
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
        var featureTypeName = config.name;
        var featureType = config.featureType || { name: featureTypeName };
        var storeName = config.datastore || this.geoserver.datastore;
        var wsName = config.workspace || this.geoserver.workspace;

        return this.featureTypeExists(config).then(function (exists) {
            if (exists) {
                return new Error("featureType already exists" + featureTypeName);
            }
            var featureTypeConfig = {
                featureType: featureType,
                name: featureTypeName,
                datastore: storeName,
                workspace: wsName
            };
            return this.createGeoserverObject(this.types.FEATURETYPE, featureTypeConfig);
        }.bind(this));
    };

    this.deleteFeatureType = function (config) {
        var featureTypeName = config && config.name;
        return this.featureTypeExists(config).then(function (exists) {
            if (exists) {
                return this.deleteGeoserverObject(this.types.FEATURETYPE, config);
            }
            return new Error("featureTypeName does not exist" + featureTypeName);
        }.bind(this));
    };

    this.featureTypeExists = function (featureType) {
        return this.geoserverObjectExists(this.types.FEATURETYPE, featureType);
    };

    // TODO cleanup - reuse gs global methods
    this.renameFeatureType = function (config, newFeatureTypeName) {

        if (!newFeatureTypeName) {
            return Q.reject(new Error("featureType name required"));
        }

        var featureTypeConfig = _.extend({}, config);
        var renameFeatureType = function (newConfig) {

            var deferred = Q.defer();
            var restUrl = this.resolver.get(this.types.FEATURETYPE, featureTypeConfig);
            var payload = JSON.stringify(newConfig);

            function response(err, resp, body) {
                if (err) {
                    return deferred.reject(new Error(err));
                }
                if (resp.statusCode !== 200) {
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
            var newConfig = {};
            newConfig.featureType = _.extend({}, featureType);
            newConfig.featureType.name = newFeatureTypeName;
            newConfig.featureType.nativeName = newFeatureTypeName;
            return renameFeatureType(newConfig);
        }

        return this.getFeatureType(featureTypeConfig).then(updateFeatureTypeConfig);
    };

    this.recalculateFeatureTypeBBox = function (config) {

        var featureTypeName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        var featureTypeConfig = {
            featureType: {
                name: featureTypeName,
                enabled: true
            },
            name: featureTypeName,
            datastore: storeName,
            workspace: wsName
        };

        var deferred = Q.defer();

        var restUrl = this.resolver.get(this.types.FEATURETYPE, featureTypeConfig);
        restUrl += "?recalculate=nativebbox,latlonbbox";

        var payload = JSON.stringify(featureTypeConfig);

        function response(err, resp, body) {
            if (err) {
                return deferred.reject(new Error(err));
            }
            if (resp.statusCode !== 200) {
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
