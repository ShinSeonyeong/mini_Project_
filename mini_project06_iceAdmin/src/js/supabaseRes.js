export const getReservation = async (type, nm) => {
    let query = supabase
        .from("reservation")
        .select(`
            *,
            customer:res_no (
                name
            )
        `);
    if (type) {
        query = query.eq("type", type);
    }
    if (nm) {
        query = query.ilike("customer.name", "%" + nm + "%");
    }
    let res = await query;
    if (res.error) {
        notification.error({ message: "에러발생:" + res.error });
    }
    console.log(res);
    return res.data;
}; 