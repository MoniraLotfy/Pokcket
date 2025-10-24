
import { safeParse, getIndexKey, getCapsuleKey, escapeHtml } from './storage.js';

export function renderLibrary() {
  const list = document.querySelector('#capsuleList');
  list.innerHTML = '';

  const idx = safeParse(localStorage.getItem(getIndexKey())) || [];
  if (!idx.length) {
    document.querySelector('#emptyLibrary').classList.remove('d-none');
    return;
  }
  document.querySelector('#emptyLibrary').classList.add('d-none');

  idx.forEach(entry => {
    const c = safeParse(localStorage.getItem(getCapsuleKey(entry.id)));
    if (!c) return;

    const totalQuiz = c.quiz?.length || 0;
    const correctQuiz = parseInt(localStorage.getItem(`pc_quiz_${c.id}_score`) || '0', 10);
    const quizDone = Math.min(parseInt(localStorage.getItem(`pc_quiz_${c.id}`) || '0', 10), totalQuiz);
    const flashDone = Math.min(parseInt(localStorage.getItem(`pc_flash_${c.id}`) || '0', 10), c.flashcards?.length || 0);
    const progress = totalQuiz ? Math.round((correctQuiz / totalQuiz) * 100) : 0;

    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card p-3 h-100 shadow-sm d-flex flex-column" role="article" aria-labelledby="title-${c.id}">
        <h5 id="title-${c.id}">${escapeHtml(c.title)}</h5>
        <p class="text-muted small mb-1">
          ${escapeHtml(c.subject || "")} · <span class="badge ${escapeHtml(c.level || '')}">${escapeHtml(c.level || '')}</span>
        </p>
        <p class="small text-muted mb-2">Last updated: ${new Date(c.updatedAt).toLocaleDateString()}</p>
        <div class="progress mb-2" style="height:8px;">
          <div class="progress-bar bg-success" role="progressbar" style="width:${progress}%"></div>
        </div>
        <p class="small text-muted mb-1">Best Score Progress: ${progress}% (${correctQuiz}/${totalQuiz})
        <span class="badge bg-success mb-2 fs-12">Quiz answered: ${quizDone}/${totalQuiz}</span></p>
        <p class="small mb-2">
          Flashcards done: ${flashDone}/${c.flashcards?.length || 0} &nbsp;|&nbsp;
          <span class="text-success">✔Know: ${parseInt(localStorage.getItem(`pc_flash_${c.id}_known`) || '0', 10)}</span> |
          <span class="text-danger">❌ Unknow: ${parseInt(localStorage.getItem(`pc_flash_${c.id}_unknown`) || '0', 10)}</span>
        </p>
        <div class="mt-auto d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-primary d-flex align-items-center learnBtn" data-id="${c.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:5px;">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v19H6.5A2.5 2.5 0 0 1 4 18.5V4.5z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg> Learn
          </button>
          <button class="btn btn-sm btn-secondary d-flex align-items-center editBtn" data-id="${c.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:5px;">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg> Edit
          </button>
          <button class="btn btn-sm btn-warning d-flex align-items-center exportBtn" data-id="${c.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" fill="currentColor" viewBox="0 0 24 24" style="margin-right:5px;">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg> Export
          </button>
          <button class="btn btn-sm btn-danger d-flex align-items-center deleteBtn" data-id="${c.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 11v6M14 11v6M5 6l1-3h12l1 3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg> Delete
          </button>
        </div>
      </div>
    `;
    list.appendChild(col);
  });

  // ---------- Event Listeners ----------
  document.querySelectorAll('.learnBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      window.dispatchEvent(new CustomEvent('pc-learn', { detail: { id } }));
    });
  });

  document.querySelectorAll('.editBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      window.dispatchEvent(new CustomEvent('pc-edit', { detail: { id } }));
    });
  });

  document.querySelectorAll('.exportBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      const raw = localStorage.getItem(getCapsuleKey(id));
      if (!raw) { alert('Capsule not found.'); return; }
      const c = safeParse(raw);
      if (!c) { alert('Invalid capsule data.'); return; }
      c.schema = 'pocket-classroom/v1';
      const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${(c.title || 'capsule').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60) || 'capsule'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  });

  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm('Delete this capsule?')) return;
      window.dispatchEvent(new CustomEvent('pc-delete', { detail: { id } }));
    });
  });
}
