"use strict";

const fs = require("fs");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
const path = require("path");
const _ = require("underscore");
const qthrottle = require("./qthrottle/Throttle.js");
const GeoserverConnector = require("../../server/domain/geoserver/GeoserverConnector");


class TestUtils {

    constructor(config) {
        this.config = config;
        this.gsConnector = new GeoserverConnector(this.config);

        this.newWorkspace = { name: "newWorkspace" };
        this.newDatastore = { name: "newDatastore" };
    }

    createConnector() {
        this.gsConnector = new GeoserverConnector(this.config);
    }

    tearDownConnector() {
        this.gsConnector = null;
    }

    rebuildConnector() {
        this.tearDownConnector();
        this.createConnector();
    }

    async initializeWorkspace() {
        this.rebuildConnector();
        await this.gsConnector.initializeWorkspace();
    }

    async cleanWorkspace() {
        this.rebuildConnector();
        await this.gsConnector.deleteWorkspace();
        await this.gsConnector.deleteWorkspace(this.newWorkspace);
        this.tearDownConnector();
    }

    async readStyleContent() {
        return readFileAsync(path.join(__dirname, "/data/teststyle.sld"), "ascii");
    }

    deleteStyles(style, numberOfStylesToDelete) {
        const deleteStyle = async (styleId) => {
            const styleConfig = {
                name: style.name + styleId
            };

            await this.gsConnector.deleteWorkspaceStyle(styleConfig);
            await this.gsConnector.deleteGlobalStyle(styleConfig);
        };

        return this.throttleActions(deleteStyle, numberOfStylesToDelete);
    }

    throttleActions(action, numberOfIterations, throttleValue) {

        const ids = _.range(0, numberOfIterations);
        // do not set value 1, endless loop
        const throttle = throttleValue || 10;

        return qthrottle(ids, throttle, action);
    }
}


module.exports = TestUtils;

