export {};
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllUsers, getUserById, updateUser, deleteUser,
  getAllVendors, getVendorById, updateVendor, deleteVendor,
  getAllMenus, getMenuById, updateMenu, deleteMenu,
  getAllOrders, getOrderById, updateOrderStatus, deleteOrder,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Users
router.route('/users').get(getAllUsers);
router.route('/users/:id').get(getUserById).put(updateUser).delete(deleteUser);

// Vendors
router.route('/vendors').get(getAllVendors);
router.route('/vendors/:id').get(getVendorById).put(updateVendor).delete(deleteVendor);

// Menus
router.route('/menus').get(getAllMenus);
router.route('/menus/:id').get(getMenuById).put(updateMenu).delete(deleteMenu);

// Orders
router.route('/orders').get(getAllOrders);
router.route('/orders/:id').get(getOrderById).put(updateOrderStatus).delete(deleteOrder);

module.exports = router;
