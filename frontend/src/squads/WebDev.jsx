import SquadPage from '../components/SquadPage'
export default function WebDev() {
  return <SquadPage
    name="Web Development"
    desc="React frontends, Next.js apps, responsive websites, PWAs and performance optimization."
    icon="fa-globe"
    squadKey="web"
    taskTypes={['React Component Library','Next.js Application','Landing Page','E-Commerce Frontend','Dashboard UI','PWA Development','Performance Optimization','Accessibility Audit']}
    outputs={[
      { type:'React', title:'Dashboard Component Suite', desc:'12 reusable components with Storybook docs.', size:'86KB · JSX+CSS', time:'1h ago' },
      { type:'Next',  title:'Landing Page Application',  desc:'Fully responsive Next.js 14 app with SSR.',   size:'2.1MB · Bundle', time:'5h ago' },
      { type:'CSS',   title:'Design Token System',       desc:'CSS variables, dark/light modes, typography.', size:'14KB · CSS',    time:'1d ago' },
    ]}
  />
}
