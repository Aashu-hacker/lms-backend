const mongoose = require("mongoose");

const projectVersionSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },

        version: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft"
        },

        isNotify: {
            type: Boolean,
            default: false,
        },
        
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

    },
    { timestamps: true }
);

projectVersionSchema.index(
    { projectId: 1, version: 1 },
    { unique: true }
);

module.exports = mongoose.model("ProjectVersion", projectVersionSchema);
