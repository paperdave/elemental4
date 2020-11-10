const fs = require('fs-extra');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');

if(!(fs.pathExistsSync(root) && fs.pathExistsSync(path.join(root,'db')) && fs.pathExistsSync(path.join(root,'db','all.e4db')))) {
  console.log(root, 'is not an elemental data dir.');
  process.exit();
}

const entries = fs.readFileSync(path.join(root, 'db', 'all.e4db')).toString().split('\n').filter(Boolean).map((x) => {
  return JSON.parse(x);
});
fs.readdirSync(path.join(root, 'db')).forEach(item => {
  if(item !== 'all.e4db') {
    fs.removeSync(path.join(root, 'db', item));
  }
})
fs.writeFileSync(path.join(root, 'db', 'today.e4db'), '');
fs.writeFileSync(path.join(root, 'meta'), JSON.stringify({
  "elementCount":entries.filter(x => x.type === 'element').length,
  "entryCount":entries.length,
  "allElementIds": Object.fromEntries(entries.filter(x => x.type === 'element').map((entry => {
    return [elementNameToStorageID(entry.text), entry.id]
  }))),
  "currentDay": getToday(),
  "nameLastModified":Date.now()
}));

function getToday() {
  const x = new Date();
  return `${x.getUTCFullYear()}-${(x.getUTCMonth()+1).toString().padStart(2,'0')}-${x.getUTCDate().toString().padStart(2, '0')}`;
}
function elementNameToStorageID(elemName) {
  return elemName.replace(/\n/g,'').replace(/ +/g, " ").trim().toLowerCase();
}
