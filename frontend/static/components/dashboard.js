export default {
  template: `
  <div class="container mt-5">
    <!-- DASHBOARD HEADER -->
    <div class="text-center mb-4">
      <h3 class="fw-bold">Welcome, {{ userData.username }}!</h3>
    </div>
       
    <!--  TODAY'S QUIZZES -->
    <div class="text-center mb-2">
      <h5 class="fw-bold text-success">Today's Quizzes</h5>
    </div>
    <table class="table table-bordered text-center shadow-sm mb-5">
      <thead class="table-success">
        <tr><th>ID</th><th>Subject</th><th>Chapter</th><th>Date</th><th>Time</th><th>Action</th></tr>
      </thead>
      <tbody>
        <tr v-if="todaysQuizzes.length === 0">
          <td colspan="6" class="text-muted">No quizzes for today</td>
        </tr>
        <tr v-for="quiz in todaysQuizzes" :key="quiz.vueKey">
          <td>{{ quiz.id }}</td>
          <td>{{ quiz.subject }}</td>
          <td>{{ quiz.chapter }}</td>
          <td>{{ quiz.date_of_quiz }}</td>
          <td>{{ quiz.time_duration }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewQuiz(quiz)">View</button>
            <button class="btn btn-sm btn-primary" @click="startQuiz(quiz)">Start</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!--  UPCOMING QUIZZES -->
    <div class="text-center mb-2">
      <h5 class="fw-bold text-primary">Upcoming Quizzes</h5>
    </div>
    <table class="table table-bordered text-center shadow-sm mb-5">
      <thead class="table-warning">
        <tr><th>ID</th><th>Subject</th><th>Chapter</th><th>Date</th><th>Time</th><th>Action</th></tr>
      </thead>
      <tbody>
        <tr v-if="upcomingQuizzes.length === 0">
          <td colspan="6" class="text-muted">No upcoming quizzes</td>
        </tr>
        <tr v-for="quiz in upcomingQuizzes" :key="quiz.vueKey">
          <td>{{ quiz.id }}</td>
          <td>{{ quiz.subject }}</td>
          <td>{{ quiz.chapter }}</td>
          <td>{{ quiz.date_of_quiz }}</td>
          <td>{{ quiz.time_duration }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewQuiz(quiz)">View</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!--  MISSED QUIZZES -->
    <div class="text-center mb-2">
      <h5 class="fw-bold text-danger">Missed Quizzes</h5>
    </div>
    <table class="table table-bordered text-center shadow-sm mb-5">
      <thead class="table-danger">
        <tr><th>ID</th><th>Subject</th><th>Chapter</th><th>Date</th><th>Time</th><th>Action</th></tr>
      </thead>
      <tbody>
        <tr v-if="missedQuizzes.length === 0">
          <td colspan="6" class="text-muted">No missed quizzes</td>
        </tr>
        <tr v-for="quiz in missedQuizzes" :key="quiz.vueKey">
          <td>{{ quiz.id }}</td>
          <td>{{ quiz.subject }}</td>
          <td>{{ quiz.chapter }}</td>
          <td>{{ quiz.date_of_quiz }}</td>
          <td>{{ quiz.time_duration }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewQuiz(quiz)">View</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PAST ATTEMPTED QUIZZES -->
    <div class="text-center mb-2">
      <h5 class="fw-bold text-info">Attempted Quizzes</h5>
    </div>
    <table class="table table-bordered text-center shadow-sm">
      <thead class="table-info">
        <tr><th>ID</th><th>Subject</th><th>Chapter</th><th>Date</th><th>Time</th><th>Action</th></tr>
      </thead>
      <tbody>
        <tr v-if="pastAttemptedQuizzes.length === 0">
          <td colspan="6" class="text-muted">No past attempts</td>
        </tr>
        <tr v-for="quiz in pastAttemptedQuizzes" :key="quiz.vueKey">
          <td>{{ quiz.id }}</td>
          <td>{{ quiz.subject }}</td>
          <td>{{ quiz.chapter }}</td>
          <td>{{ quiz.date_of_quiz }}</td>
          <td>{{ quiz.time_duration }}</td>
          <td>
            <button class="btn btn-sm btn-info" @click="viewPastAttempt(quiz)">View</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- VIEW QUIZ DETAILS MODAL -->
    <div class="modal fade" id="viewQuizModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Quiz Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p><strong>Subject:</strong> {{ selectedQuiz.subject }}</p>
            <p><strong>Chapter:</strong> {{ selectedQuiz.chapter }}</p>
            <p><strong>Date:</strong> {{ selectedQuiz.date_of_quiz }}</p>
            <p><strong>Time Limit:</strong> {{ selectedQuiz.time_duration }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- PAST ATTEMPT DETAILS MODAL -->
    <div class="modal fade" id="pastAttemptDetail" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Past Attempt ({{ pastAttemptScore }}/{{ pastAttemptDetails.length }})</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
          <div 
            v-for="(q, index) in pastAttemptDetails" 
            :key="index"
            class="mb-4 border-bottom pb-3"
          >
            <p><strong>Q{{ index + 1 }}:</strong> {{ q.question_statement }}</p>
            <ul class="list-unstyled">
              <li
                v-for="(option, idx) in q.options"
                :key="idx"
                :class="[
                  'mb-1',
                  { 'fw-bold': (idx + 1) === q.user_selected },
                  { 'text-success': (idx + 1) === q.correct_option },
                  { 'text-danger': (idx + 1) === q.user_selected && (idx + 1) !== q.correct_option }
                ]"
              >
                {{ idx + 1 }}. {{ option }}
                <span v-if="(idx + 1) === q.correct_option">✔️</span>
                <span v-else-if="q.user_selected !== null && (idx + 1) === q.user_selected">❌</span>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
  `,props: ["searchQuery"],

  data() {
    return {
      userData: {},
      quizzes: [],
      userScores: [],
      selectedQuiz: {},
      pastAttemptDetails: [],
      pastAttemptScore: 0,
    };
  },

  computed: {
    todayISO() {
      return new Date().toISOString().split('T')[0];
    },
    todaysQuizzes() {
      return this.quizzes.filter(q => {
        const matchesDate = q.date_of_quiz === this.todayISO && !q.alreadyAttempted;
        const matchesSearch = q.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                              q.chapter.toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesDate && matchesSearch ;
      });
    },
    upcomingQuizzes() {
      return this.quizzes.filter(q => {
        const matchesDate = q.date_of_quiz > this.todayISO;
        const matchesSearch = q.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                              q.chapter.toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesDate && matchesSearch;
      });
    },
    missedQuizzes() {
      return this.quizzes.filter(q => {
        const matchesDate = q.date_of_quiz < this.todayISO && !q.alreadyAttempted;
        const matchesSearch = q.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                              q.chapter.toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesDate && matchesSearch;
      });
    },
    pastAttemptedQuizzes() {
      return this.quizzes.filter(q => {
        const matchesAttempted = q.alreadyAttempted;
        const matchesSearch =
          q.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          q.chapter.toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesAttempted && matchesSearch;
      });
    },
  },

  methods: {
    viewQuiz(quiz) {
      this.selectedQuiz = quiz;
      new bootstrap.Modal(document.getElementById('viewQuizModal')).show();
    },
    viewPastAttempt(quiz) {
      fetch(`/api/chapters/${quiz.chapter_id}/quizzes/${quiz.id}/attempt-details`, {
        headers: {
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
      })
        .then(res => {
          if (!res.ok) throw new Error(`❌ Server returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('✅ Fetched attempt details:', data);
          
          let attemptDetails = Array.isArray(data) ? data : data.details || [];
          
          this.pastAttemptDetails = attemptDetails;
          this.pastAttemptScore = attemptDetails.filter(q => 
            q.user_selected === q.correct_option
          ).length;
          
          const modal = new bootstrap.Modal(document.getElementById('pastAttemptDetail'));
          modal.show();
        })
        .catch(err => {
          console.error('❌ Could not load attempt details:', err);
        });
    },
    startQuiz(quiz) {
      this.$router.push({
        name: 'exam',
        params: { quizId: quiz.id, chapterId: quiz.chapter_id },
      });
    },
    fetchAllQuizzes() {
      fetch('/api/me/scores', {
        headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
      })
        .then(res => res.json())
        .then(scores => {
          this.userScores = scores.map(s => s.quiz_id);

          return fetch('/api/subjects', {
            headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
          });
        })
        .then(res => res.json())
        .then(subjects => {
          subjects.forEach(subject => {
            fetch(`/api/subjects/${subject.id}/chapters`, {
              headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
            })
              .then(res => res.json())
              .then(chapters => {
                chapters.forEach(chapter => {
                  fetch(`/api/chapters/${chapter.id}/quizzes`, {
                    headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
                  })
                    .then(res => res.json())
                    .then(quizzes => {
                      quizzes.forEach(quiz => {
                        this.quizzes.push({
                          ...quiz,
                          subject: subject.name,
                          chapter: chapter.name,
                          chapter_id: chapter.id,
                          alreadyAttempted: this.userScores.includes(quiz.id),
                          vueKey: `${subject.id}-${chapter.id}-${quiz.id}`
                        });
                      });
                    });
                });
              });
          });
        });
    },
  },

  mounted() {
    fetch('/api/home', {
      headers: { 'Authentication-Token': localStorage.getItem('auth_token') },
    })
      .then(res => res.json())
      .then(data => {
        this.userData = data;
        this.fetchAllQuizzes();
      });
  },
};
