const params = new URLSearchParams(location.search);
const isSpeaker = params.get('mode') === 'speaker';
const deckUrl = new URL('./deck.json', location.href);
const query = (selector) => document.querySelector(selector);
let deck, slideStyles, currentIndex = 0, startedAt = null, elapsedBeforePause = 0, audienceWindow;
const session = params.get('session') || 'default';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(`slides:${location.pathname}:${session}`) : null;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); }
function fitSlide() {
  const workspace = query('.workspace');
  const horizontal = workspace.clientWidth - (innerWidth <= 900 ? 24 : 48);
  const reserved = isSpeaker && innerWidth > 900 ? Math.min(500, Math.max(320, horizontal * .34)) + 24 : 0;
  const ratio = Math.min((horizontal - reserved) / 1600, (workspace.clientHeight - 48) / 900);
  const scale = isSpeaker && innerWidth <= 900 ? horizontal / 1600 : ratio;
  const shell = query('.slide-shell');
  shell.style.width = `${1600 * scale}px`; shell.style.height = `${900 * scale}px`;
  query('.slide-frame').style.transform = `scale(${scale})`;
}
function closeVideo() {
  const overlay = query('.video-overlay');
  if (!overlay) return;
  overlay.replaceChildren();
  overlay.hidden = true;
}
function playVideo() {
  const video = deck.slides[currentIndex].video;
  if (!video) return;
  const overlay = query('.video-overlay');
  const frame = document.createElement('iframe');
  frame.title = video.title;
  frame.src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  const close = document.createElement('button');
  close.textContent = 'Back to discussion';
  close.onclick = () => { closeVideo(); query('#play-video').focus(); };
  const fallback = document.createElement('a');
  fallback.href = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  fallback.target = '_blank';
  fallback.rel = 'noopener';
  fallback.textContent = 'Open on YouTube ↗';
  const controls = document.createElement('div');
  controls.append(close, fallback);
  overlay.replaceChildren(controls, frame);
  overlay.hidden = false;
  close.focus();
}
function showSlide(index, broadcast = true) {
  closeVideo();
  currentIndex = clamp(Number.isFinite(index) ? index : 0, 0, deck.slides.length - 1);
  const slide = deck.slides[currentIndex];
  const videoControls = query('.video-controls');
  videoControls.hidden = !slide.video;
  if (slide.video) query('#video-link').href = `https://www.youtube.com/watch?v=${slide.video.youtubeId}`;
  const frame = query('.slide-frame');
  frame.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><base href="${new URL('.', deckUrl)}"><style>${slideStyles}</style></head><body>${slide.html}</body></html>`;
  query('.counter').textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${deck.slides.length}`;
  query('.jump').value = currentIndex;
  query('#previous').disabled = currentIndex === 0;
  query('#next').disabled = currentIndex === deck.slides.length - 1;
  query('.progress').style.width = `${(currentIndex + 1) / deck.slides.length * 100}%`;
  query('#announcement').textContent = `Slide ${currentIndex + 1}: ${slide.title}`;
  history.replaceState(null, '', `${location.pathname}${location.search}#${currentIndex + 1}`);
  if (isSpeaker) {
    const panel = query('.speaker-panel');
    panel.innerHTML = `<div class="speaker-label">${escapeHtml(slide.presenter)}</div><h1>${escapeHtml(slide.title)}</h1>${slide.notes.map(note => `<h2>${escapeHtml(note.label)}</h2>${note.html || `<p>${escapeHtml(note.text)}</p>`}`).join('')}<h2>A seguir</h2><p class="next-title">${escapeHtml(deck.slides[currentIndex + 1]?.title || 'Fim da apresentação')}</p>`;
    panel.scrollTop = 0;
  }
  fitSlide();
  if (broadcast) channel?.postMessage({type:'slide', index:currentIndex});
}
function handleKey(event) {
  if (event.key === 'Escape' && !query('.video-overlay')?.hidden) { closeVideo(); return; }
  if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY'].includes(event.target.tagName)) return;
  if (query('dialog').open) return;
  if (['ArrowRight','ArrowDown','PageDown',' '].includes(event.key)) { event.preventDefault(); showSlide(currentIndex + 1); }
  if (['ArrowLeft','ArrowUp','PageUp'].includes(event.key)) { event.preventDefault(); showSlide(currentIndex - 1); }
  if (event.key === 'Home') showSlide(0);
  if (event.key === 'End') showSlide(deck.slides.length - 1);
  if (event.key.toLowerCase() === 'f') toggleFullscreen();
  if (event.key.toLowerCase() === 'b') document.body.classList.toggle('blackout');
  if (event.key === 'Escape') document.body.classList.remove('blackout');
  if (event.key.toLowerCase() === 's') query('#mode').click();
}
function toggleFullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); }
function updateTimer() {
  const seconds = Math.floor((elapsedBeforePause + (startedAt ? Date.now() - startedAt : 0)) / 1000);
  query('.timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
async function initialize() {
  try {
    const responses = await Promise.all([fetch(deckUrl, {cache:'no-cache'}), fetch(new URL('./theme.css', deckUrl), {cache:'no-cache'})]);
    if (responses.some(response => !response.ok)) throw new Error('Presentation files could not be loaded.');
    [deck, slideStyles] = await Promise.all([responses[0].json(), responses[1].text()]);
    const videoControls = document.createElement('div');
    videoControls.className = 'video-controls';
    videoControls.hidden = true;
    videoControls.innerHTML = '<button class="primary" id="play-video">Play video</button><a id="video-link" target="_blank" rel="noopener">Open on YouTube ↗</a>';
    const videoOverlay = document.createElement('div');
    videoOverlay.className = 'video-overlay';
    videoOverlay.hidden = true;
    query('.slide-shell').append(videoControls, videoOverlay);
    query('#play-video').onclick = playVideo;
    document.title = `${deck.title} · ${isSpeaker ? 'Speaker' : 'Audience'}`;
    query('.deck-title').textContent = deck.title;
    query('.speaker-panel').hidden = !isSpeaker;
    query('.workspace').classList.toggle('speaker', isSpeaker);
    query('#mode').textContent = isSpeaker ? 'Audience view' : 'Speaker view';
    query('#open-audience').hidden = !isSpeaker;
    query('.jump').innerHTML = deck.slides.map((slide, index) => `<option value="${index}">${String(index + 1).padStart(2,'0')} · ${escapeHtml(slide.title)}</option>`).join('');
    query('.jump').onchange = event => showSlide(+event.target.value);
    query('#previous').onclick = () => showSlide(currentIndex - 1);
    query('#next').onclick = () => showSlide(currentIndex + 1);
    query('#fullscreen').onclick = toggleFullscreen;
    query('#mode').onclick = () => { const url = new URL(location.href); if (isSpeaker) url.searchParams.delete('mode'); else url.searchParams.set('mode','speaker'); location.assign(url); };
    query('#open-audience').onclick = () => { const url = new URL(location.href); url.searchParams.delete('mode'); audienceWindow = window.open(url, `audience-${deck.id}`); if (!audienceWindow) query('.connection').textContent = 'Allow pop-ups to open audience view'; };
    query('#timer-toggle').onclick = () => { if (startedAt) { elapsedBeforePause += Date.now() - startedAt; startedAt = null; } else startedAt = Date.now(); query('#timer-toggle').textContent = startedAt ? 'Pause' : 'Start'; updateTimer(); };
    query('#timer-reset').onclick = () => { elapsedBeforePause = 0; if (startedAt) startedAt = Date.now(); updateTimer(); };
    query('#help').onclick = () => query('dialog').showModal();
    query('#close-help').onclick = () => query('dialog').close();
    query('#copy-link').onclick = async () => { try { const url = new URL(location.href); url.searchParams.delete('mode'); url.searchParams.delete('session'); await navigator.clipboard.writeText(url.href); query('#copy-link').textContent = 'Copied'; } catch { query('#copy-link').textContent = 'Copy browser URL'; } };
    query('.slide-frame').onload = () => { const document = query('.slide-frame').contentDocument; document.addEventListener('keydown', handleKey); document.addEventListener('click', event => { if (!event.target.closest('a,button,input,select,textarea,summary')) { event.clientX > 800 ? showSlide(currentIndex + 1) : showSlide(currentIndex - 1); } }); };
    document.addEventListener('keydown', handleKey);
    document.body.addEventListener('click', () => document.body.classList.remove('blackout'));
    addEventListener('resize', fitSlide);
    addEventListener('hashchange', () => showSlide(parseInt(location.hash.slice(1), 10) - 1));
    if (channel) channel.onmessage = event => { if (event.data.type === 'slide') { showSlide(Number(event.data.index), false); query('.connection').textContent = 'Views synchronized'; } if (event.data.type === 'request' && isSpeaker) channel.postMessage({type:'slide',index:currentIndex}); };
    showSlide(parseInt(location.hash.slice(1), 10) - 1, false);
    channel?.postMessage({type:'request'});
    setInterval(updateTimer, 1000);
  } catch (error) { query('.workspace').innerHTML = `<div class="error"><h1>Could not open this presentation</h1><p>${escapeHtml(error.message)}</p><p>Try reloading the page or return to the library.</p></div>`; }
}
initialize();
