import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newCard, setNewCard] = useState({ card_name: '', total_debt: 0, minimum_payment: 0, due_date: '' });
    const navigate = useNavigate();

    const handleAddCard = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('credit_cards')
            .insert([{ ...newCard, user_id: user.id }]);

        if (error) {
            console.error("Error adding card:", error);
        } else {
            setShowForm(false);
            setNewCard({ card_name: '', total_debt: 0, minimum_payment: 0, due_date: '' });
            fetchData(); // ดึงข้อมูลใหม่มาแสดง
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true });

        if (error) console.error("Error fetching data:", error);
        if (data) setCards(data);
        setLoading(false);
    };

    const updateCardData = async (id, field, value) => {
        const numValue = value === '' ? 0 : Number(value);
        await supabase.from('credit_cards').update({ [field]: numValue }).eq('id', id);
        fetchData(); // อัปเดตข้อมูล UI ให้เป็นปัจจุบันเสมอ
    };

    const totals = cards.reduce((acc, c) => {
        acc.limit += Number(c.total_debt || 0);
        acc.minPay += Number(c.minimum_payment || 0);
        acc.paidReal += Number(c.paid_amount || 0);
        acc.principalPaid += Number(c.principal_paid || 0);
        acc.interestPaid += Number(c.interest_paid || 0);
        acc.cashbackTotal += Number(c.cash_back || 0); // รวมเงินคืนรายบัตร
        acc.cashbackUsedTotal += Number(c.cashback_used || 0);
        return acc;
    }, { limit: 0, minPay: 0, paidReal: 0, principalPaid: 0, interestPaid: 0, cashbackTotal: 0, cashbackUsedTotal: 0 });

    // ปรับสูตรหนี้คงเหลือสุทธิ: ใช้ยอดหนี้ลบด้วย เงินต้นที่จ่ายไป และ เงินคืนที่ใช้ไปจริง
    const netDebt = totals.limit - (totals.principalPaid + totals.cashbackUsedTotal);

    const SummaryCard = ({ title, value, color }) => (
        <div style={{ padding: '15px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderTop: `4px solid ${color}` }}>
            <h3 style={{ color: '#64748b', fontSize: '0.75rem', margin: '0' }}>{title}</h3>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', margin: '8px 0' }}>฿{value.toLocaleString()}</p>
        </div>
    );

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e2e8f0' // เพิ่มเส้นคั่นให้ดูมีมิติ
}}>
    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>📊 รายการหนี้สินและการจ่าย</h1>
    
    {/* สร้าง div หุ้มปุ่มเพื่อให้อยู่รวมกลุ่มกันทางขวา */}
    <div style={{ display: 'flex', gap: '10px' }}>
        <button 
            onClick={() => setShowForm(true)} 
            style={{ 
                padding: '8px 16px', 
                backgroundColor: '#0f172a', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '500'
            }}
        >
            + เพิ่มสินเชื่อใหม่
        </button>
        <button 
            onClick={handleLogout} 
            style={{ 
                padding: '8px 16px', 
                backgroundColor: '#ef4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '500'
            }}
        >
            ออกจากระบบ
        </button>
    </div>
</header>

            {loading ? <p>กำลังโหลดข้อมูล...</p> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                        <SummaryCard title="วงเงินรวม" value={totals.limit} color="#3b82f6" />
                        <SummaryCard title="ขั้นต่ำต้องจ่าย" value={totals.minPay} color="#f59e0b" />
                        <SummaryCard title="จ่ายจริงรวม" value={totals.paidReal} color="#059669" />
                        <SummaryCard title="เงินต้นที่จ่าย" value={totals.principalPaid} color="#10b981" />
                        <SummaryCard title="ดอกเบี้ยที่จ่าย" value={totals.interestPaid} color="#f97316" />
                        <SummaryCard title="เงินคืนรวม" value={totals.cashbackTotal} color="#8b5cf6" />
                        <SummaryCard title="เงินคืนที่ใช้" value={totals.cashbackUsedTotal} color="#6366f1" />
                        <SummaryCard title="หนี้คงเหลือ" value={netDebt} color="#ef4444" />
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                                    <th style={{ padding: '12px' }}>วันที่</th>
                                    <th style={{ padding: '12px' }}>บัตร / สินเชื่อ</th>
                                    <th style={{ padding: '12px' }}>ขั้นต่ำ</th>
                                    <th style={{ padding: '12px' }}>จ่ายจริง</th>
                                    <th style={{ padding: '12px' }}>ดอกเบี้ย</th>
                                    <th style={{ padding: '12px' }}>ตัดต้น</th>
                                    <th style={{ padding: '12px' }}>เงินคืน</th>
                                    <th style={{ padding: '12px' }}>เงินคืนที่ใช้</th>
                                    <th style={{ padding: '12px' }}>หนี้คงเหลือ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cards.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px' }}>{c.due_date || '-'}</td>
                                        <td style={{ padding: '12px' }}>{c.card_name}</td>
                                        <td style={{ padding: '12px' }}>{Number(c.minimum_payment || 0).toLocaleString()}</td>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" defaultValue={c.paid_amount || ''} onBlur={(e) => updateCardData(c.id, 'paid_amount', e.target.value)} style={{ width: '70px' }} />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" defaultValue={c.interest_paid || ''} onBlur={(e) => updateCardData(c.id, 'interest_paid', e.target.value)} style={{ width: '70px' }} />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" defaultValue={c.principal_paid || ''} onBlur={(e) => updateCardData(c.id, 'principal_paid', e.target.value)} style={{ width: '70px' }} />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" defaultValue={c.cash_back || ''} onBlur={(e) => updateCardData(c.id, 'cash_back', e.target.value)} style={{ width: '70px' }} />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input
                                                type="number"
                                                defaultValue={c.cashback_used || ''}
                                                onBlur={(e) => updateCardData(c.id, 'cashback_used', e.target.value)}
                                                style={{ width: '70px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#e11d48' }}>
                                            {(Number(c.total_debt || 0) - (Number(c.principal_paid || 0) + Number(c.cash_back || 0))).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {showForm && (
                        <div style={{
                            background: '#ffffff',
                            padding: '24px',
                            borderRadius: '16px',
                            marginTop: '20px',
                            marginBottom: '20px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#1e293b' }}>เพิ่มสินเชื่อใหม่</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                {[
                                    { placeholder: 'ชื่อบัตร / สินเชื่อ', key: 'card_name', type: 'text' },
                                    { placeholder: 'ยอดหนี้รวม', key: 'total_debt', type: 'number' },
                                    { placeholder: 'ยอดขั้นต่ำ', key: 'minimum_payment', type: 'number' },
                                    { placeholder: 'วันที่ครบกำหนด (เช่น 1)', key: 'due_date', type: 'text' }
                                ].map((field) => (
                                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            onChange={(e) => setNewCard({ ...newCard, [field.key]: e.target.value })}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.95rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                    ยกเลิก
                                </button>
                                <button onClick={handleAddCard} style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                    บันทึกรายการ
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
export default Dashboard;