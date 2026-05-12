
const mongoose = require("mongoose");
const Project = require("../models/Project");
const ProjectVersion = require("../models/ProjectVersion");
const Block = require("../models/Block");
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
      ngsApplications,
    } = req.body;

    // Step 1: Create Project
    const project = await Project.create({
      title,
      projectId,
      shortDescription,
      priority,
      dueDate,
      manager,
      analysts,
      ngsApplications,
      createdBy: req.user._id,
    });

    // Step 2: Create Default Version 1
    const projectVersion = await ProjectVersion.create({
      projectId: project._id,
      version: 1,
      status: "draft",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    // Step 3: Notify manager + analysts
    const assignedUsers = [...(manager ? [manager] : []), ...(analysts || [])];

    if (assignedUsers.length > 0) {
      await createNotification({
        users: [...new Set(assignedUsers)], // remove duplicates
        sender: req.user._id,
        project: project._id,
        type: "PROJECT_ASSIGNED",
        message: `You have been assigned to project: ${project.title} (Version ${projectVersion.version})`,
      });
    }

    res.status(201).json({
      message: "Project created successfully",
      project,
      version: projectVersion,
    });
  } catch (error) {
    console.error("Create Project Error:", error);

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
    // Update project and return updated document
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after", // replaces deprecated new: true
        runValidators: true, // optional but recommended
      },
    );

    // Check if project exists
    if (!updatedProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Collect assigned users
    const assignedUsers = [
      ...(req.body.manager ? [req.body.manager] : []),
      ...(req.body.analysts || []),
    ];

    // Remove duplicates
    const uniqueUsers = [...new Set(assignedUsers)];

    // Create notification only if users exist
    if (uniqueUsers.length > 0) {
      await createNotification({
        users: uniqueUsers,
        sender: req.user._id,
        project: updatedProject._id,
        type: "PROJECT_UPDATED",
        message: `Project "${updatedProject.title}" has been updated and assigned to you`,
      });
    }

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update Project Error:", error);

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

// 🔹 Get Project Version
exports.getProjectVersion = async (req, res) => {
  try {
    // Route:
    // /admin/projects/:id/versions
    const { id: projectId } = req.params;
    // console.log("Fetching versions for projectId:", req.params);
    // ================= ROLE CHECK =================
    if (!["admin", "manager", "analyst"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view project versions",
      });
    }

    // ================= CHECK PROJECT EXISTS =================
    const project = await Project.findById(req.params.projectId)
      .populate("createdBy", "name email")
      .populate("manager", "name email")
      .populate("analysts", "name email")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // ================= FETCH ALL PROJECT VERSIONS =================
    const versions = await ProjectVersion.find({ projectId: req.params.projectId })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ version: -1 }) // Latest first
      .lean();

    // ================= NO VERSIONS =================
    if (!versions.length) {
      return res.status(404).json({
        success: false,
        message: "No versions found for this project",
      });
    }

    // ================= SUMMARY =================
    const latestVersion = versions[0];

    // ================= SUCCESS =================
    return res.status(200).json({
      success: true,
      message: "Project versions fetched successfully",
      project: {
        _id: project._id,
        title: project.title,
        projectId: project.projectId,
        shortDescription: project.shortDescription,
        priority: project.priority,
        status: project.status,
        dueDate: project.dueDate,
        progress: project.progress,
        ngsApplications: project.ngsApplications || [],
        manager: project.manager,
        analysts: project.analysts,
        createdBy: project.createdBy,
      },
      summary: {
        totalVersions: versions.length,
        latestVersion: latestVersion.version,
        latestStatus: latestVersion.status,
      },
      count: versions.length,
      data: versions,
    });
  } catch (error) {
    console.error("Get Project Versions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching project versions",
      error: error.message,
    });
  }
};

