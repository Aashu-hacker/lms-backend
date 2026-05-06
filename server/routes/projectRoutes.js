const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// List
router.get("/", auth, role("admin", "manager", "analyst"), getProjects);

// Single
router.get("/:id", auth, role("admin", "manager", "analyst"), getProjectById);

// Create
router.post("/", auth, role("admin", "manager"), createProject);

// Update
router.put("/:id", auth, role("admin", "manager"), updateProject);

// Delete
router.delete("/:id", auth, role("admin"), deleteProject);

module.exports = router;
