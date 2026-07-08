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
import { PortfolioOverviewPage } from "./pages/postAward/PortfolioOverviewPage";
import { ClaimsVoPage } from "./pages/postAward/ClaimsVoPage";
import { InvoicingCashflowPage } from "./pages/postAward/InvoicingCashflowPage";
import { CloseoutPage } from "./pages/postAward/CloseoutPage";
import { SubcontractorManagementPage } from "./pages/postAward/SubcontractorManagementPage";
import { SpecialAgreementsPage } from "./pages/postAward/SpecialAgreementsPage";
import { CorrespondenceRegisterPage } from "./pages/postAward/CorrespondenceRegisterPage";
import { PostAwardAboutPage } from "./pages/postAward/PostAwardAboutPage";

function App() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="flex-1 min-h-0">
        <ReportCanvas>
          <Sidebar />
          <div className="flex-1 min-w-0 h-full flex flex-col">
            <Routes>
              <Route path="/" element={<Navigate to="/executive-overview" replace />} />
              {/* Pre-Award tab */}
              <Route path="/executive-overview" element={<ExecutiveOverviewPage />} />
              <Route path="/geographic-analysis" element={<GeographicAnalysisPage />} />
              <Route path="/award-analysis" element={<AwardsPage />} />
              <Route path="/pipeline-analysis" element={<PipelinePage />} />
              <Route path="/assignee-performance" element={<AssigneesPage />} />
              <Route path="/agreements-analysis" element={<AgreementsPage />} />
              <Route path="/about" element={<AboutPage />} />

              {/* Post-Award tab — independent upload/data, own route tree */}
              <Route path="/post-award" element={<Navigate to="/post-award/overview" replace />} />
              <Route path="/post-award/overview" element={<PortfolioOverviewPage />} />
              <Route path="/post-award/claims-vo" element={<ClaimsVoPage />} />
              <Route path="/post-award/invoicing" element={<InvoicingCashflowPage />} />
              <Route path="/post-award/closeout" element={<CloseoutPage />} />
              <Route path="/post-award/subcontractors" element={<SubcontractorManagementPage />} />
              <Route path="/post-award/agreements" element={<SpecialAgreementsPage />} />
              <Route path="/post-award/correspondence" element={<CorrespondenceRegisterPage />} />
              <Route path="/post-award/about" element={<PostAwardAboutPage />} />
            </Routes>
          </div>
        </ReportCanvas>
      </div>
    </div>
  );
}

export default App;
