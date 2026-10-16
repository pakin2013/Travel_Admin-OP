# เที่ยวไทย — แดชบอร์ดสถานที่ท่องเที่ยว

เว็บแอปสำหรับดู ค้นหา เพิ่ม แก้ไข และลบสถานที่ท่องเที่ยวยอดนิยม พัฒนาด้วย React, Express และ SQLite

## ความต้องการ

- Node.js 22.13 ขึ้นไป (ใช้ SQLite ที่มาพร้อม Node.js)
- npm

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิดเว็บที่ <http://localhost:5173> โดย Vite จะส่งคำขอ `/api` ไปยัง Express ที่พอร์ต 3000 ข้อมูลจะถูกเก็บไว้ใน `data/travel.sqlite` และมีตัวอย่างสถานที่ให้เมื่อเริ่มระบบครั้งแรก

## ฟีเจอร์

- ค้นหาสถานที่จากชื่อ จังหวัด และหมวดหมู่
- กรองตามหมวดหมู่ และเรียงตามคะแนนหรือชื่อ
- เพิ่ม แก้ไข และลบสถานที่ผ่านหน้าจัดการ
- แสดงจำนวนสถานที่ คะแนนเฉลี่ย และจำนวนหมวดหมู่
- API สำหรับ CRUD อยู่ที่ `/api/places`

## สร้างและเปิดใช้งานแบบ production

```bash
npm run build
npm start
```

เปิด <http://localhost:3000> หากต้องการเปลี่ยนพอร์ต ให้กำหนด environment variable `PORT`

## Deploy บน Render ผ่าน GitHub Actions

โปรเจกต์มี Render Blueprint ใน `render.yaml` ซึ่งสร้าง Node.js web service พร้อม persistent disk สำหรับฐานข้อมูล SQLite และ health check ที่ `/api/places`

1. เข้า Render Dashboard แล้วสร้าง Blueprint ใหม่จาก repository `pakin2013/Travel_Admin-OP` เพื่อสร้าง service ตาม `render.yaml` และรอให้ deploy ครั้งแรกเสร็จ
2. เปิด service ใน Render แล้วไปที่ **Settings → Deploy Hook** สร้าง deploy hook
3. ใน GitHub repository ไปที่ **Settings → Secrets and variables → Actions → New repository secret**
4. ตั้งชื่อ secret เป็น `RENDER_DEPLOY_HOOK_URL` และใส่ URL ของ deploy hook จาก Render
5. Push ไปยัง `main` อีกครั้ง: GitHub Actions จะติดตั้ง dependencies, ตรวจ production dependencies, build และเรียก deploy hook หลัง build ผ่าน

Render ใช้ persistent disk ที่ `/opt/render/project/src/data` เพื่อเก็บ `data/travel.sqlite` ข้อมูล SQLite จะคงอยู่ระหว่าง deploy ใหม่ตราบใดที่ใช้ disk เดิม ทั้งนี้ Render อาจคิดค่าบริการสำหรับ web service และ disk ตามแผนที่เลือก
