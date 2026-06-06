const express = require("express");
const router = express.Router();
const ComprehensiveReport = require("../models/ReportVersion");
const ProjectVersion = require("../models/ProjectVersion");
const Project = require("../models/Project");
const ReportComment = require("../models/ReportComment");
const createNotification = require("../utils/createNotification");

// ==========================================
// 1. READ ALL REPORTS (Drafts / Lists)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { status, analyst, search } = req.query;
    let queryFilter = {};

    // 1. Dynamic Filtering Conditions
    if (status && status !== "All") {
      queryFilter["status"] = status;
    }

    if (analyst) {
      queryFilter["header.analystName"] = new RegExp(analyst, "i");
    }

    // Optional global search shortcut parsing parameter string checks
    if (search) {
      queryFilter["$or"] = [
        { reportName: new RegExp(search, "i") },
        { versionId: new RegExp(search, "i") },
        { "header.analystName": new RegExp(search, "i") },
      ];
    }

    // 2. Database Fetch Optimization
    const reports = await ComprehensiveReport.find(queryFilter)
      .sort({ updatedAt: -1 })
      // CRITICAL UPDATE: Included "projectId" in the select list.
      // Without selecting projectId, your DataGrid actions (Edit/Preview/Delete) will fail due to undefined parameters.
      .select(
        "projectId reportName versionId status updatedAt header.analystName",
      )
      .lean();

    // 3. High-Fidelity MUI DataGrid Mapping Layer
    // Generates a guaranteed unique string 'id' per item row index tracking target
    const reportsWithDataGridKeys = reports.map((report) => ({
      ...report,
      id: report._id
        ? report._id.toString()
        : `${report.projectId}_${report.versionId}`,
    }));

    return res.status(200).json(reportsWithDataGridKeys);
  } catch (err) {
    console.error("Master catalog retrieval error trace:", err);
    return res.status(500).json({
      success: false,
      error: "Database retrieval exception across report iteration streams",
      detail: err.message,
    });
  }
});

// ==========================================
// 2. READ SINGLE REPORT BY VERSION ID
// ==========================================
router.get("/:versionId", async (req, res) => {
  try {
    const report = await ComprehensiveReport.findOne({
      versionId: req.params.versionId,
    });
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Requested report document version not found",
      });
    }
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Internal server read error",
      detail: err.message,
    });
  }
});

// ==========================================================
// 1. GET DETAILS BY ID & VERSION (Initial Data Loading)
// ==========================================================
router.get("/:id/versions/:versionId", async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const report = await ComprehensiveReport.findOne({
      projectId: id,
      versionId,
    });

    if (!report) {
      // Return clean fallback defaults so frontend state initialization works smoothly
      return res.status(200).json({
        reportName: "New Dynamic Report Workspace",
        header: {
          logo: "",
          title: "",
          subTitle: "",
          analystName: "",
          date: new Date().toISOString().split("T")[0],
        },
        footer: {
          text: "Bionivid Analytical Sequence Output — All Rights Reserved.",
          pageNumbering: true,
          confidentialTag: true,
        },
        sections: [],
      });
    }
    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 2. PUT (SAVE / UPDATE) REPORT BY ID & VERSION
// ==========================================================
router.put("/:id/versions/:versionId", async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const { reportName, header, footer, sections, status } = req.body;

    // upsert: true makes this single endpoint handle both continuous saving and creation safely
    const updatedReport = await ComprehensiveReport.findOneAndUpdate(
      { projectId: id, versionId: versionId },
      {
        $set: {
          reportName,
          header,
          footer,
          sections,
          status: status || "draft",
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Workspace saved and synchronized successfully",
      data: updatedReport,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Update engine operational exception",
      detail: err.message,
    });
  }
});

