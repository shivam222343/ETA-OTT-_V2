# 📝 Edit Functionality & Content Upload Implementation Plan

## ✅ **Phase 1: Edit Functionality (COMPLETED)**

### **Backend Updates:**
- ✅ Updated `PUT /api/courses/:id` to support:
  - `branchIds` array updates
  - `metadata` updates (credits, semester)
  - Neo4j relationship management (add/remove branches)
  - Returns populated course with all relationships

- ✅ `PUT /api/branches/:id` already exists and works

### **Frontend Components Created:**
- ✅ `EditBranchModal.jsx` - Edit branch name and description
- ✅ `EditCourseModal.jsx` - Edit course with multi-branch selection

### **Integration Needed:**
Update `ManageInstitution.jsx` to:
1. Add state for edit modals
2. Add handlers for edit actions
3. Pass edit handlers to BranchCard and CourseCard
4. Include EditBranchModal and EditCourseModal components

---

## 🚀 **Phase 2: Content Upload & Data Extraction**

### **Overview:**
Implement content upload system that:
1. Accepts multiple file formats (PDF, Video, PPT, etc.)
2. Uploads to Cloudinary
3. Extracts metadata and content data
4. Stores structured data in Neo4j graph database
5. Links content to courses

### **Supported Content Types:**

#### **1. PDF Documents**
**Extraction:**
- Text content (using pdf-parse or similar)
- Page count
- Metadata (title, author, creation date)
- Table of contents (if available)
- Images (optional)

**Graph Structure:**
```
(Content:PDF)-[:BELONGS_TO]->(Course)
(Content)-[:HAS_PAGE]->(Page)
(Page)-[:CONTAINS]->(Topic)
(Topic)-[:RELATED_TO]->(Topic)
```

#### **2. Video Files**
**Extraction:**
- Duration
- Resolution
- Format
- Thumbnail generation
- Transcription (using speech-to-text API)
- Chapters/timestamps (if available)

**Graph Structure:**
```
(Content:Video)-[:BELONGS_TO]->(Course)
(Content)-[:HAS_CHAPTER]->(Chapter)
(Chapter)-[:COVERS]->(Topic)
(Topic)-[:PREREQUISITE_FOR]->(Topic)
```

#### **3. PowerPoint/Presentations**
**Extraction:**
- Slide count
- Text from slides
- Speaker notes
- Images
- Slide titles

**Graph Structure:**
```
(Content:Presentation)-[:BELONGS_TO]->(Course)
(Content)-[:HAS_SLIDE]->(Slide)
(Slide)-[:DISCUSSES]->(Concept)
(Concept)-[:BUILDS_ON]->(Concept)
```

#### **4. Code Files**
**Extraction:**
- Language detection
- Function/class extraction
- Dependencies
- Comments/documentation

**Graph Structure:**
```
(Content:Code)-[:BELONGS_TO]->(Course)
(Content)-[:CONTAINS]->(Function)
(Function)-[:CALLS]->(Function)
(Function)-[:IMPLEMENTS]->(Concept)
```

---

## 📊 **Implementation Architecture:**

### **Backend Structure:**

```
backend/
├── routes/
│   └── content.routes.js          # Content CRUD routes
├── controllers/
│   └── content.controller.js      # Upload & processing logic
├── services/
│   ├── upload.service.js          # Cloudinary upload
│   ├── extraction/
│   │   ├── pdf.extractor.js       # PDF text extraction
│   │   ├── video.extractor.js     # Video metadata extraction
│   │   ├── ppt.extractor.js       # PPT text extraction
│   │   └── code.extractor.js      # Code analysis
│   └── graph/
│       └── content.graph.js       # Neo4j graph creation
├── models/
│   └── Content.model.js           # MongoDB schema
└── utils/
    └── ai.analyzer.js             # AI-powered content analysis
```

### **Content Model Schema:**

```javascript
const contentSchema = new mongoose.Schema({
    courseId: { type: ObjectId, ref: 'Course', required: true },
    branchIds: [{ type: ObjectId, ref: 'Branch' }],
    institutionId: { type: ObjectId, ref: 'Institution' },
    
    title: { type: String, required: true },
    description: String,
    type: { 
        type: String, 
        enum: ['pdf', 'video', 'presentation', 'code', 'document', 'other'],
        required: true 
    },
    
    file: {
        url: String,           // Cloudinary URL
        publicId: String,      // Cloudinary public ID
        format: String,        // File extension
        size: Number,          // File size in bytes
        duration: Number,      // For videos (seconds)
        pages: Number          // For PDFs/presentations
    },
    
    metadata: {
        author: String,
        createdDate: Date,
        language: String,
        tags: [String],
        difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
    },
    
    extractedData: {
        text: String,          // Full text content
        summary: String,       // AI-generated summary
        topics: [String],      // Extracted topics
        keywords: [String],    // Key terms
        structure: Mixed       // Hierarchical structure
    },
    
    graphNodeId: String,       // Neo4j node ID
    
    uploadedBy: { type: ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 }
}, { timestamps: true });
```

---

## 🔧 **Required NPM Packages:**

