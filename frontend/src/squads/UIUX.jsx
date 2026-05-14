import SquadPage from '../components/SquadPage'
export default function UIUX() {
  return <SquadPage
    name="UI/UX Design"
    desc="Wireframes, prototypes, design systems, user research and brand identity creation."
    icon="fa-paint-brush"
    squadKey="uiux"
    taskTypes={['Wireframe Design','Prototype Creation','Design System','User Flow Mapping','Brand Identity','Icon Design','Accessibility Review','Usability Testing Plan']}
    outputs={[
      { type:'Figma',  title:'Product Wireframes v2',  desc:'48 screens, mobile & desktop variants.',      size:'Figma Link', time:'30m ago' },
      { type:'Design', title:'Brand Identity Package', desc:'Logo, colors, typography, usage guidelines.', size:'ZIP · 24MB', time:'6h ago' },
      { type:'Proto',  title:'Interactive Prototype',  desc:'Clickable prototype for user testing.',       size:'Figma Link', time:'2d ago' },
    ]}
  />
}
