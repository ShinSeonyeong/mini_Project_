import { supabase } from "./supabase.js";
import { notification } from "antd";

export const getReservation = async (type, nm) => {
  let query = supabase.from("reservation").select(`
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

async function getReservations(page, limit = 10) {
  const page_idx = (page - 1) * limit;
  let { data, error, count } = await supabase
    .from("reservation")
    .select("res_no, date, time, state, customer:user_email(name, phone)", {
      count: "exact",
    })
    .order("res_no", { ascending: false })
    .range(page_idx, page_idx + limit - 1);

  if (error) {
    notification.error({ message: "에러발생:" + error });
  }
  console.log(data);
  return { data, count };
}

export { getReservations };
