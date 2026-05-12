const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectVersion,
  addProjectVersion,
  deleteProjectVersion,
  archiveProjectVersion,
  notifyProjectVersion,
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

router.get(
  "/:projectId/versions",
  auth,
  role("admin", "manager", "analyst"),
  getProjectVersion,
);

router.post(
  "/:projectId/versions",
  auth,
  role("admin", "manager", "analyst"),
  addProjectVersion,
);

// DELETE VERSION
router.delete(
  "/:id/versions/:versionId",
  auth,
  role("admin", "manager", "analyst"),
  deleteProjectVersion,
);

// ARCHIVE VERSION
router.put(
  "/:id/versions/:versionId/archive",
  auth,
  role("admin", "manager", "analyst"),
  archiveProjectVersion,
);

// NOTIFY ADMIN
router.put(
  "/:id/versions/:versionId/notify",
  auth,
  role("admin", "manager", "analyst"),
  notifyProjectVersion,
);

module.exports = router;
