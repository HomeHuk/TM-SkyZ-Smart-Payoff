import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  // ฟังก์ชันดึงข้อมูลจาก Supabase
  const fetchCreditCards = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('due_date', { ascending: true }) // เรียงตามวันครบกำหนดชำระ

      if (error) throw error
      if (data) setCards(data)
    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCreditCards()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#4F46E5', textAlign: 'center' }}>💳 TM-SkyZ Smart Payoff</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>ระบบบริหารจัดการและวางแผนแก้ไขปัญหาหนี้บัตรเครดิต</p>

      {loading ? (
        <p style={{ textAlign: 'center' }}>กำลังโหลดข้อมูลจากหลังบ้าน...</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#4F46E5', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>ชื่อบัญชี / บัตร</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>ยอดหนี้คงเหลือ (บาท)</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>ยอดชำระขั้นต่ำ (บาท)</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>วันครบกำหนดชำระ</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{card.card_name}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', color: '#DC2626' }}>
                    {Number(card.total_debt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', color: '#D97706' }}>
                    {Number(card.minimum_payment).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                    วันที่ {card.due_date} ของเดือน
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App