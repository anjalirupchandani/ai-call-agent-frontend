import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import StartCall from "./pages/StartCall";
import LiveCall from "./pages/LiveCall";
import Contacts from "./pages/Contacts";
import Calls from "./pages/Calls";
import CallDetails from "./pages/CallDetails";
import Templates from "./pages/Templates";
import KnowledgeBase from "./pages/KnowledgeBase";
import Pathways from "./pages/Pathways";
import Callsceduling from "./pages/CallSceduling";
import Campaigns from "./pages/Campaigns";

import CampaignDetails from "./pages/CampaignDetails";
import Settings from "./pages/Settings";
import Help from "./pages/Help";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/calls/new"
            element={
              <ProtectedRoute>
                <StartCall />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/calls/live/:callId"
            element={
              <ProtectedRoute>
                <LiveCall />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/calls/:callId"
            element={
              <ProtectedRoute>
                <CallDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/calls"
            element={
              <ProtectedRoute>
                <Calls />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/knowledge"
            element={
              <ProtectedRoute>
                <KnowledgeBase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/pathways"
            element={
              <ProtectedRoute>
                <Pathways />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/scheduled-calls"
            element={
              <ProtectedRoute>
                <Callsceduling />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/campaigns"
            element={
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/campaigns/:campaignId"
            element={
              <ProtectedRoute>
                <CampaignDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<Settings />} />

          <Route
            path="/dashboard/help"
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
