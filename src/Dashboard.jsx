import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';


function Dashboard() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newCard, setNewCard] = useState({ card_name: '', total_debt: 0, minimum_payment: 0, due_date: '', type: 'Credit Card' });
    // 1. เพิ่ม State สำหรับจัดการเดือนและ UserID
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // ปี-เดือน
    const [userPhone, setUserPhone] = useState('');


    const navigate = useNavigate();


    const handleAddCard = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('credit_cards')
            .insert([{ ...newCard, user_id: user.id, month: selectedMonth }]);


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


    // ฟังก์ชันนี้เรียกใช้เมื่อ selectedMonth เปลี่ยน หรือตอนโหลดหน้าครั้งแรก
    const fetchData = async (targetMonth) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. ดึงข้อมูลของเดือนที่เลือก
        let { data, error } = await supabase
            .from('credit_cards')
            .select('*') // ดึงทุกข้อมูล
            .eq('user_id', user.id)
            .eq('month', targetMonth)
            .order('due_date', { ascending: true });

        // 2. ถ้าเดือนที่เลือกว่างเปล่า ให้ Copy จาก 2026-06
        if (data && data.length === 0 && targetMonth !== '2026-06') {
            const { data: masterData } = await supabase
                .from('credit_cards')
                .select('*') // ดึงข้อมูล Master มาทั้งหมด
                .eq('user_id', user.id)
                .eq('month', '2026-06');

            if (masterData && masterData.length > 0) {
                // สร้างข้อมูลชุดใหม่จากรายการ Master
                const newData = masterData.map(c => ({
                    card_name: c.card_name,
                    total_debt: c.total_debt,
                    minimum_payment: c.minimum_payment,
                    due_date: c.due_date,
                    interest_rate: c.interest_rate,
                    user_id: user.id,
                    month: targetMonth, // เปลี่ยนเป็นเดือนใหม่
                    paid_amount: 0,
                    interest_paid: 0,
                    principal_paid: 0,
                    cash_back: 0,
                    cashback_used: 0
                }));

                // บันทึกรายการใหม่ทั้งหมดลง DB
                await supabase.from('credit_cards').insert(newData);

                // ดึงข้อมูลอีกครั้งเพื่อให้แสดงผลครบ
                const { data: finalData } = await supabase
                    .from('credit_cards')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('month', targetMonth)
                    .order('id', { ascending: true });
                data = finalData;
            }
        }

        setCards(data || []);
        setLoading(false);
    };


    // ใช้ useEffect นี้เพียงชุดเดียวเพื่อกระตุ้นการดึงข้อมูล
    useEffect(() => {
        fetchData(selectedMonth);
    }, [selectedMonth, navigate]);


    const updateCardData = async (id, field, value) => {
        const numValue = value === '' ? 0 : Number(value);


        // 1. อัปเดตในฐานข้อมูลก่อน
        await supabase.from('credit_cards').update({ [field]: numValue }).eq('id', id);


        // 2. อัปเดตเฉพาะ State ในเครื่อง (ไม่ต้องเรียก fetchData() ใหม่ทั้งชุด)
        setCards(prevCards => prevCards.map(card =>
            card.id === id ? { ...card, [field]: numValue } : card
        ));
    };

    const changeMonth = (offset) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        // สร้าง Date object โดยใช้ปีและเดือน (เดือนใน JS เริ่มที่ 0)
        const newDate = new Date(year, month - 1 + offset);
        setSelectedMonth(newDate.toISOString().slice(0, 7));
    };


    const handleUpdateCard = async (id, field, value) => {
        // 1. อัปเดตที่ฐานข้อมูล Supabase
        const { error } = await supabase
            .from('credit_cards')
            .update({ [field]: value })
            .eq('id', id);


        if (error) {
            console.error("Error updating:", error);
        } else {
            // 2. อัปเดตใน UI (State) ให้เป็นค่าปัจจุบัน
            setCards(prev => prev.map(card =>
                card.id === id ? { ...card, [field]: value } : card
            ));
        }
    };
    
    // 1. ใช้ useMemo เพื่อป้องกันการคำนวณซ้ำซ้อนและเพิ่มความเสถียร
