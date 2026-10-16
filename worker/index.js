const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

const errorResponse = (message, status) => jsonResponse({ error: message }, status);

function validatePlace(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'ข้อมูลสถานที่ไม่ถูกต้อง';

  const fields = ['name', 'province', 'category', 'description', 'image_url'];
  const labels = {
    name: 'ชื่อสถานที่',
    province: 'จังหวัด',
    category: 'หมวดหมู่',
    description: 'รายละเอียด',
    image_url: 'URL รูปภาพ'
  };
  for (const field of fields) {
    if (typeof body[field] !== 'string') return `กรุณากรอก${labels[field]}ให้ถูกต้อง`;
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

async function readPlace(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/places' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM places ORDER BY id DESC').all();
    return jsonResponse(results);
  }

  if (url.pathname === '/api/places' && request.method === 'POST') {
    const place = validatePlace(await readPlace(request));
    if (typeof place === 'string') return errorResponse(place, 400);
    const result = await env.DB.prepare(`
      INSERT INTO places (name, province, category, rating, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(place.name, place.province, place.category, place.rating, place.image_url, place.description).run();
    const created = await env.DB.prepare('SELECT * FROM places WHERE id = ?').bind(result.meta.last_row_id).first();
    return jsonResponse(created, 201);
  }

  const match = url.pathname.match(/^\/api\/places\/([^/]+)$/);
  if (match && (request.method === 'PUT' || request.method === 'DELETE')) {
    const id = Number(match[1]);
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse('รหัสสถานที่ไม่ถูกต้อง', 400);

    if (request.method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM places WHERE id = ?').bind(id).run();
      if (result.meta.changes === 0) return errorResponse('ไม่พบสถานที่นี้', 404);
      return new Response(null, { status: 204 });
    }

    const existing = await env.DB.prepare('SELECT id FROM places WHERE id = ?').bind(id).first();
    if (!existing) return errorResponse('ไม่พบสถานที่นี้', 404);
    const place = validatePlace(await readPlace(request));
    if (typeof place === 'string') return errorResponse(place, 400);
    await env.DB.prepare(`
      UPDATE places
      SET name = ?, province = ?, category = ?, rating = ?, image_url = ?,
          description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(place.name, place.province, place.category, place.rating, place.image_url, place.description, id).run();
    const updated = await env.DB.prepare('SELECT * FROM places WHERE id = ?').bind(id).first();
    return jsonResponse(updated);
  }

  return errorResponse('ไม่พบ API ที่ร้องขอ', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  }
};
