(() => {
  const audio = document.getElementById('reino-radio-audio');
  if (!audio) return;
  const play = document.getElementById('reino-radio-play');
  const pause = document.getElementById('reino-radio-pause');
  const range = document.getElementById('reino-radio-volume');
  const output = document.getElementById('reino-radio-level');
  const status = document.getElementById('reino-radio-status');
  let userPaused = false;
  let pending = false;
  const controls = () => {
    play.disabled = !audio.paused;
    pause.disabled = audio.paused && !pending;
    play.setAttribute('aria-pressed', String(!audio.paused));
    pause.setAttribute('aria-pressed', String(userPaused));
  };
  const volume = value => {
    const percent = Math.min(100, Math.max(0, Number(value)));
    if (!Number.isFinite(percent)) return;
    audio.volume = percent / 100;
    audio.muted = false;
    range.value = String(percent);
    output.textContent = percent + '%';
    range.setAttribute('aria-valuetext', percent + '%');
  };
  async function start() {
    if (userPaused || pending || !audio.paused) return;
    pending = true;
    status.textContent = 'Conectando…';
    controls();
    try {
      await audio.play();
    } catch (error) {
      if (!userPaused) status.textContent = error.name === 'NotAllowedError'
        ? 'Clique em Play para ouvir'
        : 'Transmissão indisponível. Tente Play.';
    } finally {
      pending = false;
      controls();
    }
  }
  play.addEventListener('click', () => {
    userPaused = false;
    if (audio.error) audio.load();
    start();
  });
  pause.addEventListener('click', () => {
    userPaused = true;
    audio.pause();
    status.textContent = 'Rádio pausada';
    controls();
  });
  range.addEventListener('input', () => volume(range.value));
  document.getElementById('reino-radio-minus').addEventListener('click', () => volume(Math.round(audio.volume * 100) - 5));
  document.getElementById('reino-radio-plus').addEventListener('click', () => volume(Math.round(audio.volume * 100) + 5));
  audio.addEventListener('playing', () => {
    if (userPaused) { audio.pause(); return; }
    status.textContent = 'Ao vivo';
    controls();
  });
  audio.addEventListener('pause', controls);
  audio.addEventListener('waiting', () => { if (!userPaused) status.textContent = 'Carregando transmissão…'; });
  audio.addEventListener('error', () => { status.textContent = 'Transmissão indisponível. Tente Play.'; controls(); });
  // First interaction allows playback when the browser blocks sound on entry.
  const unlock = () => { if (!userPaused) start(); };
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);
  volume(49);
  controls();
  start();
})();