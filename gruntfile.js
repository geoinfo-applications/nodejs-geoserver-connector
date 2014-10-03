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
                }
            }
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
                src: [
                    "!**/startGeoserverMockupServer.js",
                    "server/test/**/*.js",
                    "!server/test/functional/**/*.js"
                ]
            },
            functional_tests: {
                options: {
                    reporter: "spec",
                    slow: 100
                },
                src: [
                    "!**/startGeoserverMockupServer.js",
                    "!**/domain/**/*.js",
                    "server/test/**/*.js"
                ]
            }
        },

        mochacli: {
            options: {
                require: ["server/test/test-server.js", "server/test/TestUtils.js"]
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
                    coverageFolder: "./coverage/server"
                    // require: ["./server/test/test-server.js"]
                }
            }
        },

        jscs: {
            src: jsFiles,
            options: {
                config: "./.jscsrc"
            }
        },

        david: {
            check: {}
        }

    });

    require("load-grunt-tasks")(grunt);

    grunt.registerTask("code-check", [ "jshint", "jscs"]);
    grunt.registerTask("coverage", [ "code-check", "mocha_istanbul", "plato" ]);
    grunt.registerTask("test", [ "code-check", "mochaTest:unit_tests", "mochaTest:functional_tests" ]);

};
