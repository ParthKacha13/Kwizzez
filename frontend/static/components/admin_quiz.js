export default {
  template: `
  <div class="container mt-4">
  <div class="text-center mb-4">
    <h3 class="fw-strong">Quiz Management</h3>
  </div>

  <div class="row">
    <div class="col-md-6 mb-4" v-for="quiz in quizzes" :key="quiz.id">
      <div class="card shadow-sm">

        <!-- The header toggles the quiz open/closed -->
        <div class="card-header" @click="toggleQuiz(quiz.id)" style="cursor: pointer;">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="card-title mb-1">
                Quiz {{ quiz.id }} ({{ quiz.chapter_name }})
                <button class="btn btn-sm btn-outline-danger ms-2" @click.stop="deleteQuiz(quiz)">
                  Delete Quiz
                </button>
                <button class="btn btn-sm btn-outline-primary ms-2" @click.stop="openEditQuizModal(quiz)">
                  Edit Quiz
                </button>
              </h5>
              <p class="mb-0 small text-muted">
                Date: {{ quiz.date }} | Duration: {{ quiz.duration }} | Remarks: {{ quiz.remarks }}
              </p>
            </div>
            <div>
              <span v-if="expandedQuizId === quiz.id" class="text-muted">▲</span>
              <span v-else class="text-muted">▼</span>
            </div>
          </div>
        </div>


        <div class="card-body" v-if="expandedQuizId === quiz.id">
        <table class="table mb-0">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Statement</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="question in quiz.questions" :key="question.id">
              <td>{{ question.id }}</td>
              <td>{{ question.statement }}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-2" @click="openEditQuestionModal(quiz, question)">
                  Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteQuestion(quiz, question)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
          <!-- This is outside header, no .stop needed -->
          <button class="btn btn-outline-success mt-3" @click="openAddQuestionModal(quiz)">
          + Add Question
        </button>
      </div>
    </div>
  </div>
</div>
  <div class="modal fade" id="editQuizModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Edit Quiz</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-2">
          <label>Quiz Date</label>
          <input type="date" v-model="editQuizForm.date_of_quiz" class="form-control" />
        </div>
        <div class="mb-2">
          <label>Duration (HH:MM)</label>
          <input type="text" v-model="editQuizForm.time_duration" class="form-control" />
        </div>
        <div class="mb-2">
          <label>Remarks</label>
          <textarea v-model="editQuizForm.remarks" class="form-control"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" @click="submitEditQuiz">Save Changes</button>
      </div>
    </div>
  </div>
</div>

  <!-- New Quiz button -->
  <div class="text-center">
    <button class="btn btn-primary mt-4"
            data-bs-toggle="modal"
            data-bs-target="#quizModal">
      + New Quiz
    </button>
  </div>

  <!-- Create Quiz Modal (Updated for robust chapter filtering) -->
<div class="modal fade" id="quizModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Create New Quiz</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-2">
          <label>Subject</label>
          <select v-model="newQuizForm.subject_id"
                  @change="loadChapters"
                  class="form-select">
            <option disabled value="">Select Subject</option>
            <option v-for="subject in subjects"
                    :key="subject.id"
                    :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>

        <div class="mb-2">
          <label>Chapter</label>
          <select v-model="newQuizForm.chapter_id" class="form-select">
            <option disabled value="">Select Chapter</option>
            <option v-for="chapter in chapters"
                    :key="chapter.id"
                    :value="chapter.id">
              {{ chapter.name }}
            </option>
          </select>
          <div v-if="chapters.length === 0" class="text-danger mt-1">
            No chapters found for this subject.
          </div>
        </div>

        <div class="mb-2">
          <label>Quiz Date</label>
          <input type="date" v-model="newQuizForm.date_of_quiz" class="form-control" />
        </div>

        <div class="mb-2">
          <label>Duration (HH:MM)</label>
          <input type="text" v-model="newQuizForm.time_duration" class="form-control" />
        </div>

        <div class="mb-2">
          <label>Remarks</label>
          <textarea v-model="newQuizForm.remarks" class="form-control"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" @click="submitNewQuiz">Create Quiz</button>
      </div>
    </div>
  </div>
</div>


  <!-- Add Question Modal -->
  <div class="modal fade" id="addQuestionModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Question</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label>Statement</label>
            <textarea v-model="newQuestionForm.question_statement"
                      class="form-control"></textarea>
          </div>
          <div class="mb-2">
            <label>Option 1</label>
            <input v-model="newQuestionForm.option1"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Option 2</label>
            <input v-model="newQuestionForm.option2"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Option 3</label>
            <input v-model="newQuestionForm.option3"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Option 4</label>
            <input v-model="newQuestionForm.option4"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Correct Option (1-4)</label>
            <input type="number" min="1" max="4"
                   v-model="newQuestionForm.correct_option"
                   class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" @click="submitAddQuestion">Add Question</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Question Modal -->
  <div class="modal fade" id="editQuestionModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Question</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label>Statement</label>
            <textarea v-model="editQuestionForm.question_statement"
                      class="form-control"></textarea>
          </div>
          <div class="mb-2">
            <label>Option 1</label>
            <input v-model="editQuestionForm.option1"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Option 2</label>
            <input v-model="editQuestionForm.option2"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Option 3</label>
            <input v-model="editQuestionForm.option3"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Option 4</label>
            <input v-model="editQuestionForm.option4"
                   class="form-control" />
          </div>
          <div class="mb-2">
            <label>Correct Option (1-4)</label>
            <input type="number" min="1" max="4"
                   v-model="editQuestionForm.correct_option"
                   class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" @click="submitEditQuestion">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</div>

  `,

props: ["searchQuery"],
  data() {
    return {
      userData: {},
      subjects: [],
      chapters: [],
      quizzes: [],
      expandedQuizId: null,
      newQuizForm: {
        subject_id: '',
        chapter_id: '',
        date_of_quiz: new Date().toISOString().split('T')[0],
        time_duration: '',
        remarks: ''
      },
      editQuizForm: {
        quiz: null,
        date_of_quiz: '',
        time_duration: '',
        remarks: ''
      },
      newQuestionForm: {
        quiz: null,
        question_statement: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: 1
      },
      editQuestionForm: {
        quiz: null,
        question: null,
        question_statement: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: 1
      }
    };
  },

  mounted() {
    fetch('/api/home', {
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": localStorage.getItem("auth_token")
      }
    })
      .then(res => {
        if (res.status === 401) {
          this.$router.push("/login");
          return;
        }
        return res.json();
      })
      .then(data => {
        this.userData = data;

        return fetch('/api/quizzes', {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth_token")
          }
        });
      })
      .then(res => res.json())
      .then(quizzes => {
        this.quizzes = quizzes.map(q => ({
          ...q,
          chapter_id: q.chapter_id || (q.chapter ? q.chapter.id : null),
          chapter_name: q.chapter ? q.chapter.name : '',
          date: q.date_of_quiz || '',
          duration: q.time_duration || '',
          questions: (q.questions || []).map(que => ({
            ...que,
            statement: que.question_statement
          }))
        }));
        console.log("Loaded quizzes:", this.quizzes);

        return fetch('/api/subjects', {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth_token")
          }
        });
      })
      .then(res => res.json())
      .then(subjects => {
        this.subjects = subjects;
        console.log("Loaded subjects:", subjects);
      })
      .catch(err => console.error("Error loading data:", err));
  },

  computed: {
    filteredQuizzes() {
      const query = this.searchQuery ? this.searchQuery.toLowerCase() : "";
      return this.quizzes.filter(q => {
        const subjectName = this.subjects.find(s => s.id === q.subject_id)?.name || "";
        const chapterName = this.chapters.find(c => c.id === q.chapter_id)?.name || "";
  
        return (
          subjectName.toLowerCase().includes(query) ||
          chapterName.toLowerCase().includes(query)
        );
      });
    }
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
        .then(allChapters => {
          this.chapters = allChapters;
        })
        .catch(err => console.error("Error loading chapters:", err));
    },
    

    toggleQuiz(quizId) {
      this.expandedQuizId = this.expandedQuizId === quizId ? null : quizId;
    },
  
    submitNewQuiz() {
      const { chapter_id, date_of_quiz, time_duration, remarks } = this.newQuizForm;
    
      if (!chapter_id || isNaN(chapter_id)) {
        alert("Please select a valid chapter.");
        return;
      }
    
      if (!date_of_quiz || !time_duration) {
        alert("Please fill in date and duration.");
        return;
      }
    
      fetch(`/api/chapters/${chapter_id}/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({ date_of_quiz, time_duration, remarks })
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) throw new Error(data.message || "Failed to create quiz.");
    
          const selectedChapter = this.chapters.find(ch => ch.id === Number(chapter_id));
    
          this.quizzes.push({
            id: data.id,
            chapter_id: Number(chapter_id),
            chapter_name: selectedChapter?.name || `Chapter ${chapter_id}`,
            date: date_of_quiz,
            duration: time_duration,
            remarks: remarks,
            questions: []
          });
    
          this.newQuizForm = {
            subject_id: '',
            chapter_id: '',
            date_of_quiz: new Date().toISOString().split('T')[0],
            time_duration: '',
            remarks: ''
          };
          this.chapters = [];
    
          bootstrap.Modal.getInstance(document.getElementById('quizModal')).hide();
          alert("Quiz created successfully!");
        })
        .catch(err => {
          console.error(err);
          alert("Failed to create quiz.");
        });
    },
    

    openEditQuizModal(quiz) {
      this.editQuizForm.quiz = quiz;
      this.editQuizForm.date_of_quiz = quiz.date_of_quiz || quiz.date;
      this.editQuizForm.time_duration = quiz.time_duration || quiz.duration;
      this.editQuizForm.remarks = quiz.remarks;
    
      const modal = new bootstrap.Modal(document.getElementById('editQuizModal'));
      modal.show();
    },
    
    submitEditQuiz() {
      const { quiz, date_of_quiz, time_duration, remarks } = this.editQuizForm;
    
      if (!date_of_quiz || !time_duration) {
        alert("Date and duration are required!");
        return;
      }
    
      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({
          date_of_quiz,
          time_duration,
          remarks
        })
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to update quiz");
          quiz.date_of_quiz = date_of_quiz;
          quiz.date = date_of_quiz; 
          quiz.time_duration = time_duration;
          quiz.duration = time_duration; 
          quiz.remarks = remarks;
    
          bootstrap.Modal.getInstance(document.getElementById('editQuizModal')).hide();
          alert("Quiz updated!");
        })
        .catch(err => {
          console.error(err);
          alert("Failed to update quiz.");
        });
    },

    deleteQuiz(quiz) {
      if (!confirm(`Delete Quiz #${quiz.id}?`)) return;

      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Delete failed");
          return res.json();
        })
        .then(() => {
          this.quizzes = this.quizzes.filter(q => q.id !== quiz.id);
          alert(`Quiz #${quiz.id} deleted!`);
        })
        .catch(err => {
          console.error(err);
          alert("Failed to delete quiz.");
        });
    },
    openAddQuestionModal(quiz) {
      this.newQuestionForm.quiz = quiz;
      this.newQuestionForm.question_statement = '';
      this.newQuestionForm.option1 = '';
      this.newQuestionForm.option2 = '';
      this.newQuestionForm.option3 = '';
      this.newQuestionForm.option4 = '';
      this.newQuestionForm.correct_option = 1;
  
      const modal = new bootstrap.Modal(document.getElementById('addQuestionModal'));
      modal.show();
    },
  
    submitAddQuestion() {
      const { quiz, question_statement, option1, option2, option3, option4, correct_option } = this.newQuestionForm;
  
      if (!question_statement || !option1 || !option2 || !option3 || !option4) {
        alert("All fields required!");
        return;
      }
      if (![1, 2, 3, 4].includes(parseInt(correct_option))) {
        alert("Correct option must be 1-4!");
        return;
      }
  
      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({
          question_statement,
          option1,
          option2,
          option3,
          option4,
          correct_option: parseInt(correct_option)
        })
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) throw new Error(data.message || "Add question failed");
          quiz.questions.push(data);
  
          bootstrap.Modal.getInstance(document.getElementById('addQuestionModal')).hide();
          alert("Question added!");
        })
        .catch(err => {
          console.error(err);
          alert("Failed to add question.");
        });
    },
 
    submitAddQuestion() {
      const { quiz, question_statement, option1, option2, option3, option4, correct_option } = this.newQuestionForm;
  
      if (!question_statement || !option1 || !option2 || !option3 || !option4) {
        alert("All fields required!");
        return;
      }
      if (![1, 2, 3, 4].includes(parseInt(correct_option))) {
        alert("Correct option must be 1-4!");
        return;
      }
  
      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({
          question_statement,
          option1,
          option2,
          option3,
          option4,
          correct_option: parseInt(correct_option)
        })
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) throw new Error(data.message || "Add question failed");
          quiz.questions.push(data);
  
          bootstrap.Modal.getInstance(document.getElementById('addQuestionModal')).hide();
          alert("Question added!");
        })
        .catch(err => {
          console.error(err);
          alert("Failed to add question.");
        });
    },
  
    openEditQuestionModal(quiz, question) {
      this.editQuestionForm.quiz = quiz;
      this.editQuestionForm.question = question;
      this.editQuestionForm.question_statement = question.statement;
      this.editQuestionForm.option1 = question.option1;
      this.editQuestionForm.option2 = question.option2;
      this.editQuestionForm.option3 = question.option3;
      this.editQuestionForm.option4 = question.option4;
      this.editQuestionForm.correct_option = question.correct_option;
  
      const modal = new bootstrap.Modal(document.getElementById('editQuestionModal'));
      modal.show();
    },

    submitEditQuestion() {
      const { quiz, question, question_statement, option1, option2, option3, option4, correct_option } = this.editQuestionForm;
  
      if (!question_statement || !option1 || !option2 || !option3 || !option4) {
        alert("All fields required!");
        return;
      }
      if (![1, 2, 3, 4].includes(parseInt(correct_option))) {
        alert("Correct option must be 1-4!");
        return;
      }
  
      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}/questions/${question.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        },
        body: JSON.stringify({
          question_statement,
          option1,
          option2,
          option3,
          option4,
          correct_option: parseInt(correct_option)
        })
      })
        .then(res => {
          if (!res.ok) throw new Error("Update failed");
          question.statement = question_statement;
          question.option1 = option1;
          question.option2 = option2;
          question.option3 = option3;
          question.option4 = option4;
          question.correct_option = parseInt(correct_option);
  
          bootstrap.Modal.getInstance(document.getElementById('editQuestionModal')).hide();
          alert("Question updated!");
        })
        .catch(err => {
          console.error(err);
          alert("Failed to update question.");
        });
    },
    deleteQuestion(quiz, question) {
      if (!confirm(`Delete question #${question.id}?`)) return;

      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}/questions/${question.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": localStorage.getItem("auth_token")
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Delete failed");
          quiz.questions = quiz.questions.filter(q => q.id !== question.id);
          alert("Question Deleted!");
        })
        .catch(err => {
          console.error(err);
          alert("Failed to delete question.");
        });
    }
  }
};