// ==========================================================
// 3. DELETE SPECIFIC VERSION INSTANCE
// ==========================================================
router.delete("/:id/versions/:versionId", async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const deleted = await ComprehensiveReport.findOneAndDelete({
      projectId: id,
      versionId,
    });
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, error: "Report version targets not found" });

    return res
      .status(200)
      .json({ success: true, message: "Version dropped successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 4. VERSION IMPORT WORKFLOW (Cloning Entry Logic)
// ==========================================================
router.post("/import-version", async (req, res) => {
  try {
    const { sourceVersionId, targetVersionId, newReportName, importOptions } =
      req.body;

    const sourceReport = await ComprehensiveReport.findOne({
      versionId: sourceVersionId,
    });
    if (!sourceReport) {
      return res.status(404).json({
        success: false,
        error: "Source reference baseline version not found.",
      });
    }

    let importedPayload = {
      projectId: sourceReport.projectId,
      versionId: targetVersionId,
      reportName: newReportName || `${sourceReport.reportName} - Clone`,
      status: "Draft",
      sections: [],
    };

    if (importOptions.headerFooter) {
      importedPayload.header = sourceReport.header;
      importedPayload.footer = sourceReport.footer;
    }

    if (importOptions.sections) {
      importedPayload.sections = sourceReport.sections.map((sec) => {
        let clonedElements = sec.elements.filter((el) => {
          if (el.type === "text") return true;
          if (el.type === "image" && importOptions.images) return true;
          if (el.type === "table" && importOptions.tables) return true;
          return false;
        });

        return {
          id: "sec_" + Math.random().toString(36).substr(2, 9),
          title: sec.title,
          description: sec.description,
          elements: clonedElements,
        };
      });
    }

    const compiledClone = new ComprehensiveReport(importedPayload);
    await compiledClone.save();

    return res.status(201).json({
      success: true,
      message: "Historical data parsed and cloned successfully",
      data: compiledClone,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Version cloning engine execution error",
      detail: err.message,
    });
  }
});

// ========================================================
// 7. GET LIVE HTML RENDER PREVIEW (Bionivid Layout Format)
// ========================================================

const getSectionHeight = (elements = []) => {
  if (!elements.length) return 500;

  const maxBottom = Math.max(
    ...elements.map((el) => {
      const y = el.y || 0;
      const h = el.h || 120;

      return y + h;
    }),
  );

  return Math.max(maxBottom + 80, 500);
};

router.get("/:versionId/preview", async (req, res) => {
  try {
    const report = await ComprehensiveReport.findOne({
      versionId: req.params.versionId,
    });
    if (!report)
      return res
        .status(404)
        .send("<h1>Report Template Draft Layer Not Found</h1>");

    // Construct loop iteration through multi-page form layout mapping blocks
    let sectionHtmlCards = report.sections
      .map((sec, sIdx) => {
        // Map inner interactive free-form canvas elements dynamically using computed bounding boxes
        let elementLayers = sec.elements
          .map((el) => {
            let nodePayload = "";

            if (el.type === "text") {
              // --- FORMATTING TOOLBAR INLINE STYLE COMPLIANCE BUILDER ---
              let inlineStyleStyles = `
            margin: 0; 
            font-size: 14px; 
            line-height: 1.6; 
            white-space: pre-wrap;
            text-align: ${el.imageAlignment?.toLowerCase() || "left"};
            font-weight: ${el.isBold ? "bold" : "normal"};
            font-style: ${el.isItalic ? "italic" : "normal"};
          `.trim();

              nodePayload = el.isBullet
                ? `<ul style="margin:0; padding-left:20px;"><li style="${inlineStyleStyles}">${el.textContent}</li></ul>`
                : `<p style="${inlineStyleStyles}">${el.textContent}</p>`;
            } else if (el.type === "image") {
              // --- FIX FOR BROKEN BLOB PREVIEWS ---
              // Falls back to a clean data graphic placeholder if the URL state is missing or empty
              let resolvedImgSource =
                el.imageUrl ||
                "https://via.placeholder.com/400x200?text=No+Data+Graphic";

              nodePayload = `
              <div style="text-align: ${el.imageAlignment?.toLowerCase() || "center"}; width: 100%;">
                <img src="${resolvedImgSource}" style="max-width:100%; height:auto; border-radius:4px; display:inline-block;" />
                ${el.imageLegend ? `<div class="legend-box" style="font-size:11px; font-style:italic; color:#4a5568; margin-top:4px;"><b>${el.imageLegend}</b></div>` : ""}
                ${el.imageDescription ? `<p style="font-size:12px; color:#718096; margin-top:2px;">${el.imageDescription}</p>` : ""}
              </div>`;
            } else if (el.type === "table") {
              let rowsMarkup = el.tableData
                .map(
                  (row, rIdx) => `
            <tr style="background: ${rIdx === 0 ? "#f1f5f9" : "transparent"}; font-weight: ${rIdx === 0 ? "bold" : "normal"}; border-bottom: 1px solid #e2e8f0;">
              ${row.map((cell) => `<td style="padding: 6px 8px; border: 1px solid #cbd5e0; text-align:center; color:#334155;">${cell || ""}</td>`).join("")}
            </tr>`,
                )
                .join("");

              nodePayload = `
          <div style="width:100%; height:100%; overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:6px;">${rowsMarkup}</table>
            ${el.tableLegend ? `<div style="font-size:11px; font-style:italic; color:#4a5568;"><b>${el.tableLegend}</b></div>` : ""}
            ${el.tableDescription ? `<p style="font-size:12px; color:#718096; margin:0;">${el.tableDescription}</p>` : ""}
          </div>`;
            }

            // Return element structural box with absolute dimensions scaled to preview scale matrix definitions
            return `
        <div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.w}px; height: ${el.h}px; z-index: ${el.zIndex}; overflow: hidden; box-sizing: border-box; padding: 4px;">
          ${nodePayload}
        </div>`;
          })
          .join("");

        return `
    <div class="report-card" style="background:#ffffff; margin-bottom:40px; padding:30px; border-radius:8px; border-top: 6px solid #1a365d; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position:relative; min-height:550px; box-sizing: border-box;">
      <div class="section-meta-header" style="margin-bottom:20px; border-bottom: 2px solid #e2e8f0; padding-bottom:10px;">
        <span style="font-size:11px; font-weight:bold; color:#3182ce; text-transform:uppercase;">SECTION MODULE #${sIdx + 1}</span>
        <h3 style="margin:5px 0 2px 0; color:#2d3748; font-size:22px;">${sec.title || "Untitled Workspace Unit"}</h3>
        ${sec.description ? `<p style="margin:0; font-size:13px; color:#718096; font-style:italic;">${sec.description}</p>` : ""}
      </div>
      <div class="preview-canvas-viewport" style="position:relative; width:100%; height:${getSectionHeight(sec.elements)}px; background:#fcfdfd; border-radius:4px; overflow:hidden;">
        ${elementLayers}
      </div>
    </div>`;
      })
      .join("");

    // Compile entire template layout string exactly matching standard structure reports architectures
    const fullHtmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>${report.reportName} - Live Sheet Review Preview</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7fafc; margin: 0; padding: 0; color: #4a5568; }
              .preview-container { width: 880px; margin: 40px auto; }
              .global-header { background: #1a365d; color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 30px; position: relative; }
              .global-footer { background: #edf2f7; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 8px; margin-top: 40px; font-size: 13px; }
              .confidential-tag { position: absolute; top: 15px; right: 20px; background: #e53e3e; color: #fff; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; }
          </style>
      </head>
      <body>
          <div class="preview-container">
              
              <div class="global-header">
                  ${report.footer?.confidentialTag ? `<div class="confidential-tag">Confidential</div>` : ""}
                  <h1 style="margin: 0 0 5px 0; font-size: 28px; letter-spacing: -0.5px;">${report.header?.title || "ENTERPRISE PRODUCTION SUMMARY REPORT"}</h1>
                  <h4 style="margin: 0 0 15px 0; color: #90cdf4; font-weight: 400; font-style: italic;">${report.header?.subTitle || ""}</h4>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e0; border-top: 1px solid #2b6cb0; padding-top: 10px;">
                      <div><b>Lead Analyst Author:</b> ${report.header?.analystName || "System Diagnostics"}</div>
                      <div><b>Generation Stamp:</b> ${report.header?.date || "2026 Engine Instance"}</div>
                      <div><b>Registry Key ID:</b> ${report.versionId}</div>
                  </div>
              </div>

              <div class="report-main-stream-view">
                  ${sectionHtmlCards}
              </div>

              <div class="global-footer">
                  <p style="margin: 0 0 5px 0; color: #4a5568; font-weight: 500;">2026 — All Rights Reserved.</p>
                  ${report.footer?.pageNumbering ? `` : ""}
              </div>

          </div>
      </body>
      </html>
    `;

    res.status(200).send(fullHtmlTemplate);
  } catch (err) {
    res
      .status(500)
      .send(
        `<h3>Preview compilation execution failed fatally: ${err.message}</h3>`,
      );
  }
});

router.put("/:id/versions/:versionId/publish", async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const loggedInUser = req.body.user;
    const report = await ComprehensiveReport.findOne({
      projectId: id,
      versionId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report version not found",
      });
    }
    if (report.status === "published") {
      return res.status(400).json({
        success: false,
        message: "Version already published",
      });
    }

    const unresolvedComments = await ReportComment.countDocuments({
      projectId: id,

      versionId,

      status: { $ne: "resolved" },
    });

    if (unresolvedComments) {
      return res.status(400).json({
        success: false,

        message: "Resolve all comments before publishing",
      });
    }

    report.status = "published";
    await report.save();
    const version = await ProjectVersion.findOneAndUpdate(
      {
        _id: versionId,
      },
      {
        status: "published",
        updatedBy: loggedInUser ? loggedInUser._id : null,
        isNotify: true,
      },
      {
        new: true,
      },
    );

    const project = await Project.findById(id)
      .populate("manager", "_id name")
      .populate("analysts", "_id name");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    const users = [project.manager?._id, project.analysts?.map((a) => a._id)]
      .flat()
      .filter(Boolean)
      .map(String);

    const uniqueUsers = [...new Set(users)];
    if (uniqueUsers.length) {
      console.log(uniqueUsers);
      const data = await createNotification({
        users: uniqueUsers,
        sender: loggedInUser ? loggedInUser._id : null,
        project: id,
        type: "REPORT_PUBLISHED",
        message: `${report.reportName}
        (${report.versionId})
        has been published.`,
      });
      console.log(data);
    }

    return res.status(200).json({
      success: true,
      message: "Report version published successfully",
      data: {
        reportVersion: report.versionId,
        status: report.status,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/get-report-comments/:id/:versionId", async (req, res) => {
  // console.log(req.params);
  try {
    const comments = await ReportComment.find({
      projectId: req.params.id,
      versionId: req.params.versionId,
    })
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({
        createdAt: 1,
      });
    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
});

router.post("/report-comments", async (req, res) => {
  try {
    const comment = await ReportComment.create({
      projectId: req.body.projectId,
      versionId: req.body.versionId,
      x: req.body.x,
      y: req.body.y,
      text: req.body.text,
      image: req.body.image,
      createdBy: req.body.user_id,
      updatedBy: req.body.user_id,
    });

    res.json(comment);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.put("/report-comments/:id", async (req, res) => {
  try {
    const comment = await ReportComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }
    if (req.body.text) {
      comment.text = req.body.text;
    }
    if (req.body.status) {
      comment.status = req.body.status;
    }
    if (req.body.image) {
      comment.image = req.body.image;
    }
    comment.updatedBy = req.body.user_id;
    comment.updatedAt = new Date();
    await comment.save();
    const updated = await ReportComment.findById(comment._id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name");
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.put("/:id/versions/:versionId/send-back", async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const loggedInUser = req.body.user;
    const report = await ComprehensiveReport.findOne({
      projectId: id,
      versionId,
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report version not found" });
    }

    report.status = "sent_back";

    await report.save();

    await ProjectVersion.findByIdAndUpdate(
      versionId,

      {
        status: "revision_required",

        updatedBy: loggedInUser?._id,

        isNotify: true,
      },
    );

    const project = await Project.findById(id)
      .populate("manager", "_id name")
      .populate("analysts", "_id name");

    if (project) {
      const users = [project.analysts?.map((a) => a._id)]
        .flat()
        .filter(Boolean)
        .map(String);

      const uniqueUsers = [...new Set(users)];

      if (uniqueUsers.length) {
        await createNotification({
          users: uniqueUsers,
          sender: loggedInUser?._id,
          project: id,
          type: "REPORT_SENT_BACK",
          message: `${report.reportName}
                    (${report.versionId})
                    has been sent back for changes.`,
        });
      }
    }

    return res.json({
      success: true,
      message: "Report sent back successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
