const Project = require('../models/Project');

// 🔹 Generate custom project ID
const generateProjectId = async () => {
  const count = await Project.countDocuments();
  return `PRJ-${String(count + 1).padStart(4, '0')}`;
};

// 🔹 Create Project
exports.createProject = async (req, res) => {
  try {
    const projectId = await generateProjectId();

    const project = await Project.create({
      ...req.body,
      projectId,
      createdBy: req.user.id
    });

    res.status(201).json(project);

  } catch (err) {
    res.status(500).json({ message: 'Error creating project' });
  }
};

// 🔹 Get All Projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('manager', 'name email')
      .populate('analysts', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

// 🔹 Get Single Project
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy manager analysts clients', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching project' });
  }
};

// 🔹 Update Project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(project);

  } catch (err) {
    res.status(500).json({ message: 'Error updating project' });
  }
};

// 🔹 Delete Project
exports.deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Error deleting project' });
  }
};