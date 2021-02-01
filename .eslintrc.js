module.exports = {
    env: {
        browser: true,
        node: true,
        commonjs: true,
        es2020: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 11,
    },
    rules: {
        'linebreak-style': ['error', 'windows'],
        indent: ['error', 4],
        'no-use-before-define': ['error', { functions: false, classes: false }],
        'max-len': ['error', { code: 160 }],
        'no-console': 'off',
    },
};
