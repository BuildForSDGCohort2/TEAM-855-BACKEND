module.exports = {
    "extends": "eslint:all",
    env: {
        browser: true,
        es2020: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
    },
    rules: {
        "semi": ["error", "always"],
        "quotes": ["error", "double"]
    },
    "overrides": [{
        "files": ["bin/*.js", "lib/*.js"],
        "excludedFiles": "*.test.js",
        "rules": {
            "quotes": ["error", "single"]
        }
    }]
};