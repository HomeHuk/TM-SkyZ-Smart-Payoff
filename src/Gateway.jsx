import { useNavigate } from 'react-router-dom';

function Gateway() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', padding: '20px', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" 
    }}>
      {/* ส่วนหัว */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', color: '#0f172a', marginBottom: '10px' }}>TM-SkyZ Financial</h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#64748b' }}>จัดการการเงินของคุณอย่างเหนือระดับ</p>
      </div>

      {/* แผงปุ่มกด */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: '1fr', gap: '16px', 
        width: '100%', maxWidth: '400px' 
      }}>
        <button onClick={() => navigate('/login?type=user')} style={buttonStyle('#ffffff', '#0f172a', '1px solid #e2e8f0')}>
          เข้าสู่ระบบสมาชิก
        </button>
        <button onClick={() => navigate('/login?type=admin')} style={buttonStyle('#0f172a', '#ffffff', 'none')}>
          สำหรับผู้ดูแลระบบ
        </button>
        
        <hr style={{ width: '100%', border: '0', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
        
        <button onClick={() => navigate('/register')} style={buttonStyle('transparent', '#4f46e5', 'none', '14px')}>
          สมัครสมาชิกใหม่
        </button>
      </div>
    </div>
  );
}

// Helper function เพื่อลดโค้ดซ้ำและจัดสไตล์ปุ่มให้ทันสมัย
const buttonStyle = (bg, color, border, fontSize = '16px') => ({
  padding: '16px', fontSize: fontSize, cursor: 'pointer', backgroundColor: bg, 
  color: color, border: border, borderRadius: '12px', fontWeight: '600',
  transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center'
});

export default Gateway;