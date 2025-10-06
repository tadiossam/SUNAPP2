const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('attached_assets/EQUIPMENT MASTER LIST -SEPTEMBER 2018 E.C_1759791262397.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(JSON.stringify(data, null, 2));
