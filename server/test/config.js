"use strict";

var config = {

    unit_test: {
        db: {
            flat: {
                host: "localhost",
                port: 5433,
                user: "ngp_geodata",
                password: "geodat_1",
                database: "test_prod_ngp_geodata",
                charset: "utf8"
            }
        },
        geoserver: {
            host: "localhost",
            port: 3003,
            context: "geoserver",
            timeout: 5000,
            user: "admin",
            pass: "geoserver",
            workspace: "geoportal",
            datastore: "flat-test"
        }
    },
    functional_test: {
        db: {
            flat: {
                host: "localhost",
                port: 5433,
                user: "ngp_geodata",
                password: "geodat_1",
                database: "test_prod_ngp_geodata",
                charset: "utf8"
            }
        },
        geoserver: {
            host: "localhost",
            port: 9090,
            context: "geoserver",
            timeout: 50000,
            user: "admin",
            pass: "geoserver",
            workspace: "geoportal",
            datastore: "func-test"
        }
    }
};

config.layer = {
    name: "testLayer",
    featureType: "testLayer",
    defaultStyleName: "point"
};

config.style = {
    name: "teststyle",
    filename: "teststyle.sld"
};

module.exports = config;
