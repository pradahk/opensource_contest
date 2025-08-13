import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import InterviewRoom from "./pages/InterviewRoom";
import FinalReport from "./pages/FinalReport";
import SelectCompany from "./pages/SelectCompany";
import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import Dashboard from "./pages/Dashboard";
import Introduction from "./pages/Introduction";
import WriteForm from "./pages/WriteForm";
import MyPage from "./pages/MyPage";
import EditDocument from "./pages/EditDocument";
import AIInterviewList from "./pages/AIInterviewList";
import AIInterviewSelect from "./pages/AIInterviewSelect";
import AIInterviewRoom from "./pages/AIInterviewRoom";
import AIInterviewFeedback from "./pages/AIInterviewFeedback";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 보호된 라우트들 */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/interview" element={
        <ProtectedRoute>
          <InterviewRoom />
        </ProtectedRoute>
      } />
      <Route path="/final-report" element={
        <ProtectedRoute>
          <FinalReport />
        </ProtectedRoute>
      } />
      <Route path="/select-company" element={
        <ProtectedRoute>
          <SelectCompany />
        </ProtectedRoute>
      } />
      <Route path="/write" element={
        <ProtectedRoute>
          <WriteForm />
        </ProtectedRoute>
      } />
      <Route path="/mypage" element={
        <ProtectedRoute>
          <MyPage />
        </ProtectedRoute>
      } />
      
      {/* AI 면접 관련 라우트들 */}
      <Route path="/ai-interview" element={
        <ProtectedRoute>
          <AIInterviewList />
        </ProtectedRoute>
      } />
      <Route path="/ai-interview/select" element={
        <ProtectedRoute>
          <AIInterviewSelect />
        </ProtectedRoute>
      } />
      <Route path="/ai-interview/room/:sessionId" element={
        <ProtectedRoute>
          <AIInterviewRoom />
        </ProtectedRoute>
      } />
      <Route path="/ai-interview/feedback/:sessionId" element={
        <ProtectedRoute>
          <AIInterviewFeedback />
        </ProtectedRoute>
      } />
      
      {/* 문서 수정 라우트들 */}
      <Route path="/edit-intro/:id" element={
        <ProtectedRoute>
          <EditDocument />
        </ProtectedRoute>
      } />
      <Route path="/edit-resume/:id" element={
        <ProtectedRoute>
          <EditDocument />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;



