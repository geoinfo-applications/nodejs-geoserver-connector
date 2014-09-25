"use strict";


module.exports = function (grunt) {

    // Project Configuration
    grunt.initConfig({
        jshint: {
            jsFiles : [
                "**/*.js",
                "!node_modules/**",
            ],
            options: {
                jshintrc: true
            }
        },


        mochaTest: {
            unit_tests: {
                options: {
                    reporter: "spec"
                    //,require: "server/test/test-server.js"
                },
                src: ["server/test/**/*.js"]
            }
        },

        mocha_istanbul: {
            unit_tests: {
                src: "./server/test/**",
                options: {
                    reporter: "mocha-multi",
                    excludes: ["**/integration/"],
                    recursive: true,
                    coverageFolder: "./coverage/server",
                    require: ["./server/test/test-server.js"]
                }
            }
        }

    });

    require("load-grunt-tasks")(grunt);

    grunt.registerTask("test", [ "jshint",  "mochaTest:unit_tests" ]);


};
