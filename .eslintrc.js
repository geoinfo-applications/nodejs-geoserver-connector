module.exports = {
    "env": {
        "browser": false,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "script"
    },
    "rules": {
        "max-len": [
            2,
            {
                "code": 150,
                "ignoreComments": true
            }
        ],
        "max-depth": [
            2,
            3
        ],
        "max-statements": [
            2,
            20
        ],
        "max-params": [
            2,
            10
        ],
        "complexity": [
            2,
            5
        ],
        "no-debugger": 2,
        "semi": 2,
        "no-bitwise": 2,
        "no-cond-assign": 2,
        "curly": [
            2,
            "all"
        ],
        "eqeqeq": 2,
        "no-eq-null": 2,
        "no-eval": 2,
        "no-unused-expressions": 2,
        "guard-for-in": 2,
        "wrap-iife": 2,
        "no-use-before-define": 0,
        "no-loop-func": 2,
        "no-caller": 2,
        "no-script-url": 2,
        "no-new-func": 2,
        "no-new-wrappers": 2,
        "no-undef": 2,
        "no-extend-native": 2,
        "new-cap": 2,
        "no-empty": [
            2,
            {
                "allowEmptyCatch": true
            }
        ],
        "no-new": 2,
        "no-plusplus": 0,
        "dot-notation": 2,
        "indent": [
            2,
            4,
            {
                "SwitchCase": 1
            }
        ],
        "quotes": [
            2,
            "double",
            { "allowTemplateLiterals": true }
        ],
        "keyword-spacing": [
            2,
            { "before": true, "after": true }
        ],
        "space-before-blocks": [
            2,
            "always"
        ],
        "space-before-function-paren": [
            2,
            {
                "anonymous": "ignore",
                "named": "never"
            }
        ],
        "space-in-parens": [
            2,
            "never"
        ],
        "array-bracket-spacing": [
            2,
            "never"
        ],
        "object-curly-spacing": [
            2,
            "always"
        ],
        "quote-props": [
            2,
            "as-needed"
        ],
        "key-spacing": [
            2,
            {
                "beforeColon": false,
                "afterColon": true
            }
        ],
        "comma-style": [
            2,
            "last"
        ],
        "space-unary-ops": [
            2,
            {
                "words": false,
                "nonwords": false
            }
        ],
        "space-infix-ops": 2,
        "camelcase": [
            0,
            {
                "properties": "always"
            }
        ],
        "no-with": 2,
        "no-mixed-spaces-and-tabs": 2,
        "no-trailing-spaces": 2,
        "comma-dangle": [
            2,
            "never"
        ],
        "brace-style": [
            2,
            "1tbs",
            {
                "allowSingleLine": true
            }
        ],
        "eol-last": 2,
        "yoda": [
            2,
            "never"
        ],
        "operator-linebreak": [
            2,
            "after"
        ],
        "no-multi-str": 2,
        "spaced-comment": [
            2,
            "always"
        ],
        "consistent-this": [
            2,
            "self"
        ],
        "arrow-parens": 2,
        "semi-spacing": [
            2,
            {
                "before": false,
                "after": true
            }
        ],
        "comma-spacing": [
            2,
            {
                "before": false,
                "after": true
            }
        ],
        "no-nested-ternary": 2,
        "no-unused-vars": [
            2,
            { "vars": "all", "args": "after-used", "caughtErrors": "none" }
        ],
        "block-scoped-var": 2,
        "max-classes-per-file": 2,
        "no-return-await": 2,
        "no-throw-literal": 2,
        "no-useless-return": 2,
        "radix": 2,
        "no-path-concat": 2,

        // // warnings
        // "no-var": 1,
        // "prefer-promise-reject-errors": [2, {"allowEmptyReject": true}],
        // "prefer-const": 1,
        // "prefer-arrow-callback": 1,
        // "prefer-rest-params": 1,
        // "prefer-spread": 1,
        // "prefer-template": 1,
    }
};
