const fs = require('fs');
const token = "KGAT_e674f1b4bacea3bf42acc595f694e535";

const content = fs.readFileSync('marketing_campaign.csv', 'utf8');
const lines = content.trim().split(/\r?\n/);
const headers = lines[0].split(';');

const responseIdx = headers.indexOf('Response');
const cmpCols = ['AcceptedCmp1', 'AcceptedCmp2', 'AcceptedCmp3', 'AcceptedCmp4', 'AcceptedCmp5'];
const cmpIdxs = cmpCols.map(c => headers.indexOf(c));
const cmpCounts = [0, 0, 0, 0, 0];
let lastColCount = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i]) continue;
  const cols = lines[i].split(';');
  if (cols[responseIdx] === '1') {
    lastColCount++;
  }
  cmpIdxs.forEach((idx, index) => {
    if (cols[idx] === '1') {
      cmpCounts[index]++;
    }
  });
}

console.log(lastColCount);
cmpCols.forEach((name, i) => console.log(name + ': ' + cmpCounts[i]));

