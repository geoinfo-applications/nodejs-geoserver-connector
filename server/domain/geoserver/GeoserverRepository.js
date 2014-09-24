"use strict";

var request = require("request");
var Q = require("q");
var _ = require("underscore");
var util = require("util");

var envConfig = require("../../config/config");

function GeoserverRepository(geoserverConfig) {

    var env = process.env.NODE_ENV || "development";
    var gsConfig = envConfig[env].geoserver;
    var dbConfig = envConfig[env].db.flat;

    this.gs = _.extend({}, geoserverConfig || gsConfig);
    if (this.gs.context) {
        this.gs.context += "/";
    } else {
        this.gs.context = "";
    }

    this.timeout = this.gs.timeout || 5000;

    this.db = _.extend({}, dbConfig);
    if (!this.db.passwd) {
        this.db.passwd = this.db.password;
        delete this.db.password;
    }
    this.db.dbtype = "postgis";

    this.baseUrl = util.format("http://%s:%d/" + this.gs.context + "rest", this.gs.host, this.gs.port);

    this.geoserverDetails = null;
    this.isEnabled = false;
}


GeoserverRepository.prototype = {

    isGeoserverRunning: function () {
        var deferred = Q.defer();

        var geoserverStatusUrl = this.baseUrl + "/about/version.json";

        var response = function (err, response, body) {
            if (err || (response && response.statusCode !== 200)) {

                var errorMsg = (err && err.message) || body;
                console.error("Error accessing Geoserver instance > " + this.baseUrl, errorMsg);
                deferred.reject({ msg: "Error accessing Geoserver instance", reason: errorMsg});
            } else {

                this.isEnabled = true;

                var responseDetails = JSON.parse(body);
                this.geoserverDetails = responseDetails.about.resource[0];

                console.log("Geoserver instance initialized @ " + this.baseUrl);
                deferred.resolve();
            }
        }.bind(this);

        request({
            uri: geoserverStatusUrl,
            method: "GET",
            headers: {
                "Content-type": "text/json"
            },
            timeout: this.timeout,
            auth: {
                user: this.gs.user,
                pass: this.gs.pass,
                sendImmediately: true
            }
        }, response);

        return deferred.promise;
    },

    resolveGeoserverObject: function (type, config) {

        var requestUrl, requestParams, wsName, storeName;

        if (type === "layer") {
            requestUrl = "/workspaces/%s/datastores/%s/featuretypes/%s.json";
            wsName = config && config.workspace || this.gs.workspace;
            storeName = config && config.datastore || this.gs.datastore;
            requestParams = [ wsName, storeName, config.name ];

        } else if (type === "datastore") {
            requestUrl = "/workspaces/%s/datastores/%s.json";
            wsName = config && config.workspace || this.gs.workspace;
            storeName = config && config.name || this.gs.datastore;
            if (!config) {
                config = { name: storeName };
            }
            requestParams = [ wsName, storeName ];

        } else if (type === "workspace") {
            requestUrl = "/workspaces/%s.json";
            wsName = config && config.name || this.gs.workspace;
            if (!config) {
                config = { name: wsName };
            }
            requestParams = [ wsName ];
        }

        requestParams.unshift(this.baseUrl + requestUrl);

        return {
            url: util.format.apply(null, requestParams),
            config: config
        };
    },

    initializeWorkspace: function () {

        var createDefaultWorkspace = function () {
            return this.createWorkspace({name: this.gs.workspace});
        }.bind(this);

        var createDefaultDatastore = function () {
            return this.createDatastore({name: this.gs.datastore});
        }.bind(this);

        return this.isGeoserverRunning()
            .then(createDefaultWorkspace)
            .then(createDefaultDatastore)
            .then(function(){
                return this;
            }.bind(this))
            .catch(function (err) {
                console.log(err);
                return Q.reject(err);
            });
    },

    geoserverObjectExists: function (type, config) {

        var deferred = Q.defer();

        var gsObject = this.resolveGeoserverObject(type, config);

        request({
            uri: gsObject.url,
            method: "GET",
            headers: {
                "Content-type": "text/json"
            },
            auth: {
                "user": this.gs.user,
                "pass": this.gs.pass,
                "sendImmediately": true
            }
        }, function (err, response, body) {

            if (err) {
                return deferred.reject(err, body);
            }

            if (response.statusCode !== 200) {
                //console.log("Geoserver object doesn't exist >", body);
                return deferred.resolve(false);
            }

            //console.log("Geoserver object exists >", type, this.name);
            deferred.resolve(true);

        }.bind(gsObject.config));

        return deferred.promise;
    },

    getGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var gsObject = this.resolveGeoserverObject(type, config);

        request({
            uri: gsObject.url,
            method: "GET",
            headers: {
                "Content-type": "text/json"
            },
            auth: {
                "user": this.gs.user,
                "pass": this.gs.pass,
                "sendImmediately": true
            }
        }, function (err, response, body) {

            if (err) {
                return deferred.reject(err, body);
            }

            if (response.statusCode !== 200) {
                //console.log("Geoserver object doesn't exist >", body);
                return deferred.reject(false);
            }

            //console.log("Geoserver object exists >", type, this.name);
            var receivedObject = JSON.parse(body);
            deferred.resolve(receivedObject);

        }.bind(gsObject.config));

        return deferred.promise;
    },

    createGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var storeName = config && config.datastore || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;

        var requestUrl, requestParams;
        switch (type) {
            case "layer":
                requestUrl = "/workspaces/%s/datastores/%s/featuretypes.json";
                requestParams = [ wsName, storeName ];
                break;
            case "datastore":
                requestUrl = "/workspaces/%s/datastores.json";
                requestParams = [ wsName ];
                break;
            case "workspace":
                requestUrl = "/workspaces.json";
                requestParams = [];
                break;
        }

        requestParams.unshift(this.baseUrl + requestUrl);
        var objectCreateUrl = util.format.apply(null, requestParams);

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

        request({
            uri: objectCreateUrl,
            method: "POST",
            headers: {
                "Content-type": "text/json"
            },
            body: payload,
            auth: {
                user: this.gs.user,
                pass: this.gs.pass,
                sendImmediately: true
            }
        }, response);

        return deferred.promise;
    },

    deleteGeoserverObject: function (type, config) {

        var deferred = Q.defer();

        var gsObject = this.resolveGeoserverObject(type, config);

        gsObject.url += "?recurse=true";

        request({
            uri: gsObject.url,
            method: "DELETE",
            headers: {
                "Content-type": "text/json"
            },
            auth: {
                "user": this.gs.user,
                "pass": this.gs.pass,
                "sendImmediately": true
            }
        }, function (err, response, body) {

            if (err) {
                return deferred.reject(err);
            }

            if (response.statusCode !== 200) {
                console.log("Error delete Geoserver object >", body);
                return deferred.reject(this);
            }

            //console.log("Geoserver object deleted >", type, this.name);
            deferred.resolve(this);

        }.bind(gsObject.config));

        return deferred.promise;
    },

    getLayer: function (config) {

        var layerName = config && config.name;
        var storeName = config && config.datastore || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;

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
        var storeName = config && config.datastore || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;

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

        var storeName = config && config.name || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;
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

        var wsName = config && config.name || this.gs.workspace;

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
        var storeName = config && config.datastore || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;

        return this.layerExists({ name: layerName, datastore: storeName, workspace: wsName }).then(function (exists) {

            if (exists) {
                return this.deleteGeoserverObject("layer", config);
            }

            return config;

        }.bind(this));
    },

    deleteDatastore: function (config) {

        var dsName = config && config.name || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;

        return this.datastoreExists({ name: dsName, workspace: wsName }).then(function (dsExists) {

            if (dsExists) {
                return this.deleteGeoserverObject("datastore", config);
            }

            return config;

        }.bind(this));
    },

    deleteWorkspace: function (config) {

        var wsName = config && config.name || this.gs.workspace;

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

            var gsObject = this.resolveGeoserverObject("layer", layerConfig);
            var payload = JSON.stringify(newLayerConfig);

            request({
                uri: gsObject.url,
                method: "PUT",
                headers: {
                    "Content-type": "text/json"
                },
                body: payload,
                auth: {
                    "user": this.gs.user,
                    "pass": this.gs.pass,
                    "sendImmediately": true
                }
            }, function (err, response, body) {

                if (err) {
                    return deferred.reject(err);
                }

                if (response.statusCode !== 200) {
                    console.error("Error rename Geoserver layer >", body);
                    return deferred.reject(this);
                }

                deferred.resolve(this);

            }.bind(newLayerConfig));

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
        var storeName = config && config.datastore || this.gs.datastore;
        var wsName = config && config.workspace || this.gs.workspace;

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

        var gsObject = this.resolveGeoserverObject("layer", layerConfig);
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
                "user": this.gs.user,
                "pass": this.gs.pass,
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
    }
};

module.exports = GeoserverRepository;