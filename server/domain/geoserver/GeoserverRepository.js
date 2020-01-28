"use strict";

const _ = require("underscore");
const util = require("util");
const GeoserverDispatcher = require("./GeoserverDispatcher");
const GeoserverResolver = require("./GeoserverResolver");
const GeoserverLegend = require("./GeoserverLegend");


class GeoserverRepository {

    // eslint-disable-next-line max-statements
    constructor(config) {
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

        this.baseURL = util.format("http://%s:%d/%s", this.geoserver.host, this.geoserver.port, this.geoserver.context);

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

    async isGeoserverRunning() {
        const deferred = this._makeDeferred();

        this.dispatcher.get({
            url: this.restURL + this.resolver.restAPI.about,
            callback: (error, response, body) => {
                const logError = () => {
                    const errorMsg = (error && error.message) || body;
                    // eslint-disable-next-line no-console
                    console.error("Error accessing Geoserver instance > " + this.baseURL, errorMsg);
                };

                const updateGeoserverStatus = () => {
                    this.isEnabled = true;
                    const responseDetails = JSON.parse(body);
                    this.geoserverDetails = responseDetails.about.resource[0];
                    // eslint-disable-next-line no-console
                    console.info("Geoserver instance initialized @ " + this.baseURL);
                };

                if (this.responseHasError(error, response)) {
                    logError(error, body);
                    return deferred.reject(error);
                } else {
                    updateGeoserverStatus(body);
                    return deferred.resolve();
                }
            }
        });

        return deferred.promise;
    }

    async reloadCatalog() {
        const deferred = this._makeDeferred();

        this.dispatcher.post({
            url: this.restURL + this.resolver.restAPI.reloadCatalog,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error reloading Geoserver catalog"
            })
        });

        return deferred.promise;
    }

    async resetCache() {
        const deferred = this._makeDeferred();

        this.dispatcher.post({
            url: this.restURL + this.resolver.restAPI.resetCache,
            callback: this.createResponseListener({
                deferred: deferred,
                errorMessage: "Error resetting Geoserver catalog"
            })
        });

        return deferred.promise;
    }

    async getFonts() {
        const deferred = this._makeDeferred();

        this.dispatcher.get({
            url: this.restURL + this.resolver.restAPI.getFonts,
            callback: (error, response, body) => {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(JSON.parse(body).fonts);
                }

            }
        });

        return deferred.promise;
    }

    createResponseListener(config) {
        const deferred = config.deferred;
        const responseStatusCode = config.responseStatusCode || 200;

        return (error, response, body) => {

            const logError = () => {
                // eslint-disable-next-line no-console
                console.error(config.errorMessage, getErrorMessage());
            };

            const getErrorMessage = () => {
                const errorMessage = (error && error.message);
                const bodyMessage = body === ":null" ? null : body;
                return errorMessage || bodyMessage;
            };

            if (this.responseHasError(error, response, responseStatusCode)) {
                logError(error, body);
                return deferred.reject(getErrorMessage());
            } else {
                return deferred.resolve();
            }
        };
    }

    responseHasError(error, response, responseStatusCode = 200) {
        return !!error || (response && response.statusCode !== responseStatusCode);
    }

    async initializeWorkspace() {
        await this.isGeoserverRunning();
        await this.createWorkspace({ name: this.geoserver.workspace });
        await this.createDatastore({ name: this.geoserver.datastore });
    }

    async geoserverObjectExists(type, config) {
        try {
            await this.getGeoserverObject(type, config);
            return true;
        } catch (e) {
            return false;
        }
    }

    async getGeoserverObject(type, config) {
        const deferred = this._makeDeferred();
        const restUrl = this.resolver.get(type, config);

        const response = (error, resp, body) => {
            if (this.responseHasError(error, resp)) {
                return deferred.reject(new Error(error || body));
            }

            const receivedObject = JSON.parse(body);
            return deferred.resolve(receivedObject);
        };

        this.dispatcher.get({ url: restUrl, callback: response });

        return deferred.promise;
    }

    async updateGeoserverObject(type, config) {
        const deferred = this._makeDeferred();
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
    }

    async createGeoserverObject(type, config) {
        const deferred = this._makeDeferred();

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
    }

    async deleteGeoserverObject(type, config, options) {
        const deferred = this._makeDeferred();
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

    _makeDeferred() {
        const deferred = {};

        deferred.promise = new Promise((resolve, reject) => {
            deferred.resolve = (...args) => resolve(...args);
            deferred.reject = (...args) => reject(...args);
        });

        Object.freeze(deferred);

        return deferred;
    }
}


module.exports = GeoserverRepository;
