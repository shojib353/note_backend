const express = require('express');
const router = express.Router();
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All user management routes require Admin authorization
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(listUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
