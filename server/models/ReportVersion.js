const mongoose = require('mongoose');

const LayoutElementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'table'], required: true },
  x: { type: Number, default: 40 },
  y: { type: Number, default: 120 },
  w: { type: Number, default: 400 },
  h: { type: Number, default: 220 },
  zIndex: { type: Number, default: 1 },
  
  // Custom Content Matrix Layers Data fields mapping
  textContent: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  imageLegend: { type: String, default: '' },
  imageDescription: { type: String, default: '' },
  imageAlignment: { type: String, enum: ['Left', 'Center', 'Right'], default: 'Center' },
  
  tableRowsCount: { type: Number, default: 3 },
  tableColsCount: { type: Number, default: 3 },
  tableData: { type: [[String]], default: [] },
  tableLegend: { type: String, default: '' },
  tableDescription: { type: String, default: '' }
});

const CustomBuilderSectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: 'Untitled Analytical Section Block' },
  description: { type: String, default: '' },
  elements: [LayoutElementSchema] // Embedded canvas array list boundaries mapping
});

const ComprehensiveReportSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  versionId: { type: String, required: true, unique: true },
  reportName: { type: String, default: 'Untitled Enterprise Report Workspace Studio Output' },
  status: { type: String, enum: ['draft', 'published', 'sent_back'], default: 'draft' },
  header: {
    logo: { type: String, default: '' },
    title: { type: String, default: '' },
    subTitle: { type: String, default: '' },
    analystName: { type: String, default: '' },
    date: { type: String, default: '' }
  },
  footer: {
    text: { type: String, default: '' },
    pageNumbering: { type: Boolean, default: true },
    confidentialTag: { type: Boolean, default: true }
  },
  sections: [CustomBuilderSectionSchema]
}, { timestamps: true });

module.exports = mongoose.model('ReportVersion', ComprehensiveReportSchema);