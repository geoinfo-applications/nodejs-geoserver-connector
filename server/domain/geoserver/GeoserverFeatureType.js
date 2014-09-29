"use strict";

var Q = require("q");
var _ = require("underscore");

module.exports = function GeoserverFeatureType() {

    this.getFeatureType = function (config) {
        return this.getGeoserverObject("featureType", config);
    };

    this.createFeatureType = function (config) {

        var featureTypeName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        return this.featureTypeExists({ name: featureTypeName, datastore: storeName, workspace: wsName }).then(function (lyExists) {

            if (lyExists) {
                return true;
            }

            var featureTypeConfig = {
                featureType: { name: featureTypeName },
                name: featureTypeName,
                datastore: storeName,
                workspace: wsName
            };

            return this.createGeoserverObject("featureType", featureTypeConfig);

        }.bind(this));
    };

    this.deleteFeatureType = function (config) {

        var featureTypeName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        return this.featureTypeExists({ name: featureTypeName, datastore: storeName, workspace: wsName })
            .then(function (exists) {

                if (exists) {
                    return this.deleteGeoserverObject("featureType", config, true);
                }

                return config;

            }.bind(this));
    };

    this.featureTypeExists = function (featureType) {
        return this.geoserverObjectExists("featureType", featureType);
    };

    this.renameFeatureType = function (config, newFeatureTypeName) {

        if (!newFeatureTypeName) {
            return Q.reject(new Error("featureType name required"));
        }

        var featureTypeConfig = _.extend({}, config);

        var renameFeatureType = function (newFeatureTypeConfig) {

            var deferred = Q.defer();

            var restUrl = this.resolver.get("featureType", featureTypeConfig);
            var payload = JSON.stringify(newFeatureTypeConfig);

            function response(err, resp, body) {

                if (err) {
                    return deferred.reject(err);
                }

                if (resp.statusCode !== 200) {
                    console.error("Error rename Geoserver featureType >", body);
                    return deferred.reject(this);
                }
                deferred.resolve(this);
            }

            this.dispatcher.put({
                url: restUrl,
                body: payload,
                callback: response.bind(newFeatureTypeConfig)
            });

            return deferred.promise;

        }.bind(this);

        function updateFeatureTypeConfig(config) {
            var newFeatureTypeConfig = {};
            newFeatureTypeConfig.featureType = _.extend({}, config.featureType);
            newFeatureTypeConfig.featureType.name = newFeatureTypeName;
            newFeatureTypeConfig.featureType.nativeName = newFeatureTypeName;
            return renameFeatureType(newFeatureTypeConfig);
        }

        return this.getFeatureType(featureTypeConfig)
            .then(updateFeatureTypeConfig)
            .catch(function (err) {
                console.log(err);
                return Q.reject(err);
            });

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

        var restUrl = this.resolver.get("featureType", featureTypeConfig);
        restUrl.url += "?recalculate=nativebbox,latlonbbox";

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