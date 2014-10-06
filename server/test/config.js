"use strict";

var dbConfig = {
    host: "localhost",
    port: 5433,
    user: "ngp_geodata",
    password: "geodat_1",
    database: "test_prod_ngp_geodata",
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
            host: "localhost",
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

module.exports = config;
