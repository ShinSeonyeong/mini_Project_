import {supabase} from "./supabase.js";

async function getDashboard(year,month,start_date,key) {
    let { data, error } = await supabase.rpc('getdashboard', {
        year,
        month,
        start_date,
        key
    });
    if (error) console.error(error)
    else return {data};
}


export {
    getDashboard
}