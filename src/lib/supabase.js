// Supabase client. Personal-use app, anon-key only. RLS allows anon
// insert/select on every soccer_* table (spec §12).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Database calls will fail. See .env.example.'
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Edge function endpoints. v9 uses the `claude-proxy` function for AI calls
// (spec §13) and `push-biometrics` for the iOS Shortcuts pipeline.
export const CLAUDE_PROXY_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/claude-proxy`
  : null;
