import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqzcyvrfjbihrqhxpsly.supabase.co';
const supabaseAnonKey = 'sb_publishable_1qRJVp-7rRw_AC-eiTXKaw_2oaN0Ffz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);