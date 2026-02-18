(function () {
  const form = document.getElementById('vipForm');
  if (!form) return;

  const status = document.getElementById('status');

  function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function getQuerySrc() {
    const params = new URLSearchParams(window.location.search);
    return params.get('src') || window.VIP_CONFIG.defaultSrc;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.whatsapp = normalizePhone(data.whatsapp);
    data.src = getQuerySrc();
    data.timestamp = new Date().toISOString();

    if (window.VIP_CONFIG.scriptWebAppUrl && window.VIP_CONFIG.scriptWebAppUrl.startsWith('http')) {
      try {
        await fetch(window.VIP_CONFIG.scriptWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'lead', payload: data })
        });
      } catch (error) {
        console.warn('Falha ao enviar lead para Apps Script', error);
      }
    }

    const redirect = new URL('/w/', window.location.origin);
    Object.entries(data).forEach(([key, value]) => redirect.searchParams.set(key, value));

    status.textContent = 'Quase lá! Redirecionando para o WhatsApp...';
    window.location.href = redirect.toString();
  });
})();
