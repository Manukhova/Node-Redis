const path = require('path');

module.exports = {
	parserOptions: {
		ecmaVersion: 8,
		sourceType: 'module',
		ecmaFeatures: {
			experimentalObjectRestSpread: true
		}
	},

	env: {
		es6: true,
		commonjs: true,
		"jest/globals": true
	},
	extends: [
		'airbnb/base',
		'plugin:prettier/recommended'
	],
	overrides: [
		{
			"files": [ "packages/**", "stories/**" ],
		}
	],
	plugins: [
		'jest',
		'prettier'
	],
	rules: {
		'prettier/prettier': ['error', { singleQuote: true, printWidth: 120 }]
	}
};
