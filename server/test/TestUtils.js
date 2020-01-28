"use strict";

const fs = require("fs");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
const path = require("path");
const _ = require("underscore");
const qthrottle = require("./qthrottle/Throttle.js");
const GeoserverRepository = require("../../server/domain/geoserver/GeoserverRepository");


class TestUtils {

    constructor(config) {
        this.config = config;
        this.gsRepository = new GeoserverRepository(this.config);

        this.newWorkspace = { name: "newWorkspace" };
        this.newDatastore = { name: "newDatastore" };
    }

    createRepository() {
        this.gsRepository = new GeoserverRepository(this.config);
    }

    tearDownRepository() {
        this.gsRepository = null;
    }

    rebuildRepository() {
        this.tearDownRepository();
        this.createRepository();
    }

    async initializeWorkspace() {
        this.rebuildRepository();
        await this.gsRepository.initializeWorkspace();
    }

    async cleanWorkspace() {
        this.rebuildRepository();
        await this.gsRepository.deleteWorkspace();
        await this.gsRepository.deleteWorkspace(this.newWorkspace);
        this.tearDownRepository();
    }

    async readStyleContent() {
        return readFileAsync(path.join(__dirname, "/data/teststyle.sld"), "ascii");
    }

    deleteStyles(style, numberOfStylesToDelete) {
        const deleteStyle = function (styleId) {
            const styleConfig = {
                name: style.name + styleId
            };
            return this.deleteWorkspaceStyle(styleConfig)
                .then(this.deleteGlobalStyle(styleConfig));
        }.bind(this.gsRepository);

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

