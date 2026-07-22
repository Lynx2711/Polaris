import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Contact } from './Contact';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default App;
