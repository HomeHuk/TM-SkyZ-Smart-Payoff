import { useNavigate } from 'react-router-dom';

function Gateway() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h1>ยินดีต้อนรับสู่ TM-SkyZ</h1>
      <p>กรุณาเลือกช่องทางเข้าใช้งาน</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '30px' }}>
        {/* ปุ่มเดิม */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/login?type=user')}
            style={{ padding: '20px 40px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '10px' }}
          >
            สำหรับสมาชิก
          </button>
          <button 
            onClick={() => navigate('/login?type=admin')}
            style={{ padding: '20px 40px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '10px' }}
          >
            สำหรับแอดมิน
          </button>
        </div>

        {/* ปุ่มสมัครสมาชิกใหม่ที่เพิ่มเข้ามา */}
        <button 
          onClick={() => navigate('/register')} 
          style={{ 
            padding: '12px 30px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            backgroundColor: 'transparent', 
            color: '#4F46E5', 
            border: '2px solid #4F46E5', 
            borderRadius: '10px',
            marginTop: '10px'
          }}
        >
          สมัครสมาชิกใหม่
        </button>
      </div>
    </div>
  );
}

export default Gateway;