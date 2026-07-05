import Project from "../models/project.model.js";

export const createProject = async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    const project = await Project.create({
      name,
      description,
      tags,
      owner: req.user._id,
    });
    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id },
      ],
      status: "active",
    })
      .populate("owner", "name email avatar")
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .populate("eventLogs");

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, {
      status: "archived",
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project archived successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
