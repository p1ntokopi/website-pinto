-- 0016_dining_session_rpc.sql
-- Anonymous customers must be able to start a dining session without INSERT
-- privileges on dining_sessions (RLS only allows admin/staff).
-- Security definer function validates the table and returns the session token.

create or replace function public.start_or_resume_dining_session(
  p_table_slug text
) returns jsonb as $$
declare
  v_table_id uuid;
  v_session_id uuid;
  v_session_token text;
  v_new_token text;
begin
  select id into v_table_id from public.tables
  where slug = p_table_slug and is_active = true;

  if v_table_id is null then
    return jsonb_build_object('success', false, 'error', 'Meja tidak ditemukan');
  end if;

  select id, session_token into v_session_id, v_session_token
  from public.dining_sessions
  where table_id = v_table_id and status = 'open'
  order by started_at desc
  limit 1;

  if v_session_id is null then
    v_new_token := md5(random()::text || clock_timestamp()::text || p_table_slug);

    insert into public.dining_sessions (table_id, session_token, status)
    values (v_table_id, v_new_token, 'open')
    returning id, session_token into v_session_id, v_session_token;

    if v_session_token is null then
      return jsonb_build_object('success', false, 'error', 'Tidak dapat memulai sesi makan. Silakan coba lagi.');
    end if;
  end if;

  return jsonb_build_object('success', true, 'session_token', v_session_token);
end;
$$ language plpgsql security definer set search_path = public;