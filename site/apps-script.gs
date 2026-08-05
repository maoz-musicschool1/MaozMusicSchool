/**
 * Maoz Memadim — приём лидов с сайта в Google Sheets + уведомления
 * Инструкция по установке — в файле CRM-SETUP.md
 */

// ==== НАСТРОЙКИ ====
var NOTIFY_EMAIL = 'maozmusicads@gmail.com';   // куда слать уведомление о лиде
var CALLMEBOT_PHONE = '';                          // WhatsApp для уведомлений, напр. '972501234567'
var CALLMEBOT_APIKEY = '';                         // ключ от CallMeBot (см. CRM-SETUP.md)

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('לידים')
             || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Создать заголовки при первом запуске
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'תאריך', 'שם', 'גיל', 'טלפון', 'אימייל',
        'מסלול', 'כלים', 'ניסיון', 'כותב שירים', 'דמו', 'מקור',
        'סטטוס', 'מורה משובץ', 'סבסוד', 'הערות'
      ]);
      sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#111118').setFontColor('#A6E515');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.date || new Date(),
      data.name || '',
      data.age || '',
      "'" + (data.phone || ''),   // апостроф — чтобы Sheets не съел ведущий 0
      data.email || '',
      data.track || '',
      data.instruments || '',
      data.experience || '',
      data.writer || '',
      data.demo || '',
      data.source || '',
      'חדש',                       // статус по умолчанию
      '', '', ''
    ]);

    notify(data);
    return json({ result: 'success' });

  } catch (err) {
    return json({ result: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/** Уведомления: почта + WhatsApp */
function notify(d) {
  var lines =
    'ליד חדש מהאתר — מעוז ממדים\n\n' +
    'שם: ' + (d.name || '-') + '\n' +
    'גיל: ' + (d.age || '-') + '\n' +
    'טלפון: ' + (d.phone || '-') + '\n' +
    'אימייל: ' + (d.email || '-') + '\n' +
    'מסלול: ' + (d.track || '-') + '\n' +
    'כלים: ' + (d.instruments || '-') + '\n' +
    'ניסיון: ' + (d.experience || '-') + '\n' +
    'כותב/ת שירים: ' + (d.writer || '-') + '\n' +
    'דמו: ' + (d.demo || '-') + '\n' +
    'מקור: ' + (d.source || '-');

  // 1) Email
  if (NOTIFY_EMAIL) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'ליד חדש: ' + (d.name || '') + ' — ' + (d.track || ''),
      body: lines + '\n\nלפתיחת שיחה: https://wa.me/' + normalizePhone(d.phone)
    });
  }

  // 2) WhatsApp через CallMeBot (бесплатно)
  if (CALLMEBOT_PHONE && CALLMEBOT_APIKEY) {
    try {
      var url = 'https://api.callmebot.com/whatsapp.php'
        + '?phone=' + CALLMEBOT_PHONE
        + '&apikey=' + CALLMEBOT_APIKEY
        + '&text=' + encodeURIComponent(lines);
      UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    } catch (e) { /* не роняем запись лида из-за уведомления */ }
  }
}

/** 050-1234567 → 972501234567 */
function normalizePhone(p) {
  if (!p) return '';
  var digits = String(p).replace(/\D/g, '');
  if (digits.indexOf('972') === 0) return digits;
  if (digits.indexOf('0') === 0) return '972' + digits.substring(1);
  return digits;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Проверка, что веб-приложение живо */
function doGet() {
  return json({ status: 'ok', service: 'Maoz Memadim leads' });
}
