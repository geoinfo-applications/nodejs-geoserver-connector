"use strict";

const Q = require("q");
const _ = require("underscore");
const util = require("util");

const GeoserverDispatcher = require("./GeoserverDispatcher");
const GeoserverResolver = require("./GeoserverResolver");

const GeoserverDatastore = require("./GeoserverDatastore");
const GeoserverWmsStore = require("./GeoserverWmsStore");
const GeoserverWmsLayer = require("./GeoserverWmsLayer");
const GeoserverWmtsStore = require("./GeoserverWmtsStore");
const GeoserverWmtsLayer = require("./GeoserverWmtsLayer");
const GeoserverCoverageStore = require("./GeoserverCoverageStore");
const GeoserverCoverage = require("./GeoserverCoverage");
const GeoserverWorkspace = require("./GeoserverWorkspace");
const GeoserverFeatureType = require("./GeoserverFeatureType");
const GeoserverLayer = require("./GeoserverLayer");
const GeoserverLayerGroup = require("./GeoserverLayerGroup");
const GeoserverStyle = require("./GeoserverStyle");
const GeoserverLegend = require("./GeoserverLegend");


// eslint-disable-next-line max-statements
function GeoserverRepository(config) {

    const gsConfig = config.geoserver;
    const dbConfig = config.db.flat;

    this.geoserver = _.extend({}, gsConfig);
    if (this.geoserver.context) {
        this.geoserver.context += "/";
    } else {
        this.geoserver.context = "";
    }

    this.db = _.extend({}, dbConfig);
    if (!this.db.passwd) {
        this.db.passwd = this.db.password;
        delete this.db.password;
    }
    this.db.dbtype = "postgis";

    this.baseURL = util.format("http://%s:%d/%s",
        this.geoserver.host, this.geoserver.port, this.geoserver.context);

    if (this.geoserver.adminPath) {
        this.baseURL += this.geoserver.adminPath + "/";
    }

    this.restURL = this.baseURL + "rest";

    this.timeout = this.geoserver.timeout || 5000;

    this.dispatcher = new GeoserverDispatcher({
        timeout: this.timeout,
        user: this.geoserver.user,
        pass: this.geoserver.pass
    });

    this.resolver = new GeoserverResolver({
        restURL: this.restURL,
        workspace: this.geoserver.workspace,
        datastore: this.geoserver.datastore
    });

    this.legend = new GeoserverLegend({
        baseURL: this.baseURL,
        workspace: this.geoserver.workspace
    });

    this.geoserverDetails = null;
    this.isEnabled = false;

    this.types = {
        LAYER: "Layer",
        FEATURETYPE: "FeatureType",
        DATASTORE: "Datastore",
        COVERAGESTORE: "CoverageStore",
        WMSSTORE: "WmsStore",
        WMSLAYER: "WmsLayer",
        WMTSSTORE: "WmtsStore",
        WMTSLAYER: "WmtsLayer",
        COVERAGE: "Coverage",
        WORKSPACE: "Workspace",
        STYLE: "Style",
        WORKSPACESTYLE: "WorkspaceStyle",
        LAYERGROUP: "LayerGroup"
    };
}

