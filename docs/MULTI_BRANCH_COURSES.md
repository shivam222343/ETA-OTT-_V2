# 🎓 Eta Platform - Multi-Branch Course Management

## 📋 **Workflow Overview**

The Eta platform now supports a flexible course management system where:

1. **Faculty creates Institutions** (Colleges/Universities)
2. **Faculty creates Branches** under each institution (e.g., CS Sem 5, CS Sem 6, ECE Sem 3)
3. **Faculty creates Courses** and assigns them to **one or multiple branches**
4. **Faculty uploads Resources** (PDFs, Videos) to courses
5. **Resources are automatically shared** across all branches where the course is assigned

---

## 🏗️ **Architecture**

### **Data Model:**

```
Institution (College)
  └── Branch 1 (CS Semester 5)
  └── Branch 2 (CS Semester 6)
  └── Branch 3 (ECE Semester 3)
  
Course (Data Structures)
  ├── Assigned to: [Branch 1, Branch 2]  ← Multiple branches!
  └── Content: [PDF 1, Video 1, PDF 2]   ← Shared resources
```

### **Database Schema Updates:**

**Course Model Changes:**
```javascript
{
  branchIds: [ObjectId],      // Changed from branchId (singular) to branchIds (array)
  institutionId: ObjectId,    // Added for direct institution reference
  name: String,
  code: String,
  description: String,
  metadata: {
    credits: Number,
    semester: String
  },
  contentIds: [ObjectId],     // Shared across all assigned branches
  facultyIds: [ObjectId]
}
```

---

## 🎯 **Use Cases**

### **Use Case 1: Same Course, Multiple Semesters**
**Scenario:** "Data Structures" is taught in both Semester 5 and Semester 6

**Steps:**
1. Create course "Data Structures"
2. Select both "CS Sem 5" and "CS Sem 6" branches
3. Upload course materials once
4. Students in both semesters see the same content

**Benefits:**
- ✅ Upload content only once
- ✅ Update in one place, reflects everywhere
- ✅ Consistent teaching across semesters

### **Use Case 2: Common Foundation Courses**
**Scenario:** "Mathematics I" is common across CS, ECE, and Mechanical branches

**Steps:**
1. Create course "Mathematics I"
2. Select "CS Sem 1", "ECE Sem 1", "Mech Sem 1"
3. Upload materials once
4. All branches access the same resources

**Benefits:**
- ✅ No duplication of content
- ✅ Centralized updates
- ✅ Efficient resource management

### **Use Case 3: Elective Courses**
**Scenario:** "Machine Learning" is an elective for multiple branches

**Steps:**
1. Create course "Machine Learning"
2. Select all branches offering this elective
3. Upload once, available to all
4. Track students across branches

---

## 🔄 **Complete Faculty Workflow**

### **Step 1: Create Institution**
```
Faculty Dashboard → Institutions Tab → "+ Add Institution"
- Name: "MIT University"
- Website: "https://mit.edu"
- Address: "Cambridge, MA"
- Logo: URL
```

### **Step 2: Create Branches**
```
Faculty Dashboard → Branches Tab → "+ Add Branch"
- Institution: "MIT University"
- Name: "Computer Science - Semester 5"
- Semester: "5"
- Academic Year: "2024-2025"
```

**Repeat for:**
- "Computer Science - Semester 6"
- "Electronics - Semester 5"
- etc.

### **Step 3: Create Course (Multi-Branch)**
```
Faculty Dashboard → Courses Tab → "+ Add Course"
- Institution: "MIT University"
- Assign to Branches: ✅ CS Sem 5, ✅ CS Sem 6  ← Multiple selection!
- Course Name: "Data Structures"
- Course Code: "CS201"
- Credits: 4
- Semester: 5
- Description: "..."
```

### **Step 4: Upload Resources**
```
Course Details → Upload Content
- Upload PDF: "Data Structures Notes.pdf"
- Upload Video: "Lecture 1 - Introduction.mp4"
- Upload PDF: "Assignment 1.pdf"
```

