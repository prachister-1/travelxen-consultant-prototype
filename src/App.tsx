import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DemoProvider } from './consultant/store'
import { ConsultantShell } from './consultant/Shell'
import { IntakeQueue } from './consultant/IntakeQueue'
import { ConsultantWorkspace } from './consultant/Workspace'
import { QualityLearning } from './consultant/Learning'
import { AgentOrchestration } from './consultant/Orchestration'

export default function App() {
  return (
    <DemoProvider>
      <HashRouter>
        <Routes>
          <Route element={<ConsultantShell />}>
            <Route path="/" element={<IntakeQueue />} />
            <Route path="/workspace" element={<ConsultantWorkspace />} />
            <Route path="/orchestration" element={<AgentOrchestration />} />
            <Route path="/learning" element={<QualityLearning />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DemoProvider>
  )
}
