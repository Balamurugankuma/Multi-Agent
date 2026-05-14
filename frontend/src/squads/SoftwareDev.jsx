import SquadPage from '../components/SquadPage'
export default function SoftwareDev() {
  return <SquadPage
    name="Software Development"
    desc="Backend systems, APIs, microservices, database architecture and cloud infrastructure."
    icon="fa-cubes"
    squadKey="software"
    taskTypes={['REST API Development','Microservices Architecture','Database Design','Cloud Infrastructure','Authentication System','Performance Optimization','Security Audit','CI/CD Pipeline']}
    outputs={[
      { type:'API',  title:'Auth Service REST API',     desc:'JWT-based authentication with refresh tokens.', size:'24KB · Node.js', time:'2h ago' },
      { type:'Docs', title:'API Documentation',         desc:'Swagger/OpenAPI 3.0 specification.',            size:'18KB · YAML',    time:'3h ago' },
      { type:'Code', title:'Database Schema Migration', desc:'PostgreSQL migration scripts with rollback.',   size:'8KB · SQL',      time:'1d ago' },
    ]}
  />
}
