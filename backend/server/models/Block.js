const mongoose = require("mongoose");

/* ---------- Sub-schemas ---------- */

const tableSchema = new mongoose.Schema(
    {

        //  Rich Text Content (Tiptap JSON)
        title: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        columns: {
            type: [String],
            required: true,
        },

        rows: {
            type: [[String]],
            required: true,
        },
    },
    { _id: false }
);

const figureSchema = new mongoose.Schema(
    {
        //  Rich Text Content (Tiptap JSON)
        caption: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        filePath: {
            type: String,
            required: true,
        },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        zIndex: { type: Number, required: true },
    },
    { _id: false }
);

/* ---------- Block Schema ---------- */

const blockSchema = new mongoose.Schema(
    {
        projectVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProjectVersion",
            required: true,
            index: true,
        },

        blockId: {
            type: Number,
            required: true,
        },

        type: {
            type: String,
            enum: ["default", "section", "content"],
            required: true,
        },

        order: {
            type: Number,
            required: true,
        },

        /* ===== Default Block ===== */
        title: {
            type: String,
            trim: true,
        },

        //  Rich Text Content (Tiptap JSON)
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        /* ===== Optional Structured Data ===== */
        tables: {
            type: [tableSchema],
            default: [],
        },

        figures: {
            type: [figureSchema],
            default: [],
        },
    },
    { timestamps: true }
);

/* ===== Indexes ===== */

blockSchema.index(
    { projectVersionId: 1, blockId: 1 },
    { unique: true }
);

blockSchema.index({ projectVersionId: 1, order: 1 });

module.exports = mongoose.model("Block", blockSchema);
