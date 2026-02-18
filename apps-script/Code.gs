const TZ = 'America/Sao_Paulo';
const SHEET_LEADS = 'Leads';
const SHEET_WA = 'WA_Clicks';
const SHEET_CONFIG = 'Config';

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets_(ss);

  let data = {};
  try {
    data = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON inválido' });
  }

  if (data.type === 'lead') {
    const lead = data.payload || {};
    const score = scoreLead_(lead);
    const status = classify_(score);
    ss.getSheetByName(SHEET_LEADS).appendRow([
      new Date(),
      lead.nome || '',
      lead.whatsapp || '',
      lead.bairro || '',
      lead.tipo || '',
      lead.entrada || '',
      lead.prazo || '',
      lead.src || '',
      score,
      status
    ]);
    return json_({ ok: true, score, status });
  }

  if (data.type === 'wa_click') {
    const click = data.payload || {};
    ss.getSheetByName(SHEET_WA).appendRow([
      new Date(),
      click.src || '',
      click.tipo || '',
      click.bairro || '',
      click.entrada || '',
      click.prazo || '',
      click.page || ''
    ]);
    return json_({ ok: true });
  }

  return json_({ ok: false, error: 'type inválido' });
}

function scoreLead_(lead) {
  let score = 10;

  const prazoScore = {
    'imediato': 35,
    'até 3 meses': 30,
    'até 6 meses': 25,
    'até 12 meses': 15,
    'acima de 12 meses': 5
  };
  score += prazoScore[(lead.prazo || '').toLowerCase()] || 0;

  const entrada = (lead.entrada || '').toLowerCase();
  if (entrada.includes('acima de r$ 400')) score += 30;
  else if (entrada.includes('200 mil a r$ 400')) score += 24;
  else if (entrada.includes('100 mil a r$ 200')) score += 16;
  else if (entrada.includes('até r$ 100')) score += 8;

  const tipo = (lead.tipo || '').toLowerCase();
  if (tipo.includes('pronto')) score += 20;
  else if (tipo.includes('obra')) score += 14;
  else if (tipo.includes('lançamento')) score += 10;

  const bairro = (lead.bairro || '').toLowerCase();
  if (['morumbi', 'santo amaro', 'butantã', 'vila sônia', 'vila andrade'].some(b => bairro.includes(b))) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

function classify_(score) {
  if (score >= 75) return 'QUENTE';
  if (score >= 45) return 'MORNO';
  return 'FRIO';
}

function setupSheets_(ss) {
  const leads = getOrCreateSheet_(ss, SHEET_LEADS, ['Timestamp', 'Nome', 'WhatsApp', 'Bairro', 'Tipo', 'Entrada', 'Prazo', 'SRC', 'Score', 'Status']);
  const wa = getOrCreateSheet_(ss, SHEET_WA, ['Timestamp', 'SRC', 'Tipo', 'Bairro', 'Entrada', 'Prazo', 'Página']);
  const cfg = getOrCreateSheet_(ss, SHEET_CONFIG, ['Chave', 'Valor']);

  if (cfg.getLastRow() === 1) {
    cfg.appendRow(['EMAIL_RELATORIO', Session.getActiveUser().getEmail() || 'seu-email@dominio.com']);
  }

  leads.getRange('A1:J1').setFontWeight('bold');
  wa.getRange('A1:G1').setFontWeight('bold');
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function sendDailyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets_(ss);
  const leads = ss.getSheetByName(SHEET_LEADS).getDataRange().getValues();
  const clicks = ss.getSheetByName(SHEET_WA).getDataRange().getValues();

  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const leadRows = leads.slice(1).filter(r => Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd') === today);
  const clickRows = clicks.slice(1).filter(r => Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd') === today);

  const byStatus = countBy_(leadRows, 9);
  const byBairro = countBy_(leadRows, 3);
  const byTipo = countBy_(leadRows, 4);
  const bySrc = countBy_(clickRows, 1);

  const body = [
    `Relatório diário - ${today}`,
    '',
    'Cliques WA por origem:',
    formatMap_(bySrc),
    '',
    'Leads por status:',
    formatMap_(byStatus),
    '',
    'Top bairros:',
    formatMap_(topN_(byBairro, 5)),
    '',
    'Top tipos:',
    formatMap_(topN_(byTipo, 5))
  ].join('\n');

  MailApp.sendEmail(getReportEmail_(ss), `VIP Autopiloto - Relatório diário ${today}`, body);
}

function sendFinal14DaysReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets_(ss);
  const leads = ss.getSheetByName(SHEET_LEADS).getDataRange().getValues().slice(1);
  const clicks = ss.getSheetByName(SHEET_WA).getDataRange().getValues().slice(1);

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const leadRows = leads.filter(r => new Date(r[0]) >= since);
  const clickRows = clicks.filter(r => new Date(r[0]) >= since);

  const avgScore = leadRows.length ? (leadRows.reduce((acc, r) => acc + Number(r[8] || 0), 0) / leadRows.length).toFixed(1) : 0;
  const byStatus = countBy_(leadRows, 9);
  const byBairro = topN_(countBy_(leadRows, 3), 5);
  const byTipo = topN_(countBy_(leadRows, 4), 5);
  const bySrc = topN_(countBy_(clickRows, 1), 8);

  const recomendacoes = [];
  if ((byStatus.QUENTE || 0) < (byStatus.MORNO || 0)) recomendacoes.push('- Reforçar CTA para urgência (imediato/3 meses).');
  if (!Object.keys(bySrc).some(k => k.includes('seo'))) recomendacoes.push('- Aumentar distribuição das páginas SEO locais.');
  if ((byBairro['Vila Sônia'] || 0) > (byBairro['Morumbi'] || 0)) recomendacoes.push('- Criar campanha dedicada para Vila Sônia perto do metrô.');
  if (!recomendacoes.length) recomendacoes.push('- Manter estratégia atual e testar novas fontes de SRC para escalar.');

  const body = [
    'Relatório final - Ciclo 14 dias',
    '',
    `Leads totais: ${leadRows.length}`,
    `Cliques WA totais: ${clickRows.length}`,
    `Score médio: ${avgScore}`,
    '',
    'Leads por status:',
    formatMap_(byStatus),
    '',
    'Top bairros:',
    formatMap_(byBairro),
    '',
    'Top tipos:',
    formatMap_(byTipo),
    '',
    'Top origens de clique WA:',
    formatMap_(bySrc),
    '',
    'Recomendações:',
    recomendacoes.join('\n')
  ].join('\n');

  MailApp.sendEmail(getReportEmail_(ss), 'VIP Autopiloto - Relatório final 14 dias', body);
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .nearMinute(30)
    .inTimezone(TZ)
    .create();

  ScriptApp.newTrigger('sendFinal14DaysReport')
    .timeBased()
    .everyDays(14)
    .atHour(20)
    .nearMinute(30)
    .inTimezone(TZ)
    .create();
}

function getReportEmail_(ss) {
  const data = ss.getSheetByName(SHEET_CONFIG).getDataRange().getValues();
  const row = data.find(r => r[0] === 'EMAIL_RELATORIO');
  return (row && row[1]) || Session.getActiveUser().getEmail();
}

function countBy_(rows, idx) {
  return rows.reduce((acc, row) => {
    const key = row[idx] || 'N/A';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topN_(obj, n) {
  return Object.fromEntries(
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
  );
}

function formatMap_(obj) {
  const entries = Object.entries(obj);
  if (!entries.length) return '- sem dados';
  return entries.map(([k, v]) => `- ${k}: ${v}`).join('\n');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
