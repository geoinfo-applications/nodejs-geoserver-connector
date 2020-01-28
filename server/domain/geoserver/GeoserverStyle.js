"use strict";

const GeoserverRepository = require("./GeoserverRepository");


class GeoserverStyle extends GeoserverRepository {

    async getGlobalStyle(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        const styleObject = await this.getGeoserverObject(this.types.STYLE, config);
        return styleObject.style;
    }

    async getGlobalStyles() {
        const styleObject = await this.getGeoserverObject(this.types.STYLE);
        return styleObject.styles.style || [];
    }

    async globalStyleExists(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        return this.geoserverObjectExists(this.types.STYLE, config);
    }

    async createGlobalStyle(config) {
        this.defineGlobalStyle(config);

        if (await this.globalStyleExists(config)) {
            return this.uploadGlobalStyleContent(config);
        } else {
            return this.createStyle(config);
        }
    }

    async createGlobalStyleConfiguration(config) {
        this.defineGlobalStyle(config);
        return this.createStyleConfiguration(config);
    }

    async uploadGlobalStyleContent(config) {
        this.defineGlobalStyle(config);
        return this.uploadStyleContent(config);
    }

    async deleteGlobalStyle(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        if (await this.globalStyleExists(config)) {
            return this.deleteGeoserverObject(this.types.STYLE, config, { purge: true });
        }

        return true;
    }


    async getWorkspaceStyle(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        const styleObject = await this.getGeoserverObject(this.types.WORKSPACESTYLE, config);
        return styleObject.style;
    }

    async getWorkspaceStyles(config) {
        const styleObject = await this.getGeoserverObject(this.types.WORKSPACESTYLE, config);
        return styleObject.styles.style || [];
    }

    async workspaceStyleExists(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        return this.geoserverObjectExists(this.types.WORKSPACESTYLE, config);
    }

    async createWorkspaceStyle(config) {
        this.defineWorkspaceStyle(config);
        if (await this.workspaceStyleExists(config)) {
            return this.uploadWorkspaceStyleContent(config);
        } else {
            return this.createStyle(config);
        }
    }

    async createWorkspaceStyleConfiguration(config) {
        this.defineWorkspaceStyle(config);
        return this.createStyleConfiguration(config);
    }

    async uploadWorkspaceStyleContent(config) {
        this.defineWorkspaceStyle(config);
        return this.uploadStyleContent(config);
    }

    async deleteWorkspaceStyle(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        if (await this.workspaceStyleExists(config)) {
            return this.deleteGeoserverObject(this.types.WORKSPACESTYLE, config);
        }

        return true;
    }


    async getLayerDefaultStyle(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        const layer = await this.getLayer(config);
        return layer.defaultStyle;
    }

    async getLayerStyles(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        const layer = await this.getLayer(config);
        return layer.styles.style;
    }

    async setLayerDefaultStyle(config, styleName) {
        if (!styleName || !!(!config || !config.name)) {
            throw new Error("layer and style name required");
        }

        const updateLayerConfig = {
            layer: {
                defaultStyle: {
                    name: styleName
                }
            },
            name: config.name
        };

        return this.updateLayer(updateLayerConfig);
    }

    async setLayerDefaultWorkspaceStyle(config, styleName) {
        if (!!(!config || !config.name) && !styleName) {
            throw new Error("layer and style name required");
        }

        const updateLayerConfig = {
            layer: {
                defaultStyle: {
                    name: styleName,
                    workspace: config.workspace || this.geoserver.workspace
                }
            },
            name: config.name
        };

        return this.updateLayer(updateLayerConfig);
    }

    defineGlobalStyle(config) {
        if (config) {
            config.styleType = this.types.STYLE;
        }
    }

    defineWorkspaceStyle(config) {
        if (config) {
            config.styleType = this.types.WORKSPACESTYLE;
        }
    }

    async createStyle(config) {
        await this.createStyleConfiguration(config);
        return this.uploadStyleContent(config);
    }

    async createStyleConfiguration(config) {
        if (!config || !config.name) {
            throw new Error("layer name required");
        }

        const styleConfig = {
            style: {
                name: config.name,
                filename: config.name + ".sld"
            }
        };

        if (config.workspace) {
            styleConfig.workspace = config.workspace;
        }

        return this.createGeoserverObject(config.styleType, styleConfig);
    }

    // eslint-disable-next-line complexity
    async uploadStyleContent(config) {
        const styleName = config && config.name;
        const sldBody = config && config.sldBody;
        if (!sldBody || !styleName) {
            throw new Error("style name and sld content required");
        }

        const styleConfig = { name: styleName };
        if (config.workspace) {
            styleConfig.workspace = config.workspace;
        }

        const restUrl = this.resolver.get(config.styleType, styleConfig);
        const deferred = this._makeDeferred();

        // TODO reuse createResponseListener
        const response = (error, resp, body) => {
            if (error) {
                return deferred.reject(new Error(error));
            }
            if (resp.statusCode !== 200) {
                // eslint-disable-next-line no-console
                console.error("Error uploading style SLD file", body);
                return deferred.reject(new Error(body));
            }
            // console.info("SLD file uploaded>", body);
            return deferred.resolve(true);
        };

        this.dispatcher.put({
            url: restUrl,
            body: sldBody,
            callback: response,
            contentType: "application/vnd.ogc.sld+xml"
        });

        return deferred.promise;
    }

}

module.exports = GeoserverStyle;
