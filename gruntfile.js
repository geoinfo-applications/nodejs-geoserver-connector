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
                tasks: ["jshint"],
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
                    reporter: "spec",
                    slow: 10
                },
                src: ["!**/startGeoserverMockupServer.js", "server/test/domain/**/*.js", "!server/test/functional/**/*.js" ]
            },
            functional_tests: {
                options: {
                    color: true,
                    reporter: "spec",
                    slow: 100
                },
                src: ["!**/startGeoserverMockupServer.js", "!server/test/domain/**/*.js", "server/test/functional/**/*.js" ]
            }
        },

        mochacli: {
            options: {
                require: "server/test/test-server.js"
            },
            unit: {
                options: {
                    opts: "server/test/unit_tests.opts"
                },
                src: [ "server/test/domain/**/*.js"]
            },
            functional: {
                options: {
                    opts: "server/test/functional_tests.opts"
                },
                src: [ "server/test/functional/**/*.js"]
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
