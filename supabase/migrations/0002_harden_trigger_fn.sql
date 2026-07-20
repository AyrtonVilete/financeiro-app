-- fin_handle_new_user é uma função de trigger (usa NEW/TG_OP), não deveria ser
-- chamável via API pública (/rest/v1/rpc/fin_handle_new_user).
revoke execute on function public.fin_handle_new_user() from anon, authenticated;