```bash
# PDF Processing
npm install pdf-parse pdf-lib

# Video Processing
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg

# PPT Processing
npm install officegen pptx2json

# Code Analysis
npm install @babel/parser acorn esprima

# AI/ML
npm install openai @google/generative-ai

# File Upload
npm install multer multer-storage-cloudinary

# Text Processing
npm install natural compromise
```

---

## 📋 **API Endpoints:**

### **Content Routes:**

```javascript
POST   /api/content                    // Upload content
GET    /api/content/:id                // Get content by ID
PUT    /api/content/:id                // Update content
DELETE /api/content/:id                // Delete content
GET    /api/content/course/:courseId   // Get all content for course
GET    /api/content/branch/:branchId   // Get all content for branch
POST   /api/content/:id/analyze        // Re-analyze content
GET    /api/content/:id/graph          // Get graph visualization data
```

---

## 🎯 **Upload Flow:**

```
1. User selects file(s)
   ↓
2. Frontend validates file type/size
   ↓
3. Upload to Cloudinary
   ↓
4. Create Content record in MongoDB
   ↓
5. Extract metadata & content
   ↓
6. Analyze with AI (optional)
   ↓
7. Create graph structure in Neo4j
   ↓
8. Update Content record with extracted data
   ↓
9. Return success with content details
```

---

## 🧠 **Graph Database Structure:**

### **Neo4j Relationships:**

```cypher
// Content to Course
(Content)-[:BELONGS_TO]->(Course)
(Content)-[:UPLOADED_BY]->(User)

// Content Structure
(Content)-[:HAS_SECTION]->(Section)
(Section)-[:CONTAINS]->(Topic)
(Topic)-[:RELATED_TO]->(Topic)
(Topic)-[:PREREQUISITE_FOR]->(Topic)

// Learning Path
(Topic)-[:PART_OF]->(Module)
(Module)-[:SEQUENCE]->(Module)

// Concepts
(Content)-[:TEACHES]->(Concept)
(Concept)-[:REQUIRES]->(Concept)
(Concept)-[:SIMILAR_TO]->(Concept)

// Student Interaction
(Student)-[:VIEWED]->(Content)
(Student)-[:COMPLETED]->(Content)
(Student)-[:BOOKMARKED]->(Content)
```

---

## 📱 **Frontend Components:**

### **Upload Interface:**

```
UploadContentModal.jsx
├── File drop zone
├── File type selector
├── Course/branch selector
├── Metadata form
├── Upload progress
└── Preview after upload

ContentCard.jsx
├── Content preview
├── Type icon
├── Metadata display
├── Actions (view, edit, delete, analyze)
└── Stats (views, downloads)

ContentViewer.jsx
├── PDF viewer
├── Video player
├── Presentation viewer
└── Code viewer with syntax highlighting

GraphVisualization.jsx
└── D3.js/Cytoscape.js graph visualization
```

---

## 🎨 **UI/UX Features:**

1. **Drag & Drop Upload**
2. **Multi-file Upload**
3. **Upload Progress Bar**
4. **File Preview**
5. **Auto-tagging**
6. **Content Search**
7. **Graph Visualization**
8. **Related Content Suggestions**

---

## 🔐 **Security Considerations:**

1. **File Type Validation** - Whitelist allowed types
2. **File Size Limits** - Max 100MB per file
3. **Virus Scanning** - Integrate ClamAV or similar
4. **Access Control** - Only faculty can upload
5. **Content Moderation** - Review before publishing
6. **Rate Limiting** - Prevent abuse

---

## 📊 **Analytics & Insights:**

Extract and track:
- Most viewed content
- Completion rates
- Time spent on content
- Topic difficulty analysis
- Learning path optimization
- Content gaps identification

---

## 🚀 **Implementation Priority:**

### **Phase 2.1: Basic Upload (Week 1)**
- ✅ Content model
- ✅ Upload routes
- ✅ Cloudinary integration
- ✅ Basic metadata extraction
- ✅ Upload UI

### **Phase 2.2: PDF Processing (Week 2)**
- ✅ PDF text extraction
- ✅ Page-by-page processing
- ✅ TOC extraction
- ✅ Graph creation

### **Phase 2.3: Video Processing (Week 3)**
- ✅ Video upload
- ✅ Thumbnail generation
- ✅ Duration/metadata extraction
- ✅ Optional transcription

### **Phase 2.4: AI Analysis (Week 4)**
- ✅ Topic extraction
- ✅ Summary generation
- ✅ Keyword identification
- ✅ Difficulty assessment

### **Phase 2.5: Graph Visualization (Week 5)**
- ✅ Neo4j queries
- ✅ D3.js visualization
- ✅ Interactive exploration
- ✅ Learning path generation

---

## 📝 **Next Immediate Steps:**

1. **Integrate Edit Modals** into ManageInstitution
2. **Create Content Model** in backend
3. **Set up Multer** for file uploads
4. **Create Upload Routes**
5. **Build UploadContentModal** component
6. **Implement PDF Extractor**
7. **Create Neo4j Graph Structure**

---

**This is a comprehensive system that will transform your platform into an intelligent learning management system with AI-powered content analysis and graph-based knowledge representation!** 🚀
