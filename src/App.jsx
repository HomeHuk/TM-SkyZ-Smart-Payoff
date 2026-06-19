import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Gateway from './Gateway';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Gateway />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* เพิ่มส่วนนี้เพื่อกัน User พิมพ์ URL มั่วๆ */}
        <Route path="*" element={<Gateway />} />
      </Routes>
    </Router>
  );
}
export default App;