(async function protectReinoPage(){
  try {
    const client = window.REINO_SUPABASE;
    if (!client) throw new Error('Supabase não carregado');
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      const page = location.pathname.split('/').pop() || 'index.html';
      const back = encodeURIComponent(page + location.search + location.hash);
      location.replace('index.html?return=' + back);
      return;
    }
    document.documentElement.classList.add('supabase-authenticated');
  } catch (error) {
    console.error('Falha ao validar sessão:', error);
    location.replace('index.html');
  }
})();
