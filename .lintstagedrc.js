module.exports = {
  '*.{ts,tsx}': ['eslint --fix'],
  '*.{ts,tsx,json,css}': ['prettier --write --ignore-unknown'],
};
