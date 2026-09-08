const ExcelJS = require('exceljs');
async function test() {
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile("../Icon 8-9-26.xls");
    console.log("Worksheet loaded, rowCount:", wb.worksheets[0]?.rowCount);
  } catch (e) {
    console.error("Error reading:", e.message);
  }
}
test();
