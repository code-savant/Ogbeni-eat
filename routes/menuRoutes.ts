export {};
const express = require('express');
const router = express.Router();
const {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
} = require('../controllers/menuController');

router.route('/').get(getMenus).post(createMenu);
router.route('/:id').get(getMenuById).put(updateMenu).delete(deleteMenu);

module.exports = router;
