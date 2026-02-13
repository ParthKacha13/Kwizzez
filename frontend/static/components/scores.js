export default {
  props: ['searchQuery'],
  template: `
    <div class="container mt-5">
      <h3 class="mb-4 fw-bold text-center">Quiz Attempts</h3>
      <table class="table table-bordered text-center shadow-sm">
        <thead class="table-primary">
          <tr>
            <th>Quiz ID</th>
            <th>Subject</th>
            <th>Chapter</th>
            <th>Date</th>
            <th>Score</th>
            <th>Out Of</th>
            <th>Attempted On</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredAttempts.length === 0">
            <td colspan="7" class="text-muted">No attempts found</td>
          </tr>
          <tr v-for="attempt in filteredAttempts" :key="attempt.quiz_id">
            <td>{{ attempt.quiz_id }}</td>
            <td>{{ attempt.subject }}</td>
            <td>{{ attempt.chapter }}</td>
            <td>{{ attempt.date_of_quiz }}</td>
            <td>{{ attempt.total_scored }}</td>
            <td>{{ attempt.total_questions }}</td>
            <td>{{ attempt.attempted_on }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,props: ["searchQuery"],
  data() {
    return {
      attempts: []
    };
  },
  computed: {
    filteredAttempts() {
      const q = this.searchQuery ? this.searchQuery.toLowerCase() : '';
      return this.attempts.filter(a =>
        a.subject?.toLowerCase().includes(q) ||
        a.chapter?.toLowerCase().includes(q) ||
        a.date_of_quiz?.toLowerCase().includes(q) ||
        String(a.total_scored).includes(q)
      );
    }
  },
  mounted() {
    fetch('/api/me/scores', {
      headers: {
        "Authentication-Token": localStorage.getItem("auth_token")
      }
    })
    .then(res => res.json())
    .then(data => {
      this.attempts = data;
    });
  }
};
