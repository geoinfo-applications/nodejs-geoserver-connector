"use strict";

const _ = require("underscore");
const express = require("express");
const timeout = require("connect-timeout");
const bodyParser = require("body-parser");
const xml2js = require("xml2js");
const config = require("./config.js");


class GeoserverMockServer {

    // eslint-disable-next-line max-statements
    constructor() {
        const options = config.unit_test.geoserver;

        this.gsMockServer = express();
        this.gsMockServer.use(bodyParser.urlencoded({ extended: false }));
        this.gsMockServer.use(bodyParser.json());
        this.gsMockServer.use(timeout(180 * 1000));

        this.mockServer = null;

        this.gsOptions = _.extend({}, options);
        if (this.gsOptions.context && !/^.*\/$/.test(this.gsOptions.context)) {
            this.gsOptions.context += "/";
        } else {
            this.gsOptions.context = "";
        }
        if (this.gsOptions.adminPath && !/^.*\/$/.test(this.gsOptions.adminPath)) {
            this.gsOptions.adminPath += "/";
        } else {
            this.gsOptions.adminPath = "";
        }
        this.baseURL = "/" + this.gsOptions.context + this.gsOptions.adminPath;
        this.restURL = this.baseURL + "rest";
        this.wmsURL = this.baseURL + "wms";

        this.geoserverRestGetAPI = {
            getLayerStyles: "/layers/:layer/styles",
            getFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer",
            getWorkspace: "/workspaces/:ws"
        };

        this.geoserverRestPostAPI = {
            createWorkspace: "/workspaces",
            createDatastore: "/workspaces/:ws/datastores",
            createFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes",
            createGlobalStyle: "/styles",
            createWorkspaceStyles: "/workspaces/:ws/styles"
        };

        this.geoserverRestDeleteAPI = {
            deleteLayer: "/layers/:layer",
            deleteFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer",
            deleteStyle: "/styles/:style",
            deleteWorkspaceStyle: "/workspaces/:ws/styles/:style"
        };

        this.geoserverRestPutAPI = {
            updateFeatureType: "/workspaces/:ws/datastores/:ds/featuretypes/:layer"
        };

        this.geoserverRestAPI = {
            getLayer: "/layers/*",
            getGlobalStyle: "/styles/:style",
            getGlobalStyles: "/styles",
            getWorkspaceStyle: "/workspaces/:ws/styles/:style",
            getWorkspaceStyles: "/workspaces/:ws/styles",
            getInstanceDetails: "/about/version",
            reloadCatalog: "/reload",
            resetCache: "/reset",

            uploadGlobalStyle: "/styles/:style",
            uploadWorkspaceStyle: "/workspaces/:ws/styles/:style"
        };

        this.geoserverWmsAPI = {
            getLegendGraphic: "/wms?REQUEST=GetLegendGraphic*"
        };

        this.files = {
            style: require("./responses/getStyle"),
            styles: require("./responses/getStyles"),
            layer: require("./responses/getLayer")
        };

        this.handlers = {
            getStyle: (req, res) => {
                if (req.params.style !== config.style.name) {
                    res.status(404);
                }
                const response = this.files.style;
                response.style.name = config.style.name;
                response.style.filename = config.style.filename;
                res.json(this.files.style);
            },

            getStyles: (req, res) => {
                res.json(this.files.styles);
            },

            putStyle: (req, res) => {

                if (!isContentTypeHeaderSLD(req)) {
                    res.status(404).json("Content type must be set to application/vnd.ogc.sld+xml");
                }

                let buf = "";
                req.setEncoding("utf8");
                req.on("data", (chunk) => {
                    buf += chunk;
                });
                req.on("end", () => {
                    xml2js.parseString(buf, (error, sldContent) => {

                        if (error || isNotValidSldContent()) {
                            res.status(404).json(false);
                        } else {
                            res.status(200).json(true);
                        }

                        function isNotValidSldContent() {
                            try {
                                const rootElement = sldContent.StyledLayerDescriptor;
                                const namedLayer = rootElement.NamedLayer[0];
                                return namedLayer.Name[0] !== config.layer.name;
                            } catch (error) {
                                return false;
                            }
                        }
                    });
                });
            },

            putLayer: (req, res) => {

                try {
                    const defaultStyleName = req.body.layer.defaultStyle.name;
                    res.status(200).json(defaultStyleName);
                } catch (err) {
                    res.status(501).send("Layer configuration object not valid");
                }
            },

            getLayer: (req, res) => {

                const files = this.files;
                let layerName;

                try {
                    layerName = resolveLayerName();

                    if (layerName === config.layer.name) {
                        handleExistingLayer();
                    } else {
                        handleNonExistingLayer();
                    }

                } catch (err) {
                    res.status(501).json(err);
                }

                function resolveLayerName() {
                    const layerParameters = req.params[0] && req.params[0].split(":");

                    if (layerParameters.length === 1) {
                        return layerParameters[0];
                    } else if (layerParameters.length === 2) {
                        return layerParameters[1];
                    } else {
                        throw new Error("More then 2 parameters found");
                    }
                }

                function handleExistingLayer() {
                    const response = files.layer;
                    response.layer.name = config.layer.name;
                    response.layer.defaultStyle.name = config.layer.defaultStyleName;
                    response.layer.styles = files.styles.styles;
                    res.status(200).json(response);
                }

                function handleNonExistingLayer() {
                    res.status(404).send("No such layer: " + layerName);
                }
            }
        };

        _.functions(this.handlers).forEach((key) => {
            this.handlers[key] = this.handlers[key].bind(this);
        });

    }