**Result:** All content is available to students in both CS Sem 5 and CS Sem 6!

---

## 💡 **Key Features**

### **1. Multi-Branch Assignment**
- ✅ Select multiple branches when creating a course
- ✅ Checkbox interface for easy selection
- ✅ Visual feedback showing selected count

### **2. Shared Resources**
- ✅ Upload content once
- ✅ Automatically available to all assigned branches
- ✅ Update once, reflects everywhere

### **3. Branch Display**
- ✅ Course cards show all assigned branches as badges
- ✅ Easy to see which branches have access
- ✅ Color-coded for quick identification

### **4. Flexible Management**
- ✅ Add/remove branches from courses
- ✅ Edit course details
- ✅ Delete courses (removes from all branches)

---

## 🎨 **UI Components**

### **CreateCourseModal**
**Features:**
- Institution dropdown
- Multi-select branch checkboxes
- Course details form
- Selected branch count display
- Info box explaining resource sharing

**User Experience:**
1. Select institution → Branches load
2. Check desired branches → Count updates
3. Fill course details
4. Submit → Course created for all branches

### **CourseCard**
**Features:**
- Course name and code
- Institution name
- **Branch badges** (shows all assigned branches)
- Credits and semester info
- Content count
- Faculty count
- View content button

**Visual:**
```
┌─────────────────────────────────────┐
│ 📚 Data Structures (CS201)          │
│    MIT University                    │
│                                      │
│ Assigned to 2 branches:              │
│ [CS Sem 5] [CS Sem 6]  ← Badges     │
│                                      │
│ 4 Credits • Sem 5 • 12 Content      │
└─────────────────────────────────────┘
```

---

## 🔧 **Backend Updates**

### **Course Routes**
All existing routes now support `branchIds` array:

```javascript
POST /api/courses
{
  "name": "Data Structures",
  "institutionId": "...",
  "branchIds": ["branch1_id", "branch2_id"],  ← Array
  "code": "CS201",
  "metadata": {
    "credits": 4,
    "semester": "5"
  }
}
```

### **Query Support**
```javascript
// Get courses for a specific branch
GET /api/courses/branch/:branchId

// Get courses for an institution
GET /api/courses/institution/:institutionId

// Get all courses (faculty)
GET /api/courses/user/my-courses
```

---

## 📊 **Benefits**

### **For Faculty:**
- ✅ Save time - upload once, use everywhere
- ✅ Consistency - same content across branches
- ✅ Easy updates - change once, reflects everywhere
- ✅ Better organization - see all branches at a glance

### **For Students:**
- ✅ Access to quality content
- ✅ Consistent learning experience
- ✅ No missing materials
- ✅ Same resources as other branches

### **For Institution:**
- ✅ Resource efficiency
- ✅ Quality control
- ✅ Standardized curriculum
- ✅ Easy content management

---

## 🚀 **Next Steps**

### **Already Implemented:**
- ✅ Multi-branch course model
- ✅ CreateCourseModal with multi-select
- ✅ CourseCard with branch badges
- ✅ Backend routes updated

### **To Be Integrated:**
- ⏳ Add to Faculty Dashboard
- ⏳ Test create/list/edit
- ⏳ Content upload integration
- ⏳ Student view implementation

---

## 📝 **Example Scenario**

**Institution:** MIT University

**Branches:**
- CS Semester 5 (50 students)
- CS Semester 6 (45 students)
- ECE Semester 5 (40 students)

**Course:** Data Structures
- **Assigned to:** CS Sem 5, CS Sem 6
- **Content:** 15 PDFs, 20 Videos
- **Total Students:** 95 (50 + 45)

**Result:**
- Faculty uploads 35 files once
- 95 students across 2 branches access the same content
- Updates to content reflect for all students
- Efficient resource management

---

## 🎉 **Summary**

The multi-branch course system enables:
1. **Flexible course assignment** to multiple branches
2. **Shared resources** across branches
3. **Efficient content management**
4. **Consistent learning experience**
5. **Time-saving for faculty**

**This is a powerful feature that makes Eta Platform stand out!** 🚀
