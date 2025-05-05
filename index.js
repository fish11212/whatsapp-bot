const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { google } = require('googleapis');
const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const SHEET_ID = '1CnEdE5-ybQJ0LcMbYvqVPT3bj5tVsB8rqBihCBqkyFU'; // 📄 ID таблицы

// 🔄 Инициализация клиента WhatsApp
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Бот готов к приёму заявок!');
});

// 📥 Обработка входящих сообщений
client.on('message', async message => {
  if (!message.body) return;

  const text = message.body.trim();

  // 🧠 Парсинг данных
  const name = (text.match(/ФИО[:\-]?\s*(.+)/i) || [])[1];
  const phoneRaw = (text.match(/Номер[:\-]?\s*(\d{10,})/i) || [])[1];
  const operator = (text.match(/Оператор[:\-]?\s*(Мегафон|МТС|Билайн|Теле ?2|Т2)/i) || [])[1];
  const tariff = (text.match(/Тариф[:\-]?\s*(.+)/i) || [])[1];
  const status = (text.match(/Статус[:\-]?\s*(выполнен|на подключении|возврат)/i) || [])[1];

  const formattedPhone = phoneRaw?.replace(/^8/, '9')?.replace(/^7/, '9')?.replace(/^9/, '9'); // формат 905...

  const data = {
    name: name?.trim() || '',
    phone: formattedPhone || 'новый номер',
    operator: operator?.trim() || '',
    tariff: tariff?.trim() || '',
    status: (status?.trim() || 'на подключении')
  };

  try {
    await addToSheet(data);
    await message.reply('✅ Заявка добавлена в таблицу!');
  } catch (err) {
    console.error('❌ Ошибка при добавлении:', err);
    await message.reply('⚠️ Произошла ошибка при добавлении в таблицу.');
  }
});

// 📤 Функция добавления в Google Таблицу
async function addToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const values = [[
    new Date().toLocaleDateString('ru-RU'), // A — дата
    data.name,                              // B — ФИО
    "",                                     // C
    data.phone,                             // D — номер
    "",                                     // E
    data.operator,                          // F — оператор
    data.tariff,                            // G — тариф
    "", "", "",                             // H, I, J
    data.status                             // K — статус
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Лист1!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  console.log("📌 Заявка добавлена:", values[0]);
}

// 🚀 Запуск бота
client.initialize();
