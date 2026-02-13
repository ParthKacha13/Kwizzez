export default {
  props: ['searchQuery'],
  data() {
    return {
      quizId: null,
      chapterId: null,
      questions: [],
      currentQuestionIndex: 0,
      selectedOption: null,
      answers: [],
      timeLeft: 0,
      quizEndTime: 0,
      timer: null,
      quizDetails: null,
      userScores: [],
      isLoading: false,
      error: null,
      submitting: false,
      _isMounted: false,
      autoSaveInterval: null,
      showStartConfirmation: true,
      showScore: false,
      finalScore: 0
    };
  },
  
  computed: {
    currentQuestion() {
      return this.questions[this.currentQuestionIndex];
    },
    timerDisplay() {
      const mins = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
      const secs = (this.timeLeft % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    },
    isLastQuestion() {
      return this.currentQuestionIndex === this.questions.length - 1;
    },
    isFirstQuestion() {
      return this.currentQuestionIndex === 0;
    },
    alreadyAttempted() {
      return this.userScores.includes(this.quizId);
    },
    scorePercentage() {
      return Math.round((this.finalScore / this.questions.length) * 100);
    }
  },

  methods: {
    async startQuizAfterConfirmation() {
      this.showStartConfirmation = false;
      await this.fetchQuiz();
    },

    async fetchQuiz() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const { quizId, chapterId } = this.$route.params;
        this.quizId = quizId;
        this.chapterId = chapterId;
        
        if (this.alreadyAttempted) {
          throw new Error('You have already attempted this quiz');
        }

        const token = localStorage.getItem('auth_token');
        const [metaRes, questionsRes] = await Promise.all([
          fetch(`/api/chapters/${chapterId}/quizzes/${quizId}`, {
            headers: { 'Authentication-Token': token }
          }),
          fetch(`/api/chapters/${chapterId}/quizzes/${quizId}/questions`, {
            headers: { 'Authentication-Token': token }
          })
        ]);

        if (!metaRes.ok || !questionsRes.ok) {
          throw new Error('Failed to fetch quiz data');
        }

        const [meta, questions] = await Promise.all([
          metaRes.json(),
          questionsRes.json()
        ]);

        if (!questions.length) {
          throw new Error('No questions found for this quiz');
        }

        this.quizDetails = meta;
        this.questions = questions.map(q => ({
          ...q,
          question_statement: q.question_statement,
          options: [q.option1, q.option2, q.option3, q.option4],
        }));

        this.answers = Array(this.questions.length).fill(null);
        this.selectedOption = null;
        
        this.initializeTimer(meta.time_duration || 15);
        
        this.autoSaveInterval = setInterval(() => {
          this.saveProgress();
        }, 5000);
      } catch (error) {
        this.error = error.message;
        this.$router.push('/dashboard');
      } finally {
        this.isLoading = false;
      }
    },

    initializeTimer(duration) {
      const minutes = typeof duration === 'string' && duration.includes(':') 
        ? this.convertToMinutes(duration)
        : Number(duration);
      
      this.timeLeft = minutes * 60;
      this.quizEndTime = Date.now() + (this.timeLeft * 1000);
      this.runTimer();
    },

    convertToMinutes(timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return (hours * 60) + minutes;
    },

    runTimer() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      
      this.syncTimer();
      this.timer = setInterval(() => {
        this.syncTimer();
      }, 1000);
    },

    syncTimer() {
      const now = Date.now();
      this.timeLeft = Math.max(0, Math.floor((this.quizEndTime - now) / 1000));
      
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.submitQuiz();
      }
    },

    saveProgress() {
      const examState = {
        quizId: this.quizId,
        chapterId: this.chapterId,
        questions: this.questions,
        answers: this.answers,
        currentQuestionIndex: this.currentQuestionIndex,
        quizEndTime: this.quizEndTime,
        timeSavedAt: Date.now()
      };
      localStorage.setItem('activeExam', JSON.stringify(examState));
    },

    restoreProgress() {
      const savedExam = localStorage.getItem('activeExam');
      if (!savedExam) return false;
      
      try {
        const examData = JSON.parse(savedExam);
        
        const timeElapsed = Date.now() - examData.timeSavedAt;
        const remainingTime = Math.max(0, examData.quizEndTime - Date.now());
        
        Object.assign(this, {
          quizId: examData.quizId,
          chapterId: examData.chapterId,
          questions: examData.questions,
          answers: examData.answers,
          currentQuestionIndex: examData.currentQuestionIndex,
          quizEndTime: Date.now() + remainingTime,
          selectedOption: examData.answers[examData.currentQuestionIndex]
        });
        
        this.timeLeft = Math.floor(remainingTime / 1000);
        this.runTimer();
        return true;
      } catch (e) {
        console.error('Failed to restore exam progress:', e);
        return false;
      }
    },

    nextQuestion() {
      if (this.selectedOption == null && this.answers[this.currentQuestionIndex] == null) {
        return alert("Please select an option before proceeding");
      }
      
      this.answers[this.currentQuestionIndex] = this.selectedOption;
      this.saveProgress();
      
      if (!this.isLastQuestion) {
        this.currentQuestionIndex++;
        this.selectedOption = this.answers[this.currentQuestionIndex];
      }
    },

    prevQuestion() {
      this.answers[this.currentQuestionIndex] = this.selectedOption;
      this.saveProgress();
      
      if (!this.isFirstQuestion) {
        this.currentQuestionIndex--;
        this.selectedOption = this.answers[this.currentQuestionIndex];
      }
    },

    confirmSubmit() {
      if (confirm("Are you sure you want to submit the quiz?")) {
        this.submitQuiz();
      }
    },

    async submitQuiz() {
      if (this.submitting) return;
      this.submitting = true;
      
      if (this.timer) clearInterval(this.timer);
      if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
      this.answers[this.currentQuestionIndex] = this.selectedOption;
      
      try {
        const res = await fetch(`/api/chapters/${this.chapterId}/quizzes/${this.quizId}/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth_token')
          },
          body: JSON.stringify({ answers: this.answers })
        });

        if (!res.ok) throw new Error('Submission failed');
        
        const result = await res.json();
        this.finalScore = result.score;
        this.showScore = true;
        
        setTimeout(() => {
          this.cleanup();
          this.$router.push('/dashboard');
        }, 5000);
      } catch (error) {
        console.error("Submit error:", error);
        alert("Error submitting quiz: " + error.message);
        this.$router.push('/dashboard');
      } finally {
        this.submitting = false;
      }
    },

    cleanup() {
      localStorage.removeItem('activeExam');
      if (this.timer) clearInterval(this.timer);
      if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    },

    handleBeforeUnload(e) {
      if (this.questions.length > 0 && !this.submitting && !this.showScore) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your progress will be saved.";
        this.saveProgress();
      }
    }
  },

  async mounted() {
    this._isMounted = true;
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    const restored = this.restoreProgress();
    if (restored) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const scoresRes = await fetch('/api/me/scores', {
        headers: { 'Authentication-Token': token }
      });
      if (scoresRes.ok) {
        this.userScores = (await scoresRes.json()).map(s => s.quiz_id);
      }
    } catch (error) {
      console.error('Failed to fetch user scores:', error);
    }
  },

  beforeDestroy() {
    this._isMounted = false;
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.cleanup();
  },

  template: `
    <div v-if="showStartConfirmation" class="modal fade show" style="display: block; background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Quiz Start</h5>
          </div>
          <div class="modal-body">
            <p>Starting the quiz will begin the timer immediately.</p>
            <p>Are you ready to begin?</p>
          </div>
          <div class="modal-footer">
            <button @click="$router.push('/dashboard')" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="startQuizAfterConfirmation" class="btn btn-primary">
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading quiz...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="showScore" class="container text-center py-5">
      <div class="card">
        <div class="card-body">
          <h3 class="card-title">Quiz Completed!</h3>
          <div class="display-4 my-4">
            Score: {{ finalScore }}/{{ questions.length }}
          </div>
          <div class="progress mb-4" style="height: 30px;">
            <div class="progress-bar" 
                 :class="{
                   'bg-success': scorePercentage >= 70,
                   'bg-warning': scorePercentage >= 40 && scorePercentage < 70,
                   'bg-danger': scorePercentage < 40
                 }"
                 :style="{ width: scorePercentage + '%' }">
              {{ scorePercentage }}%
            </div>
          </div>
          <p>You will be redirected to dashboard shortly...</p>
        </div>
      </div>
    </div>

    <div v-else-if="questions.length > 0" class="container py-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 v-if="quizDetails">{{ quizDetails.name }}</h4>
          <div><strong>Question:</strong> {{ currentQuestionIndex + 1 }} of {{ questions.length }}</div>
        </div>
        <div class="text-end">
          <div class="fs-5 fw-bold" :class="{ 'text-danger': timeLeft < 60 }">{{ timerDisplay }}</div>
          <small>Time Remaining</small>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title mb-3">{{ currentQuestion.question_statement }}</h5>
          
          <div class="form-group">
            <div v-for="(option, idx) in currentQuestion.options" :key="idx" class="mb-3">
              <div class="form-check">
                <input 
                  type="radio" 
                  :id="'option' + idx" 
                  :value="idx + 1" 
                  v-model="selectedOption"
                  class="form-check-input"
                >
                <label :for="'option' + idx" class="form-check-label ms-2">
                  {{ option }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between mt-4">
        <button 
          @click="prevQuestion" 
          :disabled="isFirstQuestion"
          class="btn btn-outline-primary"
        >
          Previous
        </button>
        
        <button 
          v-if="!isLastQuestion" 
          @click="nextQuestion" 
          class="btn btn-primary"
        >
          Next Question
        </button>
        
        <button 
          v-else 
          @click="confirmSubmit" 
          class="btn btn-success"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  `
};








