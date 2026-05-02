
const express = require('express');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

const router = express.Router();

// ==============================
// USER ROUTES
// Base URL: /api/users
// ==============================

// CREATE USER (Admin Only)
router.post(
  '/',
  auth,
  role('admin'),
  createUser
);

// GET ALL USERS (Admin Only)
router.get(
  '/',
  auth,
  role('admin'),
  getUsers
);

// GET SINGLE USER BY ID (Admin Only)
router.get(
  '/:id',
  auth,
  role('admin'),
  getUserById
);

// UPDATE USER (Admin Only)
router.put(
  '/:id',
  auth,
  role('admin'),
  updateUser
);

// DELETE USER (Admin Only)
router.delete(
  '/:id',
  auth,
  role('admin'),
  deleteUser
);

module.exports = router;