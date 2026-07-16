export {};
const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getVendors).post(protect, createVendor);
router.route('/:id').get(getVendorById).put(protect, updateVendor).delete(protect, deleteVendor);

module.exports = router;
