export default {
    extends: VueChartJs.Pie,
    props: {
      chartData: {
        type: Object,
        required: true
      },
      options: {
        type: Object,
        default: () => ({})
      }
    },
    mounted() {
      if (this.chartData) {
        this.renderChart(this.chartData, this.options)
      }
    },
    watch: {
      chartData: {
        deep: true,
        handler() {
          if (this.chartData) {
            this.renderChart(this.chartData, this.options)
          }
        }
      }
    }
  }
  