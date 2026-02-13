import Barchart from './Barchart.js'
import Piechart from './Piechart.js'

export default {
  name: 'Summary',
  components: {
    Barchart,
    Piechart
  },
  template: `
    <div class="container mt-5 text-center">
      <h3>Scores Summary</h3>
      <div class="text-end mb-3">
        <button class="btn btn-outline-primary" @click="downloadCSV">
          Download Report as CSV
        </button>
      </div>
      <div class="mb-4">
      <div class="row mb-4">
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="card-title text-muted">Total Quizzes Attempted</h6>
            <h4 class="card-text fw-bold">{{ totalQuizzes }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="card-title text-muted">Total Score</h6>
            <h4 class="card-text fw-bold">{{ totalScore }}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="card-title text-muted">Average Score</h6>
            <h4 class="card-text fw-bold">{{ averageScore }}</h4>
          </div>
        </div>
      </div>
    </div>
    </div>

      <table class="table table-bordered text-center">
        <thead>
          <tr>
            <th>Quiz ID</th>
            <th>Date</th>
            <th>Subject</th>
            <th>Chapter</th>
            <th>Score</th>
            <th>Out of</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredScores.length === 0">
            <td colspan="6" class="text-muted">No scores found</td>
          </tr>
          <tr v-for="s in filteredScores" :key="s.id">
            <td>{{ s.quiz_id }}</td>
            <td>{{ s.date_of_quiz }}</td>
            <td>{{ s.subject }}</td>
            <td>{{ s.chapter }}</td>
            <td>{{ s.total_scored }}</td>
            <td>{{ s.total_questions }}</td>
          </tr>
        </tbody>
      </table>

      <div class="row">
        <div class="col-md-6">
          <Barchart
            :chart-data="subjectChartData"
            :options="chartOptions"
            v-if="subjectChartData.labels.length"
          />
        </div>
        <div class="col-md-6">
          <Piechart
            :chart-data="monthChartData"
            :options="chartOptions"
            v-if="monthChartData.labels.length"
          />
        </div>
      </div>
    </div>
  `,props: ["searchQuery"],
  data() {
    return {
      scores: [],
      userData: {},
      subjectChartData: { labels: [], datasets: [] },
      monthChartData: { labels: [], datasets: [] },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      }
    };
  },
  computed: {
    filteredScores() {
      const query = this.searchQuery ? this.searchQuery.toLowerCase() : '';
      return this.scores.filter(s =>
        s.subject?.toLowerCase().includes(query) ||
        s.chapter?.toLowerCase().includes(query) ||
        s.date_of_quiz?.toLowerCase().includes(query) ||
        String(s.total_scored).includes(query) 
      );
    },
    totalQuizzes() {
      return this.filteredScores.length;
    },
    totalScore() {//implement searchQuery here too
      return this.filteredScores.reduce((sum, s) => sum + (s.total_scored || 0), 0);
    },
    averageScore() {
      return this.totalQuizzes > 0 ? (this.totalScore / this.totalQuizzes).toFixed(2) : 0;
    }
  },
  mounted() {
    let subjectList = [];

    fetch('/api/subjects', {
      headers: { "Authentication-Token": localStorage.getItem("auth_token") }
    })
      .then(res => res.json())
      .then(subjects => {
        subjectList = subjects.map(sub => sub.name);

        return fetch('/api/me/scores', {
          headers: { "Authentication-Token": localStorage.getItem("auth_token") }
        });
      })
      .then(res => res.json())
      .then(data => {
        this.scores = data;
        if (data.length > 0) {
          this.userData.username = data[0].username;
        }

        const subjectCounts = {};
        const monthCounts = {};
        
        data.forEach(s => {
          subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
          const m = s.date_of_quiz?.slice(5, 7) || '00';
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        });
        const labels= subjectList.map(item => `${item} (${subjectCounts[item] || 0})`);
        this.subjectChartData = {
          labels: labels,
          datasets: [{
            label: 'No. of Quizzes Attempted',
            data: subjectList.map(s => subjectCounts[s] || 0),
            backgroundColor: subjectList.map(() => '#7dbef1')
          }]
        };

        const validMonths = Object.entries(monthCounts).filter(([_, c]) => c > 0);

        const MONTH_COLORS = [
          '#FF6384', '#36A2EB', '#FFCE56',
          '#4BC0C0', '#9966FF', '#FF9F40',
          '#C9CBCF', '#00A878', '#E1BC29',
          '#F45B69', '#00A1E4', '#9D4EDD'
        ];

        this.monthChartData = {
          labels: validMonths.map(([m]) => `Month ${m}`),
          datasets: [{
            label: 'Attempts by Month',
            data: validMonths.map(([_, c]) => c),
            backgroundColor: validMonths.map(([m]) => MONTH_COLORS[parseInt(m) - 1] || '#cccccc')
          }]
        };
      })
      .catch(err => console.error(err));
  },
  methods: {

    downloadCSV() {
      if (!this.filteredScores.length) {
        alert("No scores to download.");
        return;
      }
  
      const headers = ["Quiz ID", "Date", "Subject", "Chapter", "Score", "Total Questions"];
      const rows = this.filteredScores.map(s =>
        [s.quiz_id, s.date_of_quiz, s.subject, s.chapter, s.total_scored, s.total_questions]
      );
  
      let csvContent = headers.join(",") + "\n" +
        rows.map(e => e.join(",")).join("\n");
  
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const username = this.userData.username || 'quiz_report';
      link.setAttribute('download', `${username}_quiz_summary_report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  }
  }