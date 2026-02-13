import Barchart from './Barchart.js'
import Piechart from './Piechart.js'

export default {
  name: 'AdminSummary',
  components: { Barchart, Piechart },
  template: `
    <div class="container mt-5">
      <div class="text-center mb-4">
        <h3> Summary Charts</h3>
      </div>

      <div class="row">
        <div class="col-md-6 mb-4">
          <h5 class="mb-3 text-center">Subject wise Top Scores</h5>
          <Barchart
            :chart-data="topScoresChartData"
            :options="chartOptions"
            v-if="topScoresChartData.labels.length"
          />
        </div>

        <div class="col-md-6 mb-4">
          <h5 class="mb-3 text-center">Subject wise User Attempts</h5>
          <Piechart
            :chart-data="attemptsChartData"
            :options="chartOptions"
            v-if="attemptsChartData.labels.length"
          />
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      topScoresChartData: { labels: [], datasets: [] },
      attemptsChartData: { labels: [], datasets: [] },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      }
    };
  },
  mounted() {
    fetch('/api/admin/subject-top-scores', {
        headers: { "Authentication-Token": localStorage.getItem("auth_token") }
      })
      .then(res => res.json())
      .then(data => {
        const labels = data.map(item => `${item.subject} (${item.top_score || 0})`);
        const scores = data.map(item => item.top_score || 0);
    
        this.topScoresChartData = {
          labels: labels,
          datasets: [{
            label: 'Top Score',
            data: scores,
            backgroundColor: labels.map(() => '#7fc8f8'),
          }]
        };
      })

    fetch('/api/admin/subject-user-attempts', {
      headers: { "Authentication-Token": localStorage.getItem("auth_token") }
    })
    .then(res => res.json())
    .then(data => {
      const labels = data.map(item => item.subject);
      const attempts = data.map(item => item.attempt_count);
      this.attemptsChartData = {
        labels: labels,
        datasets: [{
          label: 'Attempts',
          data: attempts,
          backgroundColor: labels.map(() => '#' + Math.floor(Math.random()*16777215).toString(16))
        }]
      };
    });
  }
}