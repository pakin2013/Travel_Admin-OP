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

INSERT INTO places (name, province, category, rating, image_url, description) VALUES
  ('วัดอรุณราชวราราม', 'กรุงเทพมหานคร', 'วัดและวัฒนธรรม', 4.8, 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=85', 'ชมพระปรางค์ริมแม่น้ำเจ้าพระยา แลนด์มาร์กสำคัญของกรุงเทพฯ'),
  ('เกาะพีพี', 'กระบี่', 'ทะเลและชายหาด', 4.9, 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=85', 'หมู่เกาะน้ำทะเลใสและอ่าวสวย เหมาะกับการดำน้ำและพักผ่อน'),
  ('ดอยอินทนนท์', 'เชียงใหม่', 'ธรรมชาติ', 4.7, 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=85', 'สัมผัสอากาศเย็นบนยอดเขาที่สูงที่สุดในประเทศไทย'),
  ('อุทยานประวัติศาสตร์อยุธยา', 'พระนครศรีอยุธยา', 'วัดและวัฒนธรรม', 4.8, 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=85', 'ย้อนรอยประวัติศาสตร์ผ่านโบราณสถานและวัดเก่าแก่'),
  ('หาดไร่เลย์', 'กระบี่', 'ทะเลและชายหาด', 4.6, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85', 'ชายหาดที่โอบล้อมด้วยหน้าผาหินปูนและน้ำทะเลสีมรกต'),
  ('บ้านรักไทย', 'แม่ฮ่องสอน', 'ธรรมชาติ', 4.5, 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85', 'หมู่บ้านกลางหุบเขาริมทะเลสาบ บรรยากาศสงบและมีเอกลักษณ์');
