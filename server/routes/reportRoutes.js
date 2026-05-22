const express = require("express");
const router = express.Router();
const ComprehensiveReport = require("../models/ReportVersion");

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
          status: status || "Draft",
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
      return res
        .status(404)
        .json({
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
              nodePayload = `<p style="margin:0; font-size:14px; line-height:1.6; white-space:pre-wrap;">${el.textContent}</p>`;
            } else if (el.type === "image") {
              nodePayload = `
            <div style="text-align: ${el.imageAlignment?.toLowerCase() || "center"};">
              <img src="${el.imageUrl || "https://via.placeholder.com/400x200?text=No+Data+Graphic"}" style="max-width:100%; height:auto; border-radius:4px;" />
              ${el.imageLegend ? `<div class="legend-box" style="font-size:11px; font-style:italic; color:#4a5568; margin-top:4px;"><b>${el.imageLegend}</b></div>` : ""}
              ${el.imageDescription ? `<p style="font-size:12px; color:#718096; margin-top:2px;">${el.imageDescription}</p>` : ""}
            </div>`;
            } else if (el.type === "table") {
              let rowsMarkup = el.tableData
                .map(
                  (row, rIdx) => `
            <tr style="background: ${rIdx === 0 ? "#f7fafc" : "transparent"}; font-weight: ${rIdx === 0 ? "bold" : "normal"}; border-bottom: 1px solid #e2e8f0;">
              ${row.map((cell) => `<td style="padding: 8px; border: 1px solid #cbd5e0; text-align:center;">${cell || ""}</td>`).join("")}
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
          <div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.w}px; height: ${el.h}px; z-index: ${el.zIndex}; overflow: hidden;">
            ${nodePayload}
          </div>`;
          })
          .join("");

        return `
        <div class="report-card" style="background:#ffffff; margin-bottom:40px; padding:30px; border-radius:8px; border-top: 6px solid #1a365d; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position:relative; min-height:550px;">
          <div class="section-meta-header" style="margin-bottom:20px; border-bottom: 2px solid #e2e8f0; padding-bottom:10px;">
            <span style="font-size:11px; font-weight:bold; color:#3182ce; text-transform:uppercase;">SECTION MODULE #${sIdx + 1}</span>
            <h3 style="margin:5px 0 2px 0; color:#2d3748; font-size:22px;">${sec.title || "Untitled Workspace Unit"}</h3>
            ${sec.description ? `<p style="margin:0; font-size:13px; color:#718096; font-style:italic;">${sec.description}</p>` : ""}
          </div>
          <div class="preview-canvas-viewport" style="position:relative; width:100%; height:460px; background:#fcfdfd; border-radius:4px;">
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
                  <p style="margin: 0 0 5px 0; color: #4a5568; font-weight: 500;">${report.footer?.text || "Bionivid Analytical Sequence Output — All Rights Reserved."}</p>
                  ${report.footer?.pageNumbering ? `<div style="font-size: 11px; color: #718096; font-weight: bold;">Continuous Page Index Sequencing Activated</div>` : ""}
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

module.exports = router;
