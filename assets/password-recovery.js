(() => {
  const client = window.REINO_SUPABASE;
  const dialog = document.getElementById('password-recovery-dialog');
  const requestForm = document.getElementById('password-request-form');
  const updateForm = document.getElementById('password-update-form');
  const status = document.getElementById('password-recovery-status');
  let recoverySession = false;
  let busy = false;
  function mode(update) {
    requestForm.hidden = update;
    updateForm.hidden = !update;
    document.getElementById('password-recovery-title').textContent = update ? 'Defina sua nova senha' : 'Recuperar acesso';
    status.textContent = '';
    if (!dialog.open) dialog.showModal();
  }
  document.getElementById('forgot-password').addEventListener('click', () => {
    recoverySession = false;
    document.getElementById('recovery-email').value = document.getElementById('login-email').value.trim();
    mode(false);
  });
  document.getElementById('close-password-recovery').addEventListener('click', () => {
    if (!busy) dialog.close();
  });
  requestForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!client) { status.textContent = 'Serviço indisponível. Atualize a página.'; return; }
    const email = document.getElementById('recovery-email').value.trim();
    const button = document.getElementById('send-password-link');
    busy = true; button.disabled = true; status.textContent = 'Enviando link…';
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: new URL('index.html', location.href).href
      });
      if (error) throw error;
      status.textContent = 'Se houver uma conta com esse e-mail, você receberá um link. Confira também o spam.';
    } catch (error) {
      status.textContent = error.status === 429
        ? 'Muitas solicitações. Aguarde alguns minutos e tente novamente.'
        : 'Não foi possível enviar o link. Tente novamente em alguns minutos.';
    } finally { busy = false; button.disabled = false; }
  });
  client?.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) {
      recoverySession = true;
      // Do not call another Auth method inside the Auth event callback.
      setTimeout(() => {
        mode(true);
        history.replaceState(null, '', location.pathname + '#inicio');
      }, 0);
    }
  });
  updateForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!recoverySession) { status.textContent = 'Abra o link de recuperação recebido no seu e-mail.'; return; }
    const password = document.getElementById('recovery-new-password').value;
    const confirmation = document.getElementById('recovery-confirm-password').value;
    if (password.length < 8) { status.textContent = 'Use uma senha com pelo menos 8 caracteres.'; return; }
    if (password !== confirmation) { status.textContent = 'As senhas não são iguais.'; return; }
    const button = document.getElementById('save-new-password');
    busy = true; button.disabled = true; status.textContent = 'Salvando nova senha…';
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      recoverySession = false;
      updateForm.reset();
      await client.auth.signOut();
      status.textContent = 'Senha atualizada. Volte ao login e entre com sua nova senha.';
      updateForm.hidden = true;
      document.getElementById('return-password-login').hidden = false;
    } catch {
      status.textContent = 'Não foi possível atualizar. Solicite um novo link e tente novamente.';
    } finally { busy = false; button.disabled = false; }
  });
  document.getElementById('return-password-login').addEventListener('click', () => location.assign(new URL('index.html', location.href).href));
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.has('error_description')) {
    mode(false);
    status.textContent = 'Link inválido ou expirado. Solicite um novo link de recuperação.';
    history.replaceState(null, '', location.pathname + '#inicio');
  }
})();