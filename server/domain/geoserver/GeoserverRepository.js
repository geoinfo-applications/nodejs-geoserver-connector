"use strict";

var Q = require("q");
var _ = require("underscore");
var util = require("util");

var GeoserverDispatcher = require("./GeoserverDispatcher.js");
var GeoserverResolver = require("./GeoserverResolver.js");

var GeoserverDatastore = require("./GeoserverDatastore.js");
var GeoserverWorkspace = require("./GeoserverWorkspace.js");
var GeoserverFeatureType = require("./GeoserverFeatureType.js");
var GeoserverLayer = require("./GeoserverLayer.js");
var GeoserverStyle = require("./GeoserverStyle.js");

function GeoserverRepository(config) {

    var gsConfig = config.geoserver;
    var dbConfig = config.db.flat;

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

    this.baseURL = util.format("http://%s:%d/" + this.geoserver.context + "rest",
        this.geoserver.host, this.geoserver.port);

    this.timeout = this.geoserver.timeout || 5000;

    this.dispatcher = new GeoserverDispatcher({
        timeout: this.timeout,
        user: this.geoserver.user,
        pass: this.geoserver.pass
    });

    this.resolver = new GeoserverResolver({
        baseURL: this.baseURL,
        workspace: this.geoserver.workspace,
        datastore: this.geoserver.datastore
    });

    this.geoserverDetails = null;
    this.isEnabled = false;

    this.types = {
        LAYER: "Layer",
        FEATURETYPE: "FeatureType",
        DATASTORE: "Datastore",
        WORKSPACE: "Workspace",
        STYLE: "Style",
        WORKSPACESTYLE: "WorkspaceStyle"
    };
}

GeoserverRepository.prototype = {

    isGeoserverRunning: function () {
        var deferred = Q.defer();
        var self = this;

        function response(err, resp, body) {
            if (responseHasError()) {
                logError(err, body);
                deferred.reject(err);
            } else {
                updateGeoserverStatus(body);
                logInstanceInitialization();
                deferred.resolve();
            }

            function responseHasError() {
                return !!err || (resp && resp.statusCode !== 200);
            }

        }

        function logError(error, requestBody) {
            var errorMsg = (error && error.message) || requestBody;
            console.error("Error accessing Geoserver instance > " + self.baseURL, errorMsg);
        }

        function updateGeoserverStatus(requestBody) {
            self.isEnabled = true;
            var responseDetails = JSON.parse(requestBody);
            self.geoserverDetails = responseDetails.about.resource[0];
        }

        function logInstanceInitialization() {
            if (process.env.NODE_ENV === "production") {
                console.info("Geoserver instance initialized @ " + self.baseURL);
            }
        }

        this.dispatcher.get({
            url: this.baseURL + this.resolver.restAPI.about,
            callback: response
        });

        return deferred.promise;
    },

    initializeWorkspace: function () {

        var createDefaultWorkspace = function () {
            return this.createWorkspace({name: this.geoserver.workspace});
        }.bind(this);

        var createDefaultDatastore = function () {
            return this.createDatastore({name: this.geoserver.datastore});
        }.bind(this);

        return this.isGeoserverRunning()
            .then(createDefaultWorkspace)
            .then(createDefaultDatastore)
            .then(function () {
                return this;
            }.bind(this))
            .catch(function (err) {
                console.log(err);
                return Q.reject(err);
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

        var deferred = Q.defer();

        var restUrl = this.resolver.get(type, config);

        function response(err, resp, body) {

            if (err) {
                deferred.reject(err);
            }

            if (resp.statusCode !== 200) {
                //warn.log("Geoserver object doesn't exist >", body);
                return deferred.reject(new Error(body));
            }

            var receivedObject = JSON.parse(body);
            deferred.resolve(receivedObject);
        }

        this.dispatcher.get({ url: restUrl, callback: response });

        return deferred.promise;
    },

    updateGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var restUrl = this.resolver.get(type, config);
        var payload = JSON.stringify(config);

        this.dispatcher.put({ url: restUrl, body: payload, callback: response });

        function response(err, resp, body) {

            if (err) {
                deferred.reject(err);
            }

            if (resp.statusCode !== 200) {
                //warn.log("Geoserver object doesn't exist >", body);
                return deferred.reject(new Error(body));
            }

            deferred.resolve(true);
        }

        return deferred.promise;
    },

    createGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var restUrl = this.resolver.create(type, config);
        var payload = JSON.stringify(config);

        function response(err, resp, body) {

            if (err) {
                deferred.reject(err);
            }

            if (resp.statusCode !== 201) {
                console.error("Error creating Geoserver object", type, body);
                deferred.reject(new Error(body));
            }

            //console.info("Geoserver object created >", type, object.name);
            deferred.resolve(true);
        }

        this.dispatcher.post({url: restUrl, body: payload, callback: response});

        return deferred.promise;
    },

    deleteGeoserverObject: function (type, config, options) {

        var deferred = Q.defer();

        var restUrl = this.resolver.delete(type, config);

        if (type === this.types.STYLE) {
            var purge = options && options.purge || true;
            restUrl += "?purge=" + purge;

        } else if ([this.types.FEATURETYPE, this.types.DATASTORE, this.types.WORKSPACE].indexOf(type) > -1) {
            var recurse = options && options.recurse || false;
            restUrl += "?recurse=" + recurse;
        }

        function response(err, resp, body) {

            if (err) {
                return deferred.reject(err);
            }

            if (resp.statusCode !== 200) {
                console.log("Error deleting Geoserver object >", type, body);
                return deferred.reject(new Error(body));
            }

            //console.info("Geoserver object deleted >", type, this.name);
            deferred.resolve(true);
        }

        this.dispatcher.delete({ url: restUrl, callback: response.bind(config)});

        return deferred.promise;
    }

};

GeoserverWorkspace.call(GeoserverRepository.prototype);
GeoserverDatastore.call(GeoserverRepository.prototype);
GeoserverFeatureType.call(GeoserverRepository.prototype);
GeoserverLayer.call(GeoserverRepository.prototype);
GeoserverStyle.call(GeoserverRepository.prototype);

module.exports = GeoserverRepository;
