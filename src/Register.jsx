import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function Register() {
    // เปลี่ยนชื่อ state เพื่อให้สื่อความหมาย
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        const phoneRegex = /^[0-9]{9,10}$/;
        if (!phoneRegex.test(phone)) {
            alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ไม่ต้องใส่ขีดหรือเว้นวรรค)");
            setLoading(false);
            return;
        }

        // เติมโดเมนอัตโนมัติ เพื่อให้ Supabase ยอมรับรูปแบบอีเมล
        const emailToRegister = `${phone}@tm-skyz.com`;

        const { error } = await supabase.auth.signUp({
            email: emailToRegister,
            password: password
        });

        if (error) {
            alert(error.message);
        } else {
            alert('สมัครสมาชิกสำเร็จ!');
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
            <form onSubmit={handleRegister} style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '300px' }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#1e293b' }}>สมัครสมาชิกใหม่</h2>

                {/* เปลี่ยน placeholder และ type เป็น tel */}
                <input
                    type="tel"
                    placeholder="เบอร์โทรศัพท์"
                    required
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <input type={showPassword ? "text" : "password"} placeholder="รหัสผ่าน" required onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>
                        {showPassword ? 'ซ่อน' : 'แสดง'}
                    </button>
                </div>

                <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? 'กำลังดำเนินการ...' : 'ลงทะเบียน'}
                </button>

                <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                    มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </p>
            </form>
        </div>
    );
}

export default Register;