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
            dev: {
                multi: "spec=- mocha-bamboo-reporter=-"
            }
        },

        clean: ["./mocha.json"],

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
    grunt.registerTask("istanbul", [ "env:dev", "mocha_istanbul" ]);
    grunt.registerTask("coverage", [ "code-check", "env:dev", "mocha_istanbul", "plato" ]);
    grunt.registerTask("mocha", [ "code-check", "mochaTest" ]);
    grunt.registerTask("test", [ "code-check", "env:dev", "mocha_istanbul" ]);
    grunt.registerTask("update", [ "npm-install", "clean", "todo", "david:check" ]);

};
