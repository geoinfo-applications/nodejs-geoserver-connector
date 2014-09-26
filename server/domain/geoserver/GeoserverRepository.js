"use strict";

var request = require("request");
var Q = require("q");
var _ = require("underscore");
var util = require("util");

var GeoserverDispatcher = require("./GeoserverDispatcher.js");
var GeoserverResolver = require("./GeoserverResolver.js");

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

    this.geoserverRestAPI = {
        infoURL: "/about/version.json"
    };

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
}

GeoserverRepository.prototype = {

    isGeoserverRunning: function () {
        var deferred = Q.defer();

        var response = function (err, resp, body) {
            if (isResponseError(err, resp)) {
                logError.call(this, err, body);
                deferred.reject(err);
            } else {
                updateGeoserverStatus.call(this, body);
                logInstanceInitialization.call(this, null);
                deferred.resolve();
            }
        }.bind(this);

        function isResponseError(err, response) {
            return err || (response && response.statusCode !== 200);
        }

        function logError(error, requestBody) {
            var errorMsg = (error && error.message) || requestBody;
            console.error("Error accessing Geoserver instance > " + this.baseURL, errorMsg);
        }

        function updateGeoserverStatus(requestBody) {
            this.isEnabled = true;
            var responseDetails = JSON.parse(requestBody);
            this.geoserverDetails = responseDetails.about.resource[0];
        }

        function logInstanceInitialization() {
            console.log("Geoserver instance initialized @ " + this.baseURL);
        }

        this.dispatcher.get({url: this.baseURL + this.geoserverRestAPI.infoURL, callback: response});

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

        var deferred = Q.defer();

        var gsObject = this.resolver.get(type, config);

        var response = function (err, response, body) {

            if (err) {
                return deferred.reject(err, body);
            }

            if (response.statusCode !== 200) {
                //console.log("Geoserver object doesn't exist >", body);
                return deferred.resolve(false);
            }

            deferred.resolve(true);

        }.bind(gsObject.config);

        this.dispatcher.get({url: gsObject.url, callback: response});

        return deferred.promise;
    },

    getGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var gsObject = this.resolver.get(type, config);

        function response(err, resp, body) {

            if (err) {
                deferred.reject(err);
            }

            if (resp.statusCode !== 200) {
                //console.log("Geoserver object doesn't exist >", body);
                return deferred.reject(false);
            }

            var receivedObject = JSON.parse(body);
            deferred.resolve(receivedObject);
        }

        this.dispatcher.get({url: gsObject.url, callback: response.bind(gsObject.config)});

        return deferred.promise;
    },

    createGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var gsObject = this.resolver.create(type, config);

        var payload = JSON.stringify(config);

        var response = function (err, response, body) {
            if (err || response.statusCode !== 201) {
                console.error("Error creating Geoserver object", type, config.name);
                deferred.reject("Error creating Geoserver object:" + body || err);
            } else {
                //console.log("Geoserver object created >", type, object.name);
                deferred.resolve(config);
            }
        }.bind(config);

        this.dispatcher.post({url: gsObject.url, body: payload, callback: response});

        return deferred.promise;
    },

    deleteGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var gsObject = this.resolver.get(type, config);

        gsObject.url += "?recurse=true";

        function response(err, resp, body) {

            if (err) {
                return deferred.reject(err);
            }

            if (resp.statusCode !== 200) {
                console.log("Error deleting Geoserver object >", body);
                return deferred.reject(this);
            }

            //console.log("Geoserver object deleted >", type, this.name);
            deferred.resolve(this);
        }

        this.dispatcher.delete({ url: gsObject.url, callback: response.bind(gsObject.config)});

        return deferred.promise;
    },

    getLayer: function (config) {

        var layerName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        var layerConfig = {
            featureType: { name: layerName },
            name: layerName,
            datastore: storeName,
            workspace: wsName
        };

        return this.getGeoserverObject("layer", layerConfig);
    },

    createLayer: function (config) {

        var layerName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        return this.layerExists({ name: layerName, datastore: storeName, workspace: wsName }).then(function (lyExists) {

            if (lyExists) {
                return true;
            }

            var layerConfig = {
                featureType: { name: layerName },
                name: layerName,
                datastore: storeName,
                workspace: wsName
            };

            return this.createGeoserverObject("layer", layerConfig);

        }.bind(this));
    },

    createDatastore: function (config) {

        var storeName = config && config.name || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;
        var dbParams = config && config.connectionParameters || this.db;

        return this.datastoreExists({name: storeName}).then(function (dsExists) {

            if (dsExists) {
                return true;
            }

            var datastoreConfig = {
                dataStore: {
                    name: storeName,
                    enabled: true,
                    workspace: { name: wsName },
                    connectionParameters: dbParams
                },
                name: storeName
            };

            return this.createGeoserverObject("datastore", datastoreConfig);

        }.bind(this));
    },

    createWorkspace: function (config) {

        var wsName = config && config.name || this.geoserver.workspace;

        return this.workspaceExists({name: wsName}).then(function (wsExists) {

            if (wsExists) {
                return true;
            }

            var wsConfig = {
                workspace: {
                    name: wsName
                },
                name: wsName
            };

            return this.createGeoserverObject("workspace", wsConfig);

        }.bind(this));
    },

    layerExists: function (layer) {
        return this.geoserverObjectExists("layer", layer);
    },

    datastoreExists: function (ds) {
        return this.geoserverObjectExists("datastore", ds);
    },

    workspaceExists: function (ws) {
        return this.geoserverObjectExists("workspace", ws);
    },

    deleteLayer: function (config) {

        var layerName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        return this.layerExists({ name: layerName, datastore: storeName, workspace: wsName }).then(function (exists) {

            if (exists) {
                return this.deleteGeoserverObject("layer", config);
            }

            return config;

        }.bind(this));
    },

    deleteDatastore: function (config) {

        var dsName = config && config.name || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        return this.datastoreExists({ name: dsName, workspace: wsName }).then(function (dsExists) {

            if (dsExists) {
                return this.deleteGeoserverObject("datastore", config);
            }

            return config;

        }.bind(this));
    },

    deleteWorkspace: function (config) {

        var wsName = config && config.name || this.geoserver.workspace;

        return this.workspaceExists({name: wsName}).then(function (wsExists) {

            if (wsExists) {
                return this.deleteGeoserverObject("workspace", config);
            }

            return config;

        }.bind(this));
    },

    renameLayer: function (config, newLayerName) {

        var layerConfig = _.extend({}, config);

        var renameLayer = function (newLayerConfig) {

            var deferred = Q.defer();

            var gsObject = this.resolver.get("layer", layerConfig);
            var payload = JSON.stringify(newLayerConfig);

            function response(err, resp, body) {

                if (err) {
                    return deferred.reject(err);
                }

                if (resp.statusCode !== 200) {
                    console.error("Error rename Geoserver layer >", body);
                    return deferred.reject(this);
                }
                deferred.resolve(this);
            }

            this.dispatcher.put({ url: gsObject.url, body: payload, callback: response});

            return deferred.promise;

        }.bind(this);

        function updateLayerConfig(config) {
            var newLayerConfig = {};
            newLayerConfig.featureType = _.extend({}, config.featureType);
            newLayerConfig.featureType.name = newLayerName;
            newLayerConfig.featureType.nativeName = newLayerName;
            return renameLayer(newLayerConfig);
        }

        return this.getLayer(layerConfig)
            .then(updateLayerConfig)
            .catch(function (err) {
                console.log(err);
                return Q.reject(err);
            });

    },

    recalculateLayerBBox: function (config) {

        var layerName = config && config.name;
        var storeName = config && config.datastore || this.geoserver.datastore;
        var wsName = config && config.workspace || this.geoserver.workspace;

        var layerConfig = {
            featureType: {
                name: layerName,
                enabled: true
            },
            name: layerName,
            datastore: storeName,
            workspace: wsName
        };

        var deferred = Q.defer();

        var gsObject = this.resolver.get("layer", layerConfig);
        gsObject.url += "?recalculate=nativebbox,latlonbbox";

        var payload = JSON.stringify(gsObject.config);

        request({
            uri: gsObject.url,
            method: "PUT",
            headers: {
                "Content-type": "text/json"
            },
            body: payload,
            auth: {
                "user": this.geoserver.user,
                "pass": this.geoserver.pass,
                "sendImmediately": true
            }
        }, function (err, response, body) {

            if (err) {
                return deferred.reject(err);
            }

            if (response.statusCode !== 200) {
                console.error("Error recalculate Geoserver layer BBox >", body);
                return deferred.reject(this);
            }

            deferred.resolve(this);

        }.bind(config));

        return deferred.promise;
    },

    getLayerStyles: function (config) {
        return new Q();
    },

    getLayerDefaultStyle: function (config) {
        return new Q();
    },

    setLayerDefaultStyle: function (config) {
        return new Q();
    },

    getWorkspaceStyles: function (config) {
        return new Q();
    },

    createStyle: function (config) {
        return new Q();
    },

    uploadStyle: function (config) {
        return new Q();
    }
};

module.exports = GeoserverRepository;