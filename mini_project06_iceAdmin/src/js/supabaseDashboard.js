import {supabase} from "./supabase.js";


export const getStatesByPeriod = async(year,month,start_date,key)=>{
    let res = await supabase.rpc("getdashboard",{year,month,start_date,key});
    return res;
}