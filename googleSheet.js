// googleSheet.js
const { GoogleSpreadsheet } = require('google-spreadsheet');

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

async function appendRow({ fullName, phone, operator, description, status }) {
  await doc.useServiceAccountAuth(
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  );

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const now = new Date();
  const formattedDate = now.toLocaleDateString("ru-RU");

  await sheet.addRow({
    A: formattedDate,
    B: fullName,
    C: '',
    D: phone || 'новый номер',
    E: '',
    F: operator,
    G: description,
    H: '',
    I: '',
    J: '',
    K: status || 'на подключении'
  });
}

module.exports = { appendRow };
