module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-useless-escape": ["off"],
        "no-undef": ["off"],
        "no-console": ["warn"],
        "no-unused-vars": ["warn"],
        "semi-spacing": ["error", {"before": false, "after": false}]
    }
};