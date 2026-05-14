import SquadPage from '../components/SquadPage'
export default function DataAnalysis() {
  return <SquadPage
    name="Data Analysis"
    desc="Machine learning models, data pipelines, dashboards, predictive analytics and insights."
    icon="fa-chart-pie"
    squadKey="data"
    taskTypes={['Data Pipeline Setup','ML Model Training','Dashboard Creation','Predictive Analytics','Data Cleaning','Statistical Analysis','Report Generation','A/B Test Analysis']}
    outputs={[
      { type:'Model',  title:'Churn Prediction Model',   desc:'XGBoost model, 94.2% accuracy on test set.', size:'Pickle · 18MB', time:'45m ago' },
      { type:'Dash',   title:'Executive KPI Dashboard',  desc:'Real-time metrics, 8 visualizations.',       size:'HTML · 2.4MB', time:'3h ago' },
      { type:'Report', title:'Customer Cohort Analysis', desc:'6-month retention and LTV breakdown.',       size:'PDF · 4.1MB',  time:'1d ago' },
    ]}
  />
}
