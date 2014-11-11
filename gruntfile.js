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
                    exclude: /(^(node_modules|coverage|reports)\/)|.*(gruntfile.js|config.js)/
                },
                files: {
                    reports: ["server/**/*.js"]
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
                    "server/test/**/*.js",
                    "!server/test/functional/**",
                    "!server/test/load-testing/**"
                ]
            },
            functional_tests: {
                options: {
                    reporter: "spec",
                    slow: 100
                },
                src: [ "server/test/functional/*.js" ]
            },
            load_tests: {
                options: {
                    reporter: "spec",
                    slow: 100
                },
                src: [ "server/test/load-testing/*.js" ]
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
                src: [ "./server/test/**" ],
                options: {
                    reporter: "mocha-multi",
                    reportFormats: [ "lcov", "clover" ],
                    //  excludes: ["**/integration/"],
                    recursive: true,
                    print: "summary",
                    coverageFolder: "./coverage/server",
                    require: [ "./server/test/test-server.js" ]
                }
            }
        },

        todo: {
            options: {
                marks: [
                    {
                        name: "FIX",
                        pattern: /FIXME/,
                        color: "red"
                    },
                    {
                        name: "TODO",
                        pattern: /TODO/,
                        color: "red"
                    },
                    {
                        name: "NOTE",
                        pattern: /NOTE/,
                        color: "blue"
                    }
                ]
            },
            src: [ "server/**/*.js" ]
        },

        env: {
            test: {
                NODE_ENV: "test",
                multi: "spec=- mocha-bamboo-reporter=-",
                TESTSERVER_HOST: "192.168.110.5"
            },
            build: {
                NODE_ENV: "test",
                multi: "spec=- mocha-bamboo-reporter=-"
            }
        },

        clean: ["./mocha.json", "./coverage/server/clover.xml"],

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

    grunt.registerTask("code-check", [ "jshint", "jscs", "todo" ]);
    grunt.registerTask("coverage", [ "code-check", "env:test", "mocha_istanbul", "plato" ]);
    grunt.registerTask("mocha", [ "code-check", "env:test", "mochaTest" ]);
    grunt.registerTask("test", [ "code-check", "env:test", "mocha_istanbul" ]);
    grunt.registerTask("update", [ "npm-install", "clean", "david" ]);
    grunt.registerTask("build", ["env:build", "update", "plato", "code-check", "mocha_istanbul"]);

};
