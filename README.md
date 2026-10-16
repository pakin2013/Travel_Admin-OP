# เที่ยวไทย — แดชบอร์ดสถานที่ท่องเที่ยว

เว็บแอปสำหรับดู ค้นหา เพิ่ม แก้ไข และลบสถานที่ท่องเที่ยวยอดนิยม พัฒนาด้วย React และ Cloudflare Workers + D1 สำหรับ deployment

## ความต้องการ

- Node.js 22 ขึ้นไป
- npm

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิดเว็บที่ <http://localhost:5173> โดย Vite จะส่งคำขอ `/api` ไปยัง Express ที่พอร์ต 3000 ข้อมูลสำหรับการพัฒนาในเครื่องจะเก็บใน `data/travel.sqlite`

ทดสอบ Worker และ D1 ในเครื่องได้ด้วย:

```bash
npm run worker:dev
```

## ฟีเจอร์

- ค้นหาสถานที่จากชื่อ จังหวัด และหมวดหมู่
- กรองตามหมวดหมู่ และเรียงตามคะแนนหรือชื่อ
- เพิ่ม แก้ไข และลบสถานที่ผ่านหน้าจัดการ
- แสดงจำนวนสถานที่ คะแนนเฉลี่ย และจำนวนหมวดหมู่
- API สำหรับ CRUD อยู่ที่ `/api/places`

## Deploy ฟรีบน Cloudflare Workers + D1 ผ่าน GitHub Actions

```bash
npm run build
```

1. ใน Cloudflare Dashboard เปิดใช้งาน `workers.dev` subdomain ของบัญชี (ถ้ายังไม่เคยเปิด) และสร้าง API token จาก **My Profile → API Tokens → Create Token → Edit Cloudflare Workers** โดยจำกัด scope ไว้ที่บัญชีที่จะ deploy (เก็บ token เป็นความลับ)
2. คัดลอก Account ID จาก Cloudflare Dashboard
3. ใน GitHub repository เปิด **Settings → Secrets and variables → Actions → New repository secret** แล้วเพิ่ม:
   - `CLOUDFLARE_API_TOKEN` — API token
   - `CLOUDFLARE_ACCOUNT_ID` — Account ID
4. Push commit ไปยัง branch `main` (หรือ rerun workflow ใน GitHub Actions) เพื่อให้ deployment เริ่มทำงาน

GitHub Actions จะ build หน้าเว็บ, สร้าง Worker และ D1 database หากยังไม่มี, apply migration สำหรับ schema/ข้อมูลตัวอย่าง และ deploy เว็บไปยัง URL `workers.dev` ที่ Cloudflare แสดงในหน้า Worker โดยไม่ต้องใส่ database ID ใน repository.

ใน Cloudflare Dashboard สามารถดู URL ได้ที่ **Workers & Pages → travel-admin-op → Settings**. ตารางและข้อมูลเริ่มต้นกำหนดไว้ใน `migrations/0001_create_places.sql`. ข้อมูล production จะอยู่ใน D1; SQLite ใน `data/travel.sqlite` ใช้เฉพาะ local Express development.

GitHub Actions จะข้าม deployment (แต่ build และตรวจสอบยังทำงาน) หากยังไม่ได้เพิ่ม Cloudflare secrets.
