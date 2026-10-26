(() => {
  const input = document.querySelector('#password'), toggle = document.querySelector('#visibility');
  const name = document.querySelector('#strength-name'), meter = document.querySelector('#strength-meter');
  const criteria = document.querySelector('#criteria'), button = document.querySelector('#check-button');
  const card = document.querySelector('#breach-card'), icon = document.querySelector('#breach-icon');
  const title = document.querySelector('#breach-title'), body = document.querySelector('#breach-body');
  const tips = document.querySelector('#tips'), list = document.querySelector('#tip-list');
  const reset = document.querySelector('#reset-button'), placeholder = document.querySelector('#tips-placeholder');
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  let requestNumber = 0;
  function analyze(value) {
    const checks = [
      { label: 'At least 12 characters', ok: value.length >= 12 },
      { label: 'Uppercase and lowercase letters', ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
      { label: 'At least one number', ok: /[0-9]/.test(value) },
      { label: 'A special character', ok: /[^A-Za-z0-9]/.test(value) },
    ];
    const common = /password|qwerty|letmein|welcome|admin|1234|abcd/i.test(value);
    const sequential = /0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef/i.test(value);
    const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
    const score = value.length ? Math.max(0, Math.min(4, Math.floor(value.length / 5) + (variety >= 3 ? 1 : variety >= 2 ? 0 : -1) - (common ? 2 : 0) - (sequential ? 1 : 0))) : 0;
    const suggestions = [];
    if (value.length < 12) suggestions.push('Make it at least 12 characters long.');
    if (variety < 3) suggestions.push('Mix uppercase, lowercase, numbers, and symbols.');
    if (common) suggestions.push('Avoid common words and predictable passwords.');
    if (sequential) suggestions.push('Skip sequences like “1234” or “abcd”.');
    if (!suggestions.length && value) suggestions.push('Great mix. Use a unique password for every account.');
    return { checks, score, suggestions };
  }
  function render() {
    const value = input.value, result = analyze(value), hasValue = value.length > 0;
    name.textContent = hasValue ? labels[result.score] : 'WAITING FOR INPUT';
    name.className = hasValue ? 'strength-name strength-' + result.score : 'strength-empty';
    meter.className = 'strength-meter' + (hasValue ? ' score-' + result.score : '');
    meter.dataset.label = hasValue ? ['WEAK', 'WEAK', 'MEDIUM', 'STRONG', 'STRONG'][result.score] : '';
    meter.setAttribute('aria-label', hasValue ? 'Password strength: ' + labels[result.score] : 'No password entered');
    meter.querySelectorAll('span').forEach((bar, i) => { bar.className = i < result.score ? 'meter-' + result.score : ''; });
    criteria.replaceChildren(...result.checks.map((item) => {
      const row = document.createElement('div'); row.className = 'criterion' + (item.ok && hasValue ? ' passed' : '');
      row.innerHTML = item.ok && hasValue ? '<span class="criterion-icon">✓</span>' : '<span class="criterion-circle"></span>';
      const label = document.createElement('span'); label.textContent = item.label; row.append(label); return row;
    }));
    button.disabled = !hasValue; tips.hidden = !hasValue; placeholder.hidden = hasValue; reset.hidden = !hasValue;
    list.replaceChildren(...result.suggestions.map((tip, i) => {
      const row = document.createElement('p'), mark = document.createElement('span');
      mark.className = 'tip-icon' + (result.score >= 3 && i === 0 ? ' tip-ok' : '');
      mark.textContent = result.score >= 3 && i === 0 ? '✓' : '•'; row.append(mark, document.createTextNode(tip)); return row;
    }));
  }
  function setBreach(state, heading, message, mark) {
    card.className = 'breach-card breach-' + state; title.textContent = heading; body.textContent = message; icon.textContent = mark;
    button.hidden = ['checking', 'clear', 'found'].includes(state); button.disabled = !input.value || state === 'checking';
    button.innerHTML = state === 'error' ? 'Try again <span>↗</span>' : 'Check now <span>↗</span>';
  }
  async function checkBreaches() {
    const password = input.value; if (!password || button.disabled) return;
    const current = ++requestNumber; setBreach('checking', 'Checking securely…', 'Comparing a partial hash with the breach database.', '◌');
    try {
      const hashBytes = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
      const hash = Array.from(new Uint8Array(hashBytes), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      const response = await fetch('/api/pwned', { method: 'POST', headers: { Accept: 'text/plain', 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: hash.slice(0, 5) }) });
      if (!response.ok) throw new Error('Breach lookup unavailable');
      const match = (await response.text()).split(String.fromCharCode(10)).find((line) => line.split(':')[0].toUpperCase() === hash.slice(5));
      if (current !== requestNumber || password !== input.value) return;
      const count = match ? Number(match.split(':')[1]) || 1 : 0;
      if (count) setBreach('found', 'Found in a data breach', 'This password appeared ' + count.toLocaleString() + ' time' + (count === 1 ? '' : 's') + '. Change it anywhere you use it.', '!');
      else setBreach('clear', 'No breaches found', 'This password was not found in the breach data we checked.', '✓');
    } catch { if (current === requestNumber) setBreach('error', 'Couldn’t complete the check', 'The breach service could not be reached. Please try again.', '!'); }
  }
  input.addEventListener('input', () => { requestNumber++; render(); setBreach('idle', 'Not checked yet', 'Check if this password appears in known data breaches.', '◇'); });
  toggle.addEventListener('click', () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); toggle.textContent = show ? '◎' : '◉'; });
  button.addEventListener('click', checkBreaches);
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') checkBreaches(); });
  reset.addEventListener('click', () => { requestNumber++; input.value = ''; render(); setBreach('idle', 'Not checked yet', 'Check if this password appears in known data breaches.', '◇'); input.focus(); });
  render();
})();
