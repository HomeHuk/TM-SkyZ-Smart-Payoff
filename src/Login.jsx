import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ตรวจสอบว่ามาจากหน้าไหน (user หรือ admin)
  const loginType = searchParams.get('type') || 'user';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // แปลงเบอร์โทรเป็น email จำลอง
    const email = `${phone}@tm-skyz.com`; 
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      // ล็อกอินสำเร็จ - นำทางไปหน้า Dashboard
      // ในอนาคตเราจะเช็กที่นี่ว่าคนนี้เป็น Admin หรือ User เพื่อแยกการแสดงผล
      navigate('/dashboard');
      
    } catch (err) {
      alert("เข้าสู่ระบบไม่สำเร็จ: กรุณาตรวจสอบเบอร์โทรหรือรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
      <h2 style={{ color: '#4F46E5' }}>
        {loginType === 'admin' ? 'แอดมินเข้าสู่ระบบ' : 'สมาชิกเข้าสู่ระบบ'}
      </h2>
      <form onSubmit={handleLogin}>
        <input 
          type="text" 
          placeholder="เบอร์โทรศัพท์ (10 หลัก)" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)} 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <input 
          type="password" 
          placeholder="รหัสผ่าน" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: '100%', padding: '12px', backgroundColor: loginType === 'admin' ? '#10B981' : '#4F46E5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <button 
        onClick={() => navigate('/')} 
        style={{ marginTop: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
      >
        ← ย้อนกลับไปหน้าเลือกทางเข้า
      </button>
    </div>
  );
}

export default Login;