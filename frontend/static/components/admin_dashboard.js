export default {
  props: ['searchQuery'],
  template: `
  <div class="container mt-4">
    <div class="text-center mb-4">
      <h3 class="fw-bold">Welcome, {{ userData.username }}!</h3>
    </div>
    
<div class="row">
  <div class="col-md-6 mb-4" v-for="subject in filteredSubjects" :key="subject.id">
    <div class="card shadow-sm">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">{{ subject.name }}</h5>
            <p class="mb-0 text-muted small">
              {{ subject.description }}
            </p>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-primary me-2"@click="editsubject(subject)">
              <i class="bi bi-pencil"></i>Edit
            </button>
            <button class="btn btn-sm btn-outline-danger"@click="deletesubject(subject)">
              <i class="bi bi-trash"></i>Delete
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        <table class="table mb-0">
          <thead class="table-light">
            <tr>
              <th>Chapter Name</th>
              <th>Chapter Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
          <tr v-for="chapter in subject.chapters" :key="chapter.id">
              <td>{{chapter.id}}){{ chapter.name }}</td>
              <td>{{chapter.description}}</td>
              <td>
                <button class="btn btn-sm btn-primary me-2"@click="editchapter(subject, chapter)">
                Edit</button>
                <button class="btn btn-sm btn-danger"@click="deletechapter(subject, chapter)">
                Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn-outline-success mt-3" @click="addchapter(subject)">
        + Chapter
        </button>
      </div>
    </div>
  </div>
</div>


    <div class="text-center">
      <button class="btn btn-primary mt-4" @click="addsubject()">
        + Add Subject
      </button>
    </div>
  </div>
`,

  data: function () {
    return {
      subjects: [],
      quizzes: [],
      questions: [],
      userData: {},
    };
  },
  computed: {
    filteredSubjects() {
      const query = this.searchQuery.toLowerCase();
    
      return this.subjects
        .map(subject => {
          const subjectMatches = subject.name.toLowerCase().includes(query);
          const filteredChapters = (subject.chapters || []).filter(chapter =>
            chapter.name.toLowerCase().includes(query)
          );
    
          if (subjectMatches) {
            return {
              ...subject,
              chapters: subject.chapters
            };
          }
    
          if (filteredChapters.length > 0) {
            return {
              ...subject,
              chapters: filteredChapters
            };
          }
    
          return null;
        })
        .filter(Boolean);
    }    
  },  
  mounted() {
    fetch('/api/home', {
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": localStorage.getItem("auth_token")
      }
    })
    .then(response => {
      if (response.status === 401) {
        this.$router.push("/login");
        throw new Error("Unauthorized");
      }
      return response.json();
    })
    .then(data => {
      this.userData = data;
  
      return fetch('/api/subjects', {
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        }
      });
    })
    .then(res => res.json())
    .then(subjectsData => {
      const chapterFetches = subjectsData.map(subject => {
        return fetch(`/api/subjects/${subject.id}/chapters`, {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth_token")
          }
        })
        .then(res => res.json())
        .then(chaptersData => {
          subject.chapters = chaptersData.map(chapter => ({
            ...chapter,
            question_count: chapter.questions?.length || 0
          }));
        });
      });
      return Promise.all(chapterFetches).then(() => subjectsData);
    })
    .then(subjectsWithChapters => {
      this.subjects = subjectsWithChapters;
    })
    .catch(err => console.error("Dashboard load error:", err));
  },
  methods: {
    loadChapters() {
      const subjectId = this.newQuizForm.subject_id;
      if (!subjectId) return;
  
      fetch(`/api/subjects/${subjectId}/chapters`, {
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        }
      })
        .then(res => res.json())
        .then(chapters => {
          this.chapters = chapters;
        })
        .catch(err => console.error("Error loading chapters:", err));
    },
    addsubject() {
      const name = prompt("Enter new subject name:");
      if (name === null)return;
      if (name.trim() === "") {
        alert("Subject name cannot be empty.");
        return;
      }
      const description = prompt("Enter subject description(optional):")|| "";
      fetch('/api/subjects', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({ name:name.trim(), description:description.trim() })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to create subject");
        }
        return response.json();
      })
      .then(newSubject => {
        this.subjects.push({
          id: newSubject.id,
          name: newSubject.name,
          description: newSubject.description || "",
          chapters: []
        });
        alert("Subject created successfully!");
      })
      .catch(error => {
        console.error("Error creating subject:", error);
        alert("Failed to create subject.Please try again.");
      });
    },
    editsubject(subject) {
      const newName = prompt("Enter new subject name:", subject.name);
      if (newName === null) return;
      if (newName.trim() === "") {
        alert("Subject name cannot be empty.");
        return;
      }
      const oldName = subject.name;
      const newDescription = prompt("Enter new subject description(optional):", subject.description) || "";
      fetch(`/api/subjects/${subject.id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({ name: newName, description: newDescription })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to update subject");
        }
        return response.json();
      })
      .then(updatedSubject => {
        subject.name = updatedSubject.name;
        subject.description = updatedSubject.description || "";
        alert("Subject updated successfully!");
      })
      .catch(error => {
        subject.name = oldName; 
        console.error("Error updating subject:", error);
        alert("Failed to update subject. Please try again.");
      });
    },
    deletesubject(subject) {
      if (confirm(`Are you sure you want to delete the subject "${subject.name}"?`)) {
        fetch(`/api/subjects/${subject.id}`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth_token")
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to delete subject");
          }
          this.subjects = this.subjects.filter(s => s.id !== subject.id);
          alert("Subject deleted successfully!");
        })
        .catch(error => {
          console.error("Error deleting subject:", error);
          alert("Failed to delete subject. Please try again.");
        });
      };
    },
    addchapter(subject) {
      const name = prompt("Enter new chapter name:");
      if (name === null)return;
      if (name.trim() === "") {
        alert("Chapter name cannot be empty.");
        return;
      }
      const description = prompt("Enter chapter description(optional):")|| "";
      fetch('/api/subjects/'+ subject.id +'/chapters', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({ name:name.trim(), description:description.trim() })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to create chapter");
        }
        return response.json();
      })
      .then(newChapter => {
        subject.chapters.push({
          id: newChapter.id,
          name: newChapter.name,
          description: newChapter.description || "",
          chapters: []
        });
        alert("Chapter created successfully!");
      })
      .catch(error => {
        console.error("Error creating chapter:", error);
        alert("Failed to create chapter.Please try again.");
      });
    },
    editchapter(subject,chapter) {
    const newName = prompt("Enter new chapter name:", chapter.name);
    if (newName === null){
      return;
    }
    if (newName.trim() === "") {
      alert("Chapter name cannot be empty.");
      return;
    }
    const oldName = chapter.name;
    const newDescription = prompt("Enter new chapter description(optional):", chapter.description) || "";
      fetch(`/api/subjects/${subject.id}/chapters/${chapter.id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({ name: newName, description: newDescription})
      })
      .then(response =>{
        if (!response.ok) {
          throw new Error("Failed to update chapter");
        }
        return response.json();
      })
      .then(updatedChapter =>{
        subject.chapters = subject.chapters.map(c =>
          c.id === updatedChapter.id ? { ...c, name: updatedChapter.name } : c
        );      
        alert("Chapter updated successfully!");
        
      })
      .catch(error => {
        chapter.name= oldName; 
        console.error("Error updating chapter:", error);
        alert("Failed to update chapter. Please try again.");
      });
    },
    deletechapter(subject, chapter) {
      if (confirm(`Are you sure you want to delete the chapter "${chapter.name}"?`)) {
        fetch(`/api/subjects/${subject.id}/chapters/${chapter.id}`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth_token")
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to delete chapter");
          }
          subject.chapters = subject.chapters.filter(c => c.id !== chapter.id);
          alert("Chapter deleted successfully!");
        })
        .catch(error => {
          console.error("Error deleting chapter:", error);
          alert("Failed to delete chapter. Please try again.");
        });
      };
    }
  }
}