GeoserverRepository.prototype = {

    isGeoserverRunning: function () {
        const deferred = Q.defer();
        const self = this;

        this.dispatcher.get({
            url: this.restURL + this.resolver.restAPI.about,
            callback: function (error, response, body) {
                if (responseHasError()) {
                    logError(error, body);
                    return deferred.reject(error);
                } else {
                    updateGeoserverStatus(body);
                    return deferred.resolve();
                }

                function responseHasError() {
                    return !!error || (response && response.statusCode !== 200);
                }

                function logError() {
                    const errorMsg = (error && error.message) || body;
                    // eslint-disable-next-line no-console
                    console.error("Error accessing Geoserver instance > " + self.baseURL, errorMsg);
                }

                function updateGeoserverStatus() {
                    self.isEnabled = true;
                    const responseDetails = JSON.parse(body);
                    self.geoserverDetails = responseDetails.about.resource[0];
                    // eslint-disable-next-line no-console
                    console.info("Geoserver instance initialized @ " + self.baseURL);
                }
            }
        });

        return deferred.promise;
    },

    reloadCatalog: function () {
        const deferred = Q.defer();

        this.dispatcher.post({
            url: this.restURL + this.resolver.restAPI.reloadCatalog,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error reloading Geoserver catalog"
            })
        });

        return deferred.promise;
    },

    resetCache: function () {
        const deferred = Q.defer();

        this.dispatcher.post({
            url: this.restURL + this.resolver.restAPI.resetCache,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error resetting Geoserver catalog"
            })
        });

        return deferred.promise;
    },

    getFonts: function () {
        const deferred = Q.defer();

        this.dispatcher.get({
            url: this.restURL + this.resolver.restAPI.getFonts,
            callback: function (error, response, body) {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(JSON.parse(body).fonts);
                }

            }
        });

        return deferred.promise;
    },

    createResponseListener: function (config) {
        const deferred = config.deferred;
        const responseStatusCode = config.responseStatusCode || 200;

        return function responseListener(error, response, body) {
            if (responseHasError()) {
                logError(error, body);
                return deferred.reject(getErrorMessage());
            } else {
                return deferred.resolve();
            }

            function responseHasError() {
                return !!error || (response && response.statusCode !== responseStatusCode);
            }

            function logError() {
                // eslint-disable-next-line no-console
                console.error(config.errorMessage, getErrorMessage());
            }

            function getErrorMessage() {
                const errorMessage = (error && error.message);
                const bodyMessage = body === ":null" ? null : body;
                return errorMessage || bodyMessage;
            }
        };
    },

    initializeWorkspace: function () {
        const createDefaultWorkspace = function () {
            return this.createWorkspace({ name: this.geoserver.workspace });
        }.bind(this);

        const createDefaultDatastore = function () {
            return this.createDatastore({ name: this.geoserver.datastore });
        }.bind(this);

        return this.isGeoserverRunning()
            .then(createDefaultWorkspace)
            .then(createDefaultDatastore)
            .catch(function (err) {
                return Q.reject(new Error(err));
            });
    },

    geoserverObjectExists: function (type, config) {
        return this.getGeoserverObject(type, config).then(function () {
            return true;
        }).catch(function () {
            return false;
        });
    },

    getGeoserverObject: function (type, config) {
        const deferred = Q.defer();
        const restUrl = this.resolver.get(type, config);

        function response(err, resp, body) {

            if (err) {
                return deferred.reject(new Error(err));
            }
            if (resp.statusCode !== 200) {
                return deferred.reject(new Error(body));
            }
            const receivedObject = JSON.parse(body);
            return deferred.resolve(receivedObject);
        }

        this.dispatcher.get({ url: restUrl, callback: response });

        return deferred.promise;
    },

    updateGeoserverObject: function (type, config) {
        const deferred = Q.defer();
        const restUrl = this.resolver.get(type, config);
        const payload = JSON.stringify(config);

        this.dispatcher.put({
            url: restUrl,
            body: payload,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error updating Geoserver object" + type
            })
        });

        return deferred.promise;
    },

    createGeoserverObject: function (type, config) {
        const deferred = Q.defer();

        const restUrl = this.resolver.create(type, config);
        const payload = JSON.stringify(config);

        this.dispatcher.post({
            url: restUrl,
            headers: { Accept: undefined },
            body: payload,
            callback: this.createResponseListener({
                deferred: deferred,
                responseStatusCode: 201,
                errorMessage: "Error creating Geoserver object:" + type
            })
        });

        return deferred.promise;
    },

    deleteGeoserverObject: function (type, config, options) {
        const deferred = Q.defer();
        let restUrl = this.resolver.delete(type, config) + "?";

        if (options && options.purge) {
            restUrl += "&purge=" + options.purge;
        }
        if (options && options.recurse) {
            restUrl += "&recurse=" + options.recurse;
        }

        this.dispatcher.delete({
            url: restUrl,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error deleting Geoserver object:" + type
            })
        });

        return deferred.promise;
    }

};

GeoserverWorkspace.call(GeoserverRepository.prototype);
GeoserverDatastore.call(GeoserverRepository.prototype);
GeoserverFeatureType.call(GeoserverRepository.prototype);
GeoserverCoverage.call(GeoserverRepository.prototype);
GeoserverCoverageStore.call(GeoserverRepository.prototype);
GeoserverLayer.call(GeoserverRepository.prototype);
GeoserverLayerGroup.call(GeoserverRepository.prototype);
GeoserverStyle.call(GeoserverRepository.prototype);
GeoserverWmsStore.call(GeoserverRepository.prototype);
GeoserverWmsLayer.call(GeoserverRepository.prototype);
GeoserverWmtsStore.call(GeoserverRepository.prototype);
GeoserverWmtsLayer.call(GeoserverRepository.prototype);

module.exports = GeoserverRepository;