const totals = useMemo(() => {
    return cards.reduce((acc, c) => {
        acc.limit += Number(c.total_debt || 0);
        acc.minPay += Number(c.minimum_payment || 0);
        acc.paidReal += Number(c.paid_amount || 0);
        acc.principalPaid += Number(c.principal_paid || 0);
        acc.interestPaid += Number(c.interest_paid || 0);
        acc.cashbackTotal += Number(c.cash_back || 0);
        acc.cashbackUsedTotal += Number(c.cashback_used || 0);
        return acc;
    }, { limit: 0, minPay: 0, paidReal: 0, principalPaid: 0, interestPaid: 0, cashbackTotal: 0, cashbackUsedTotal: 0 });
}, [cards]);

// 2. คำนวณยอดรวมหนี้ทั้งสิ้น (Credit Card + Loan)
const totalAllDebt = useMemo(() => 
    cards
        .filter(item => item.type === 'Credit Card' || item.type === 'Loan')
        .reduce((sum, item) => sum + (Number(item.total_debt) || 0), 0)
, [cards]);

// 3. ยอดสินเชื่อคงเหลือปัจจุบัน
const totalLoanBalance = useMemo(() => 
    cards
        .filter(item => item.type === 'Loan')
        .reduce((sum, item) => {
            const balance = Number(item.total_debt || 0) - Number(item.principal_paid || 0);
            return sum + (balance > 0 ? balance : 0);
        }, 0)
, [cards]);

// 4. ยอดคงเหลือบัตรเครดิตปัจจุบัน
const totalCreditCardBalance = useMemo(() => 
    cards
        .filter(item => item.type === 'Credit Card')
        .reduce((sum, item) => {
            const balance = Number(item.total_debt || 0) - Number(item.principal_paid || 0);
            return sum + (balance > 0 ? balance : 0);
        }, 0)
, [cards]);

