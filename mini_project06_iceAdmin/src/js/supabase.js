import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wqetnltlnsvjidubewia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NzI5NDksImV4cCI6MjA1ODM0ODk0OX0.-Jw0jqyq93rA7t194Kq4_umPoTci8Eqx9j-oCwoZc6k';

// 싱글톤 패턴으로 Supabase 클라이언트 생성
let supabaseInstance = null;

export const supabase = (() => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
})();
