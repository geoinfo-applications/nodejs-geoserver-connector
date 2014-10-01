"use strict";


module.exports = function (grunt) {

    var jsFiles = [
        "**/*.js",
        "!node_modules/**",
        "!reports/**",
        "!coverage/**"
    ];

    // Project Configuration
    grunt.initConfig({
        jshint: {
            jsFiles: jsFiles,
            options: {
                jshintrc: true
            }
        },

        watch: {
            scripts: {
                files: jsFiles,
                tasks: ["jshint", "mochaTest:unit_tests"],
                options: {
                    spawn: false,
                    interrupt: true
                },
            },
        },

        plato: {
            reports: {
                options: {
                    jshint: false,
                    exclude: /^(node_modules|coverage|reports)\//
                },
                files: {
                    reports: ["**/*.js"]
                }
            }
        },

        mochaTest: {
            unit_tests: {
                options: {
                    reporter: "dot",
                    bail: "true",
                    slow: 2,
                    require: "server/test/test-server.js"
                },
                src: ["!**/startGeoserverMockupServer.js", "!**/functional/**", "server/test/domain/**/*.js" ]
            },
            functional_tests: {
                options: {
                    reporter: "dot",
                    //bail: "true",
                    slow: 2,
                    require: "server/test/test-server.js"
                },
                src: ["!**/startGeoserverMockupServer.js", "!server/test/domain/**/*.js", "server/functional/**/*.js" ]
            }
        },

        mocha_istanbul: {
            unit_tests: {
                src: "./server/test/**",
                options: {
                    reporter: "spec",
                    excludes: ["**/integration/"],
                    recursive: true,
                    coverageFolder: "./coverage/server",
                    //require: ["./server/test/test-server.js"]
                }
            }
        }

    });

    require("load-grunt-tasks")(grunt);
    grunt.registerTask("test", [ "jshint", "mochaTest:unit_tests", "mochaTest:functional_tests" ]);


};
