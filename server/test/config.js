"use strict";

var config = {

    test : {
        db : {
            flat: {
                host: "localhost",
                port: 5433,
                user: "ngp_geodata",
                password: "geodat_1",
                database: "test_prod_ngp_geodata",
                charset: "utf8"
            }
        },

        geoserver : {
            host: "localhost",
            port: 9090,
            context: "geoserver",
            timeout: 100,
            user: "admin",
            pass: "geoserver",
            workspace: "geoportal",
            datastore: "flat-test"
        }
    }
};


module.exports = config;
