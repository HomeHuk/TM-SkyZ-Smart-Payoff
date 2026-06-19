import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Gateway from './Gateway';
import AdminDashboard from './AdminDashboard';
import Register from './Register'; // 1. เพิ่มการ import หน้า Register

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Gateway />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* 2. เพิ่ม Route ของสมัครสมาชิก */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Gateway />} />
      </Routes>
    </Router>
  );
}

export default App;