import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChartBarIcon, CodeBracketIcon, AcademicCapIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import Dashboard from './components/Dashboard';
import PRDetailPage from './components/PRDetailPage';
import CommonLearningTab from './components/CommonLearningTab';
import PullRequestsTab from './components/PullRequestsTab';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Navigation component with active state handling
const NavigationHeader: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getLinkClasses = (path: string) => {
    const baseClasses = "nav-link flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium tracking-wide";
    if (isActive(path)) {
      return `${baseClasses} bg-primary-100 text-primary-700 border border-primary-200 shadow-sm`;
    }
    return `${baseClasses} text-gray-600 hover:text-primary-600 hover:bg-primary-50 hover:shadow-sm`;
  };

  return (
    <header className="dashboard-header sticky top-0 z-40 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 lg:py-3">
          {/* Compact Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
              <CodeBracketIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <Link 
                to="/" 
                className="text-lg lg:text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors navbar-text"
              >
                Connector PR Dashboard
              </Link>
              <p className="text-xs text-gray-500 hidden lg:block font-medium">
                Integration Management System
              </p>
            </div>
          </div>

          {/* Compact Navigation */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links - Always Visible */}
            <nav className="flex items-center space-x-1">
              <Link to="/" className={getLinkClasses('/')}>
                <ChartBarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/pull-requests" className={getLinkClasses('/pull-requests')}>
                <FolderOpenIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Pull Requests</span>
              </Link>
              <Link to="/common-learning" className={getLinkClasses('/common-learning')}>
                <AcademicCapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Common Learning</span>
              </Link>
            </nav>

            {/* Compact Status Indicator */}
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-success-50 rounded-md border border-success-200">
              <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-success-700 hidden md:block">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-dashboard">
          {/* Navigation Header */}
          <NavigationHeader />

          {/* Main Content */}
          <main className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-success-50/20 pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pull-requests" element={<PullRequestsTab />} />
                <Route path="/common-learning" element={<CommonLearningTab />} />
                <Route path="/pr/:prNumber" element={<PRDetailPage />} />
              </Routes>
            </div>
          </main>

          {/* Professional Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <CodeBracketIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      HyperSwitch Connector Dashboard
                    </p>
                    <p className="text-xs text-gray-500">
                      Professional PR Management System
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-xs text-gray-500">
                  <span>Real-time Updates</span>
                  <span>•</span>
                  <span>AI-Powered Analytics</span>
                  <span>•</span>
                  <span>Enterprise Ready</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
