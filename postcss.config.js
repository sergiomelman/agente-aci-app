// postcss.config.js
// Como seu package.json tem "type": "module", usamos a sintaxe de exportação ESM.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};