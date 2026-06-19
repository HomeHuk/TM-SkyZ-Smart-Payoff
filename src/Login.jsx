import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const loginType = searchParams.get('type') || 'user';

    // สไตล์สำหรับ Input
    const inputStyle = {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box',
        fontSize: '16px'
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const phoneRegex = /^[0-9]{9,10}$/;
        if (!phoneRegex.test(phone)) {
            alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
            setLoading(false);
            return;
        }

        try {
            // เติมโดเมนอัตโนมัติเพื่อให้ตรงกับที่เก็บในฐานข้อมูล
            const emailToLogin = `${phone}@tm-skyz.com`;

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: emailToLogin,
                password: password,
            });

            if (authError) throw authError;

            // ... (โค้ดเช็ค profile และ navigate คงเดิม)
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (loginType === 'admin' && profile?.role !== 'admin') {
                alert("คุณไม่ใช่แอดมิน");
                await supabase.auth.signOut();
            } else if (profile?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            alert("เข้าสู่ระบบไม่สำเร็จ: เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100vh', backgroundColor: '#f8fafc', padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '350px', background: '#ffffff',
                padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
            }}>
                <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '25px' }}>
                    {loginType === 'admin' ? '🔑 แอดมิน' : '👤 สมาชิกเข้าสู่ระบบ'}
                </h2>

                <form onSubmit={handleLogin}>
                    <input placeholder="เบอร์โทรศัพท์" onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="รหัสผ่าน"
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '10px', top: '12px',
                                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                            }}
                        >
                            {showPassword ? "👁️" : "🙈"}
                        </button>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '12px', marginTop: '10px',
                        backgroundColor: loginType === 'admin' ? '#10B981' : '#4F46E5',
                        color: 'white', border: 'none', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
                    }}>
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                    {/* เพิ่มปุ่มกลับหน้าหลักตรงนี้ */}
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%', padding: '12px', marginTop: '10px',
                            backgroundColor: '#f1f5f9', // สีเทาอ่อนให้ดูต่างจากปุ่มหลัก
                            color: '#475569', border: 'none', borderRadius: '10px',
                            cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                        }}
                    >
                        กลับหน้าหลัก
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Login;