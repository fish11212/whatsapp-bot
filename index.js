const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { google } = require('googleapis');
const creds = require('./service-account.json'); // файл ключа от Google

// Запуск клиента WhatsApp
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Бот готов к приёму заявок!');
});

// Обработка сообщений
client.on('message', async message => {
  if (!message.body) return;

  const text = message.body;

  const name = (text.match(/ФИО[:\-]?\s*(.+)/i) || [])[1];
  const phone = (text.match(/Номер[:\-]?\s*(\d{10,})/i) || [])[1];
  const operator = (text.match(/Оператор[:\-]?\s*(.+)/i) || [])[1];
  const tariff = (text.match(/Тариф[:\-]?\s*(.+)/i) || [])[1];
  const status = (text.match(/Статус[:\-]?\s*(.+)/i) || [])[1];

  const data = {
    name: name?.trim(),
    phone: phone?.trim(),
    operator: operator?.trim(),
    tariff: tariff?.trim(),
    status: status?.trim()
  };

  try {
    await addToSheet(data);
    await message.reply('✅ Заявка добавлена в таблицу');
  } catch (err) {
    console.error('❌ Ошибка при добавлении:', err);
    await message.reply('⚠️ Ошибка при добавлении в таблицу');
  }
});

// Функция добавления в Google Таблицу
async function addToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const values = [[
    new Date().toLocaleDateString('ru-RU'),        // A — дата
    data.name || "",                               // B — ФИО
    "",                                             // C
    data.phone || "новый номер",                   // D — номер
    "",                                             // E
    data.operator || "",                           // F — оператор
    data.tariff || "",                             // G — описание тарифа
    "", "", "",                                     // H, I, J
    data.status || ""                              // K — статус
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: '1CnEdE5-ybQJ0LcMbYvqVPT3bj5tVsB8rqBihCBqkyFU', // замени на ID твоей таблицы
    range: 'Лист1!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  console.log("📌 Заявка успешно добавлена:", values[0]);
}

// Инициализация
client.initialize();
