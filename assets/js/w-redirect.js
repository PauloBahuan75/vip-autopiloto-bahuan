(function () {
  const params = new URLSearchParams(window.location.search);
  const cfg = window.VIP_CONFIG || {};

  const src = params.get('src') || cfg.defaultSrc || 'site-organico';
  const tipo = params.get('tipo') || 'imóvel';
  const bairro = params.get('bairro') || 'São Paulo';
  const entrada = params.get('entrada') || 'a definir';
  const prazo = params.get('prazo') || 'a definir';

  const msg = `Olá! Vim pela Lista VIP (SRC: ${src}). Busco ${tipo} em ${bairro}, entrada ${entrada}, prazo ${prazo}.`;
  const wa = `https://wa.me/${cfg.whatsappNumber || '5511996900033'}?text=${encodeURIComponent(msg)}`;

  if (cfg.scriptWebAppUrl && cfg.scriptWebAppUrl.startsWith('http')) {
    fetch(cfg.scriptWebAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'wa_click',
        payload: {
          src,
          tipo,
          bairro,
          entrada,
          prazo,
          page: document.referrer || 'direto',
          timestamp: new Date().toISOString()
        }
      })
    }).finally(function () {
      window.location.replace(wa);
    });
  } else {
    window.location.replace(wa);
  }
})();
