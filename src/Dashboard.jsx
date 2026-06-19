import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // เริ่มต้นเป็น null เพื่อรอเช็ก
  const [newPhone, setNewPhone] = useState('');
  const [newPass, setNewPass] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }
    
    // ดึง Role จากฐานข้อมูลให้แม่นยำ
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const role = profile?.role || 'user';
    setUserRole(role);

    // ดึงข้อมูลหนี้ตามสิทธิ์
    let query = supabase.from('credit_cards').select('*').order('due_date', { ascending: true });
    if (role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    if (data) setCards(data);
    setLoading(false);
  };

  const updateCardData = async (id, field, value) => {
    const { error } = await supabase.from('credit_cards').update({ [field]: value }).eq('id', id);
    if (error) alert("บันทึกข้อมูลไม่สำเร็จ: " + error.message);
    else fetchData();
  };

  const handleAddUser = async () => {
    if (!newPhone || !newPass) { alert("กรุณากรอกข้อมูลให้ครบ"); return; }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${newPhone}@tm-skyz.com`,
      password: newPass,
    });
    if (authError) { alert(authError.message); return; }
    await supabase.from('profiles').insert([{ id: authData.user.id, phone_number: newPhone, role: 'user' }]);
    alert('เพิ่มสมาชิกสำเร็จ!');
    setNewPhone(''); setNewPass('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => { fetchData() }, []);

  // คำนวณยอดรวม
  const totalDebt = cards.reduce((sum, card) => sum + Number(card.total_debt || 0), 0);
  const totalMinimum = cards.reduce((sum, card) => sum + Number(card.minimum_payment || 0), 0);
  const totalPaid = cards.reduce((sum, card) => sum + Number(card.paid_amount || 0), 0);
  const totalCashback = cards.reduce((sum, card) => sum + Number(card.cash_back || 0), 0);

  if (userRole === null) return <p>กำลังตรวจสอบสิทธิ์...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{userRole === 'admin' ? '🛡️ แผงควบคุมแอดมิน' : '💳 ข้อมูลหนี้ของฉัน'}</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>ออกจากระบบ</button>
      </div>

      {/* คำแนะนำสำหรับ User */}
      {userRole !== 'admin' && (
        <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '8px', marginBottom: '15px', color: '#1E40AF' }}>
          💡 <b>คำแนะนำ:</b> คุณสามารถพิมพ์แก้ไขช่อง "จ่ายจริง" และ "คืนจากบัตร" ได้เลย ระบบจะบันทึกให้อัตโนมัติครับ
        </div>
      )}

      {/* ส่วนสรุปยอดรวม */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {[{l: 'หนี้รวมทั้งหมด', v: totalDebt, c: '#EEF2FF'}, {l: 'ยอดขั้นต่ำที่ต้องจ่าย', v: totalMinimum, c: '#FFF7ED'}, {l: 'จ่ายจริงรวม', v: totalPaid, c: '#ECFDF5'}, {l: 'ยอดคืนจากบัตร', v: totalCashback, c: '#FDF2F8'}].map((item, i) => (
          <div key={i} style={{ padding: '15px', background: item.c, borderRadius: '8px', border: '1px solid #ddd' }}>
            <small>{item.l}</small>
            <h2 style={{ margin: '5px 0 0' }}>{item.v.toLocaleString()}</h2>
          </div>
        ))}
      </div>

      {userRole === 'admin' && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
          <h3>เพิ่มสมาชิกใหม่</h3>
          <input placeholder="เบอร์โทร" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ padding: '8px', marginRight: '10px' }} />
          <input placeholder="รหัสผ่าน" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={{ padding: '8px', marginRight: '10px' }} />
          <button onClick={handleAddUser} style={{ padding: '8px 16px', backgroundColor: '#10B981', color: 'white', border: 'none', cursor: 'pointer' }}>เพิ่มสมาชิก</button>
        </div>
      )}

      {loading ? <p>กำลังโหลดข้อมูล...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#4F46E5', color: 'white' }}>
              <th style={{ padding: '10px' }}>ชื่อบัตร</th>
              <th style={{ padding: '10px' }}>หนี้คงเหลือ</th>
              <th style={{ padding: '10px' }}>ขั้นต่ำ</th>
              <th style={{ padding: '10px' }}>จ่ายจริง</th>
              <th style={{ padding: '10px' }}>คืนจากบัตร</th>
              <th style={{ padding: '10px' }}>กำหนดวันจ่าย</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{card.card_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{Number(card.total_debt).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{Number(card.minimum_payment).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" defaultValue={card.paid_amount} onBlur={(e) => updateCardData(card.id, 'paid_amount', e.target.value)} style={{ width: '80px', padding: '4px' }} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" defaultValue={card.cash_back} onBlur={(e) => updateCardData(card.id, 'cash_back', e.target.value)} style={{ width: '80px', padding: '4px' }} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{card.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;