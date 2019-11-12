"use strict";

var dbConfig = {
    host: "localhost",
    port: process.env.TESTSERVER_DB_PORT,
    user: process.env.TESTSERVER_DB_USER,
    password: process.env.TESTSERVER_DB_PASSWORD,
    database: process.env.TESTSERVER_DB_DATABASE,
    charset: "utf8"
};

var config = {

    unit_test: {
        db: {
            flat: dbConfig
        },
        geoserver: {
            host: "localhost",
            port: 3003,
            context: "geoserver",
            adminPath: "admin",
            timeout: 2000,
            user: "admin",
            pass: "geoserver",
            workspace: "geoportal",
            datastore: "flat-test"
        }
    },
    functional_test: {
        db: {
            flat: dbConfig
        },
        geoserver: {
            host: process.env.TESTSERVER_HOST || "localhost",
            port: 9090,
            context: "geoserver",
            timeout: 10 * 1000,
            user: "admin",
            pass: "geoserver",
            workspace: "geoportal",
            datastore: "func-test"
        }
    }
};

config.layer = {
    name: "testlayer",
    featureType: "testlayer",
    defaultStyleName: "point"
};

config.nonExistingLayer = { name: "newLayer" };

config.style = {
    name: "teststyle",
    filename: "teststyle.sld"
};

config.rule = {
    name: "testRule",
    style: config.style.name
};

module.exports = config;
