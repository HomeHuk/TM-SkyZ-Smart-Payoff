import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        navigate('/dashboard');
      } else {
        fetchAllData();
      }
    };
    checkAdmin();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    // ดึงข้อมูลทั้งหมดรวมถึงข้อมูลจากตาราง profiles
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*, profiles(phone_number)');
      
    if (error) {
        console.error("Error fetching data:", error);
    } else if (data) {
        setAllData(data);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🛡️ แผงควบคุมแอดมิน</h1>
        <button 
            onClick={() => { supabase.auth.signOut(); navigate('/login'); }}
            style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
            ออกจากระบบ
        </button>
      </div>
      
      {loading ? <p>กำลังโหลดข้อมูลสมาชิก...</p> : (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: '12px' }}>เบอร์โทร</th>
                <th style={{ padding: '12px' }}>ชื่อบัตร</th>
                <th style={{ padding: '12px' }}>หนี้รวม</th>
                <th style={{ padding: '12px' }}>ขั้นต่ำ</th>
                <th style={{ padding: '12px' }}>จ่ายจริง</th>
              </tr>
            </thead>
            <tbody>
              {allData.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{item.profiles?.phone_number || '-'}</td>
                  <td style={{ padding: '12px' }}>{item.card_name}</td>
                  <td style={{ padding: '12px' }}>{Number(item.total_debt).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{Number(item.minimum_payment).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{Number(item.paid_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;