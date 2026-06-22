const fetchAllMonthsReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // ดึงข้อมูลทั้งหมดของ user คนนี้โดยไม่จำกัดเดือน
    const { data, error } = await supabase
        .from('credit_cards')
        .select('month, total_debt, principal_paid, interest_paid')
        .eq('user_id', user.id);

    if (data) {
        // จัดกลุ่มข้อมูลตามเดือน
        const report = data.reduce((acc, curr) => {
            if (!acc[curr.month]) {
                acc[curr.month] = { totalDebt: 0, totalPaid: 0, totalInterest: 0 };
            }
            acc[curr.month].totalDebt += Number(curr.total_debt);
            acc[curr.month].totalPaid += Number(curr.principal_paid);
            acc[curr.month].totalInterest += Number(curr.interest_paid);
            return acc;
        }, {});
        
        console.log("สรุปรายงานรายเดือน:", report);
        // นำค่า report ไปแสดงผลในตารางหรือกราฟต่อไปได้ครับ
    }
};