    async listen() {
        return new Promise((resolve, reject) => {
            this.mockServer = this.gsMockServer.listen(this.gsOptions.port, (error) => error ? reject(error) : resolve());
        });
    }

    tearDown() {
        try {
            this.mockServer.close();
            this.mockServer = null;
        } catch (error) {
            // already closed
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    getRestUrl(restCall) {
        return this.restURL + restCall;
    }

    addDefaultRequestHandlers() {

        _.forEach(this.geoserverRestGetAPI, (geoserverAPICall) => {
            this.gsMockServer.get(this.getRestUrl(geoserverAPICall), (req, res) => {
                checkJSONHeaders(req, res);
            });
        });

        _.forEach(this.geoserverRestPostAPI, (geoserverAPICall) => {
            this.gsMockServer.post(this.getRestUrl(geoserverAPICall), (req, res) => {
                res.status(201).json(true);
            });
        });

        _.forEach(this.geoserverRestPutAPI, (geoserverAPICall) => {
            this.gsMockServer.put(this.getRestUrl(geoserverAPICall), (req, res) => {
                res.status(200).json(true);
            });
        });

        _.forEach(this.geoserverRestDeleteAPI, (geoserverAPICall) => {
            this.gsMockServer.delete(this.getRestUrl(geoserverAPICall), (req, res) => {
                checkJSONHeaders(req, res);
            });
        });

        this.gsMockServer.route(this.getRestUrl(this.geoserverRestAPI.getLayer))
            .get(this.handlers.getLayer)
            .put(this.handlers.putLayer);

        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getGlobalStyle), this.handlers.getStyle);
        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getWorkspaceStyle), this.handlers.getStyle);

        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getGlobalStyles), this.handlers.getStyles);
        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getWorkspaceStyles), this.handlers.getStyles);

        this.gsMockServer.put(this.getRestUrl(this.geoserverRestAPI.uploadGlobalStyle), this.handlers.putStyle);
        this.gsMockServer.put(this.getRestUrl(this.geoserverRestAPI.uploadWorkspaceStyle), this.handlers.putStyle);

        this.gsMockServer.get(this.getRestUrl(this.geoserverRestAPI.getInstanceDetails), (req, res) => {
            res.json({
                about: {
                    resource: [
                        { "@name": "GeoServer", Version: 2.5 }
                    ]
                }
            });
        });

        this.gsMockServer.post(this.getRestUrl(this.geoserverRestAPI.reloadCatalog), (req, res) => {
            res.json(true);
        });

        this.gsMockServer.post(this.getRestUrl(this.geoserverRestAPI.resetCache), (req, res) => {
            res.json(true);
        });

        this.gsMockServer.get(this.wmsURL + this.geoserverWmsAPI.getLegendGraphic, (req, res) => {
            checkJSONHeaders(req, res);
        });

    }

    addTimeoutRequestHandler() {
        this.gsMockServer.get(this.restURL + "/*", () => {
            // timeout
        });
    }
}


function checkJSONHeaders(req, res) {
    if (isContentTypeHeaderJSON(req) && isAcceptHeaderJSON(req)) {
        res.status(200).json(true);
    } else {
        res.status(404).json("Content-type/Accept headers must be json");
    }
}

function isContentTypeHeaderJSON(req) {
    return req.get("Content-Type") === "application/json";
}

function isContentTypeHeaderSLD(req) {
    return req.get("Content-Type") === "application/vnd.ogc.sld+xml";
}

function isAcceptHeaderJSON(req) {
    return req.get("Content-Type") === "application/json";
}

module.exports = GeoserverMockServer;
