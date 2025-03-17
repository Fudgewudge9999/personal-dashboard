import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RedirectToLogin } from "./components/auth/RedirectToLogin";
import { TimerInitializer } from "./components/common/TimerInitializer";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import Resources from "./pages/Resources";
import Analytics from "./pages/Analytics";
import Focus from "./pages/Focus";
import Goals from "./pages/Goals";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/Login";
import SignUpPage from "./pages/auth/SignUp";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import UpdatePasswordPage from "./pages/auth/UpdatePassword";
import ProfilePage from "./pages/auth/Profile";
import VerifyEmailPage from "./pages/auth/VerifyEmail";
import EventDetails from "./pages/EventDetails";
import EditEvent from "./pages/EditEvent";
import NewNote from "./pages/NewNote";
import NoteDetail from "./pages/NoteDetail";
import Tutoring from "./pages/Tutoring";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TimerInitializer />
        <BrowserRouter>
          <Routes>
            {/* Initial redirect to login if not authenticated */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            
            {/* Public routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
            <Route path="/auth/verify" element={<VerifyEmailPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar/event/:id" 
              element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar/event/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditEvent />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/goals" 
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resources" 
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notes" 
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notes/:id" 
              element={
                <ProtectedRoute>
                  <NoteDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/new-note" 
              element={
                <ProtectedRoute>
                  <NewNote />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/focus" 
              element={
                <ProtectedRoute>
                  <Focus />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={<ProfilePage />} 
            />
            <Route 
              path="/tutoring" 
              element={
                <ProtectedRoute>
                  <Tutoring />
                </ProtectedRoute>
              } 
            />
            
            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
