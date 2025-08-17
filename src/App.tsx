import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Layout from './components/ui/Layout';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/community" element={<div className="p-8 text-center">Community page coming soon!</div>} />
                  <Route path="/about" element={<div className="p-8 text-center">About page coming soon!</div>} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
