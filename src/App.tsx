import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/navigation/Sidebar";
import { ReportCanvas } from "./components/layouts/ReportCanvas";
import { ExecutiveOverviewPage } from "./pages/ExecutiveOverviewPage";
import { GeographicAnalysisPage } from "./pages/GeographicAnalysisPage";
import { AwardsPage } from "./pages/AwardsPage";
import { PipelinePage } from "./pages/PipelinePage";
import { AssigneesPage } from "./pages/AssigneesPage";
import { AgreementsPage } from "./pages/AgreementsPage";
import { AboutPage } from "./pages/AboutPage";

function App() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="flex-1 min-h-0">
        <ReportCanvas>
          <Sidebar />
          <div className="flex-1 min-w-0 h-full flex flex-col">
            <Routes>
              <Route path="/" element={<Navigate to="/executive-overview" replace />} />
              <Route path="/executive-overview" element={<ExecutiveOverviewPage />} />
              <Route path="/geographic-analysis" element={<GeographicAnalysisPage />} />
              <Route path="/award-analysis" element={<AwardsPage />} />
              <Route path="/pipeline-analysis" element={<PipelinePage />} />
              <Route path="/assignee-performance" element={<AssigneesPage />} />
              <Route path="/agreements-analysis" element={<AgreementsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </ReportCanvas>
      </div>
    </div>
  );
}

export default App;
