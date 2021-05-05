module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": "off",
    "indent": "off",
    "require-jsdoc": "off",
    "padded-blocks": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-tabs": "off",
    "key-spacing": "off",
  },
};
