const express = require('express');
const router = express.Router();

module.exports = () => {
  router.get('/', (req, res, next) => {
    return res.render(require.resolve('../../views/error'));
  });

  return router;
};
