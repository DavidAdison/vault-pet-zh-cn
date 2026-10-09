'use strict';
// Dependency-free ZIP packaging. Fixed allowlist: never include data.json or backups.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.id !== 'vault-pet') throw new Error('Plugin ID must stay vault-pet');
const files = ['main.js', 'manifest.json', 'styles.css', 'LICENSE', 'fonts/Pretendard-Regular.otf', 'fonts/Pretendard-Bold.otf', 'fonts/OFL-Pretendard.md'];
const entries = files.map((name) => ({ name: 'vault-pet/' + name, data: fs.readFileSync(path.join(root, name)) }));
entries.push({ name: 'vault-pet/安装说明.md', data: fs.readFileSync(path.join(root, 'README.md')) });
const table = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const chunks = [];
const central = [];
let offset = 0;
for (const { name, data } of entries) {
  const filename = Buffer.from(name, 'utf8');
  const compressed = zlib.deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6); // UTF-8 names
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(33, 12); // 1980-01-01, deterministic ZIP metadata
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(filename.length, 26);
  chunks.push(header, filename, compressed);
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(20, 4);
  header.copy(record, 6, 4, 30);
  record.writeUInt32LE(offset, 42);
  central.push(record, filename);
  offset += header.length + filename.length + compressed.length;
}
const directory = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'vault-pet-zh-cn.zip'), Buffer.concat([...chunks, directory, end]));
for (const name of ['main.js', 'manifest.json', 'styles.css']) fs.copyFileSync(path.join(root, name), path.join(out, name));
const assets = ['vault-pet-zh-cn.zip', 'main.js', 'manifest.json', 'styles.css'];
const hashes = assets.map((name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(out, name))).digest('hex') + '  ' + name);
fs.writeFileSync(path.join(out, 'SHA256SUMS.txt'), hashes.join('\n') + '\n');
console.log(`Packaged Vault Pet ${manifest.version}: ${entries.length} files, no save data.\n${out}`);
