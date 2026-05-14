import SquadPage from '../components/SquadPage'
export default function DigitalMarketing() {
  return <SquadPage
    name="Digital Marketing"
    desc="SEO strategy, content creation, social campaigns, paid ads and growth automation."
    icon="fa-bullseye"
    squadKey="marketing"
    taskTypes={['SEO Audit','Content Strategy','Social Media Campaign','Google Ads Setup','Email Marketing','Analytics Report','Keyword Research','Competitor Analysis']}
    outputs={[
      { type:'SEO',     title:'Full SEO Audit Report',   desc:'142 issues found, prioritized action plan.', size:'PDF · 3.2MB', time:'1h ago' },
      { type:'Content', title:'Blog Content Pack',       desc:'10 SEO-optimized articles, 1200+ words each.', size:'ZIP · 840KB', time:'4h ago' },
      { type:'Report',  title:'Q1 Marketing Analytics', desc:'Traffic, conversions, ROAS breakdown.',       size:'PDF · 1.8MB', time:'2d ago' },
    ]}
  />
}
