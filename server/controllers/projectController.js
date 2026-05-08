const Project = require("../models/Project");
const createNotification = require("../utils/createNotification");

// 🔹 Generate custom project ID
const generateProjectId = async () => {
  const count = await Project.countDocuments();
  return `PRJ-${String(count + 1).padStart(4, "0")}`;
};

// 🔹 Create Project
exports.createProject = async (req, res) => {
  try {
    const projectId = await generateProjectId();

    const {
      title,
      shortDescription,
      priority,
      dueDate,
      manager,
      analysts,
      ngsApplications
    } = req.body;

    const project = await Project.create({
      title,
      projectId,
      shortDescription,
      priority,
      dueDate,
      manager,
      analysts,
      ngsApplications,
      createdBy: req.user._id
    });

    // ✅ Notify manager + analysts
    const assignedUsers = [...(manager ? [manager] : []), ...(analysts || [])];

    if (assignedUsers.length > 0) {
      await createNotification({
        users: assignedUsers,
        sender: req.user._id,
        project: project._id,
        type: "PROJECT_ASSIGNED",
        message: `You have been assigned to project: ${project.title}`,
      });
    }

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Project creation failed",
      error: error.message,
    });
  }
};

// 🔹 Get All Projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name email")
      .populate("manager", "name email")
      .populate("analysts", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects" });
  }
};

// 🔹 Get Single Project
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "createdBy manager analysts clients",
      "name email",
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Error fetching project" });
  }
};

// 🔹 Update Project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // Notify updated assigned users
    const assignedUsers = [
      ...(req.body.manager ? [req.body.manager] : []),
      ...(req.body.analysts || []),
    ];

    await createNotification({
      users: assignedUsers,
      sender: req.user._id,
      project: updatedProject._id,
      type: "PROJECT_UPDATED",
      message: `Project "${updatedProject.title}" has been updated and assigned to you`,
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({
      message: "Project update failed",
      error: error.message,
    });
  }
};

// 🔹 Delete Project
exports.deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project" });
  }
};
