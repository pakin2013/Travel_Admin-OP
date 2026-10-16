import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dataDirectory = path.join(root, 'data');
mkdirSync(dataDirectory, { recursive: true });

const db = new DatabaseSync(path.join(dataDirectory, 'travel.sqlite'));
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    category TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM places').get().count;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO places (name, province, category, rating, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const seedPlaces = [
    ['วัดอรุณราชวราราม', 'กรุงเทพมหานคร', 'วัดและวัฒนธรรม', 4.8, 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=85', 'ชมพระปรางค์ริมแม่น้ำเจ้าพระยา แลนด์มาร์กสำคัญของกรุงเทพฯ'],
    ['เกาะพีพี', 'กระบี่', 'ทะเลและชายหาด', 4.9, 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=85', 'หมู่เกาะน้ำทะเลใสและอ่าวสวย เหมาะกับการดำน้ำและพักผ่อน'],
    ['ดอยอินทนนท์', 'เชียงใหม่', 'ธรรมชาติ', 4.7, 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=85', 'สัมผัสอากาศเย็นบนยอดเขาที่สูงที่สุดในประเทศไทย'],
    ['อุทยานประวัติศาสตร์อยุธยา', 'พระนครศรีอยุธยา', 'วัดและวัฒนธรรม', 4.8, 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=85', 'ย้อนรอยประวัติศาสตร์ผ่านโบราณสถานและวัดเก่าแก่'],
    ['หาดไร่เลย์', 'กระบี่', 'ทะเลและชายหาด', 4.6, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85', 'ชายหาดที่โอบล้อมด้วยหน้าผาหินปูนและน้ำทะเลสีมรกต'],
    ['บ้านรักไทย', 'แม่ฮ่องสอน', 'ธรรมชาติ', 4.5, 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85', 'หมู่บ้านกลางหุบเขาริมทะเลสาบ บรรยากาศสงบและมีเอกลักษณ์']
  ];
  for (const place of seedPlaces) insert.run(...place);
}

const app = express();
app.use(express.json({ limit: '32kb' }));

const listPlaces = db.prepare('SELECT * FROM places ORDER BY id DESC');
const getPlace = db.prepare('SELECT * FROM places WHERE id = ?');
const insertPlace = db.prepare(`
  INSERT INTO places (name, province, category, rating, image_url, description)
  VALUES (@name, @province, @category, @rating, @image_url, @description)
`);
const updatePlace = db.prepare(`
  UPDATE places
  SET name = @name, province = @province, category = @category,
      rating = @rating, image_url = @image_url, description = @description,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = @id
`);
const deletePlace = db.prepare('DELETE FROM places WHERE id = ?');

function validatePlace(body) {
  const fields = ['name', 'province', 'category', 'description', 'image_url'];
  for (const field of fields) {
    if (typeof body[field] !== 'string') return `กรุณากรอก${field === 'name' ? 'ชื่อสถานที่' : field === 'province' ? 'จังหวัด' : field === 'category' ? 'หมวดหมู่' : field === 'description' ? 'รายละเอียด' : 'URL รูปภาพ'}ให้ถูกต้อง`;
  }
  const place = {
    name: body.name.trim(),
    province: body.province.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    image_url: body.image_url.trim(),
    rating: Number(body.rating)
  };
  if (!place.name || !place.province || !place.category) return 'กรุณากรอกชื่อสถานที่ จังหวัด และหมวดหมู่';
  if (place.name.length > 120 || place.province.length > 100 || place.category.length > 80) return 'ข้อมูลบางช่องยาวเกินกำหนด';
  if (place.description.length > 1000 || place.image_url.length > 500) return 'รายละเอียดหรือ URL รูปภาพยาวเกินกำหนด';
  if (!Number.isFinite(place.rating) || place.rating < 0 || place.rating > 5) return 'คะแนนต้องอยู่ระหว่าง 0 ถึง 5';
  if (place.image_url && !/^https?:\/\/\S+$/i.test(place.image_url)) return 'URL รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://';
  return place;
}

app.get('/api/places', (_req, res) => {
  res.json(listPlaces.all());
});

app.post('/api/places', (req, res) => {
  const place = validatePlace(req.body);
  if (typeof place === 'string') return res.status(400).json({ error: place });
  const result = insertPlace.run(place);
  res.status(201).json(getPlace.get(Number(result.lastInsertRowid)));
});

app.put('/api/places/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'รหัสสถานที่ไม่ถูกต้อง' });
  if (!getPlace.get(id)) return res.status(404).json({ error: 'ไม่พบสถานที่นี้' });
  const place = validatePlace(req.body);
  if (typeof place === 'string') return res.status(400).json({ error: place });
  updatePlace.run({ ...place, id });
  res.json(getPlace.get(id));
});

app.delete('/api/places/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'รหัสสถานที่ไม่ถูกต้อง' });
  const result = deletePlace.run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'ไม่พบสถานที่นี้' });
  res.status(204).end();
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'ไม่พบ API ที่ร้องขอ' }));

const builtClient = path.join(root, 'dist');
if (existsSync(builtClient)) {
  app.use(express.static(builtClient));
  app.get('*', (_req, res) => res.sendFile(path.join(builtClient, 'index.html')));
}

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`เที่ยวไทย dashboard พร้อมใช้งานที่ http://localhost:${port}`));
