/**
 * Admin Routes
 * GET /api/admin/stats      — Platform overview stats
 * GET /api/admin/users      — List all users
 * GET /api/admin/activity   — Recent activity log
 */

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, adminOnly); // Admin-only access

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/activity', adminController.getRecentActivity);
router.put('/users/:id/status', adminController.toggleUserStatus);

module.exports = router;
