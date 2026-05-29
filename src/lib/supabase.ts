import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mkzuoqhddbhygvoblmdq.supabase.co';

const supabaseKey = 'sb_publishable_OYtLCzocgmNAS2bm7HNfFw_SBpualJl';

export const supabase = createClient(supabaseUrl, supabaseKey);