exports.addProjectVersion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Route:
    // POST /admin/projects/:id/versions
    const { id: projectId } = req.params;

    // ================= VALIDATE PROJECT ID =================
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // ================= ROLE CHECK =================
    if (!["admin", "manager", "analyst"].includes(req.user.role)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Not authorized to add project version",
      });
    }

    // ================= CHECK PROJECT EXISTS =================
    const project = await Project.findById(req.params.projectId).session(session);

    if (!project) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // ================= FETCH ALL EXISTING VERSIONS =================
    const versions = await ProjectVersion.find({ projectId: req.params.projectId })
      .sort({ version: -1 }) // Highest version first
      .session(session);

    // ================= DEFAULT FIRST VERSION =================
    // If no version exists, create v1 draft
    if (!versions.length) {
      const [firstVersion] = await ProjectVersion.create(
        [
          {
            projectId: req.params.projectId,
            version: 1,
            status: "draft",
            isNotify: false,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Initial version v1 created successfully",
        projectId: req.params.projectId,
        baseVersion: null,
        newVersion: {
          _id: firstVersion._id,
          version: firstVersion.version,
          status: firstVersion.status,
        },
        clonedBlocks: 0,
      });
    }

    // ================= SELECT BASE VERSION =================
    // Priority:
    // 1. Latest Published
    // 2. Latest Draft
    let baseVersion = versions.find((v) => v.status === "published");

    if (!baseVersion) {
      baseVersion = versions.find((v) => v.status === "draft");
    }

    if (!baseVersion) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "No suitable base version found",
      });
    }

    // ================= CREATE NEW VERSION NUMBER =================
    const highestVersion = versions[0].version || 0;
    const newVersionNumber = highestVersion + 1;

    // ================= CREATE NEW DRAFT VERSION =================
    const [newVersion] = await ProjectVersion.create(
      [
        {
          projectId: req.params.projectId,
          version: newVersionNumber,
          status: "draft",
          isNotify: false,
          createdBy: req.user._id,
          updatedBy: req.user._id,
        },
      ],
      { session }
    );

    // ================= CLONE BLOCKS FROM BASE VERSION =================
    const baseBlocks = await Block.find({
      projectVersionId: baseVersion._id,
    })
      .lean()
      .session(session);

    let clonedBlocksCount = 0;

    if (baseBlocks.length > 0) {
      const clonedBlocks = baseBlocks.map((block) => ({
        projectVersionId: newVersion._id,
        blockId: block.blockId,
        type: block.type,
        order: block.order,
        title: block.title,
        content: block.content,
        tables: block.tables || [],
        figures: block.figures || [],
        createdBy: req.user._id,
        updatedBy: req.user._id,
      }));

      const insertedBlocks = await Block.insertMany(clonedBlocks, { session });

      clonedBlocksCount = insertedBlocks.length;
    }

    // ================= COMMIT =================
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: `New version v${newVersionNumber} created successfully`,
      project: {
        _id: project._id,
        title: project.title,
        projectId: project.projectId,
      },
      projectId: req.params.projectId,
      baseVersion: {
        _id: baseVersion._id,
        version: baseVersion.version,
        status: baseVersion.status,
      },
      newVersion: {
        _id: newVersion._id,
        version: newVersion.version,
        status: newVersion.status,
      },
      clonedBlocks: clonedBlocksCount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Add Project Version Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create new project version",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE PROJECT VERSION
// ======================================================
exports.deleteProjectVersion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id: projectId, versionId } = req.params;

    if (!["admin", "manager"].includes(req.user.role)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Not authorized to delete project versions",
      });
    }

    const version = await ProjectVersion.findOne({
      _id: versionId,
      projectId,
    }).session(session);

    if (!version) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Version not found",
      });
    }

    // Delete related blocks
    await Block.deleteMany({
      projectVersionId: versionId,
    }).session(session);

    // Delete version
    await ProjectVersion.deleteOne({
      _id: versionId,
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `Version v${version.version} deleted successfully`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Failed to delete version",
      error: error.message,
    });
  }
};


// ======================================================
// ARCHIVE PROJECT VERSION
// ======================================================
exports.archiveProjectVersion = async (req, res) => {
  try {
    const { id: projectId, versionId } = req.params;

    if (!["admin", "manager", "analyst"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to archive project versions",
      });
    }

    const version = await ProjectVersion.findOneAndUpdate(
      {
        _id: versionId,
        projectId,
      },
      {
        status: "archived",
        updatedBy: req.user._id,
      },
      {
        returnDocument: "after",
      }
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: "Version not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Version v${version.version} archived successfully`,
      data: version,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to archive version",
      error: error.message,
    });
  }
};


// ======================================================
// NOTIFY ADMIN FOR VERSION
// ======================================================
exports.notifyProjectVersion = async (req, res) => {
  try {
    const { id: projectId, versionId } = req.params;

    if (!["admin", "manager", "analyst"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to notify admin",
      });
    }

    const version = await ProjectVersion.findOneAndUpdate(
      {
        _id: versionId,
        projectId,
      },
      {
        isNotify: true,
        updatedBy: req.user._id,
      },
      {
        returnDocument: "after",
      }
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: "Version not found",
      });
    }

    // OPTIONAL:
    // Create notification entry for admins
    // await createNotification({...})

    return res.status(200).json({
      success: true,
      message: `Admin notified for Version v${version.version}`,
      data: version,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to notify admin",
      error: error.message,
    });
  }
};
