import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import HackHivePage from './pages/HackHivePage';
import CareersPage from './pages/CareersPage';
import LoginPage from './pages/LoginPage';
import PassportPage from './pages/PassportPage';
import AdminPage from './pages/AdminPage';
import EventsPage from './pages/EventsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="hackhive" element={<HackHivePage />} />
        <Route path="careers" element={<CareersPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="passport" element={<PassportPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="events" element={<EventsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
