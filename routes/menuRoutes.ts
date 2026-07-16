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
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getMenus).post(protect, createMenu);
router.route('/:id').get(getMenuById).put(protect, updateMenu).delete(protect, deleteMenu);

module.exports = router;