// 5. หนี้คงเหลือสุทธิ
const netDebt = (totalAllDebt - totals.principalPaid) + totals.cashbackUsedTotal;


    const SummaryCard = ({ title, value, color }) => (
        <div style={{ padding: '15px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderTop: `4px solid ${color}` }}>
            <h3 style={{ color: '#64748b', fontSize: '0.75rem', margin: '0' }}>{title}</h3>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', margin: '8px 0' }}>฿{value.toLocaleString()}</p>
        </div>
    );

    const copyPreviousMonthData = async () => {
        // 1. หาเดือนก่อนหน้า (เช่น 2026-07 -> 2026-06)
        const [year, month] = selectedMonth.split('-').map(Number);
        const prevMonthDate = new Date(year, month - 2); // -2 เพราะ month เริ่มที่ 0
        const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

        // 2. ดึงข้อมูลจากเดือนก่อนหน้า
        const { data: { user } } = await supabase.auth.getUser();
        const { data: prevData } = await supabase
            .from('credit_cards')
            .select('card_name, total_debt, minimum_payment, due_date')
            .eq('user_id', user.id)
            .eq('month', prevMonthStr);

        if (prevData && prevData.length > 0) {
            // 3. เตรียมข้อมูลใหม่สำหรับเดือนปัจจุบัน
            const newData = prevData.map(c => ({
                ...c,
                user_id: user.id,
                month: selectedMonth,
                paid_amount: 0,
                interest_paid: 0,
                principal_paid: 0,
                cash_back: 0,
                cashback_used: 0
            }));

            // 4. บันทึกลงฐานข้อมูล
            await supabase.from('credit_cards').insert(newData);
            fetchData(selectedMonth); // ดึงข้อมูลใหม่มาโชว์
        } else {
            alert("ไม่พบข้อมูลจากเดือนก่อนหน้า");
        }
    };


    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <header style={{
                marginBottom: '20px',
                backgroundColor: '#ffffff', // ใส่พื้นหลังสีขาว
                padding: '15px 20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: '5px solid #0f172a' // เพิ่มแถบสีเน้นทางด้านซ้าย
            }}>
                {/* ส่วนรหัสสมาชิก: ชิดซ้ายชัดเจน */}
                <div style={{
                    fontSize: '0.85rem',
                    color: '#475569',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>👤 รหัสสมาชิก:</span>
                    <strong style={{ color: '#0f172a', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        {userPhone}
                    </strong>
                </div>


                {/* ส่วนชื่อหัวข้อและปุ่มควบคุม */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1e293b' }}>
                        📊 รายการหนี้สินและการจ่าย ({selectedMonth})
                    </h1>


                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <button onClick={() => window.print()} style={actionButtonStyle('#64748b')}>🖨️ ปริ้นท์</button>
                        <button onClick={() => setShowForm(true)} style={actionButtonStyle('#0f172a')}>+ เพิ่มสินเชื่อ</button>
                        <button onClick={handleLogout} style={actionButtonStyle('#ef4444')}>ออก</button>
                    </div>
                </div>
            </header>


            {loading ? <p>กำลังโหลดข้อมูล...</p> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                        {/* สองอันนี้คืออันใหม่ที่คุณต้องการ */}
                        <SummaryCard title="ยอดรวมหนี้ทั้งสิ้น" value={totalAllDebt.toLocaleString()} color="#7c3aed" />
                        <SummaryCard title="ยอดรวมสินเชื่อ" value={totalLoanDebt.toLocaleString()} color="#be185d" />
                        <SummaryCard title="วงเงินรวม" value={totals.limit} color="#3b82f6" />
                        <SummaryCard title="ขั้นต่ำต้องจ่าย" value={totals.minPay} color="#f59e0b" />
                        <SummaryCard title="จ่ายจริงรวม" value={totals.paidReal} color="#059669" />
                        <SummaryCard title="เงินต้นที่จ่าย" value={totals.principalPaid} color="#10b981" />
                        <SummaryCard title="ดอกเบี้ยที่จ่าย" value={totals.interestPaid} color="#f97316" />
                        <SummaryCard title="เงินคืนรวม" value={totals.cashbackTotal} color="#8b5cf6" />
                        <SummaryCard title="เงินคืนที่ใช้" value={totals.cashbackUsedTotal} color="#6366f1" />
                        <SummaryCard title="ยอดสินเชื่อคงเหลือ" value={totalLoanBalance.toLocaleString()} color="#db2777" />
                        <SummaryCard title="ยอดบัตรเครดิตคงเหลือ" value={totalCreditCardBalance.toLocaleString()} color="#3b82f6" />
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
                                            {(Number(c.total_debt || 0) - Number(c.principal_paid || 0) + Number(c.cashback_used || 0)).toLocaleString()}
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
                                    { placeholder: 'ประเภท', key: 'type', type: 'select' }, // <--- เพิ่มบรรทัดนี้
                                    { placeholder: 'ชื่อบัตร / สินเชื่อ', key: 'card_name', type: 'text' },
                                    { placeholder: 'ยอดหนี้รวม', key: 'total_debt', type: 'number' },
                                    { placeholder: 'ยอดขั้นต่ำ', key: 'minimum_payment', type: 'number' },
                                    { placeholder: 'วันที่ครบกำหนด (เช่น 1)', key: 'due_date', type: 'text' }
                                ].map((field) => (
                                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column' }}>
                                        {field.type === 'select' ? (
                                            // กรณีที่เป็น Dropdown (Select)
                                            <select
                                                onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                            >
                                                <option value="Credit Card">บัตรเครดิต</option>
                                                <option value="Loan">สินเชื่อนอกระบบ</option>
                                            </select>
                                        ) : (
                                            // กรณีที่เป็น Input ปกติ
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
                                        )}
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
// เพิ่ม helper function นี้ไว้ท้ายไฟล์เพื่อความสะอาดของโค้ดครับ
const actionButtonStyle = (bgColor) => ({
    padding: '8px 16px', backgroundColor: bgColor, color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
});

