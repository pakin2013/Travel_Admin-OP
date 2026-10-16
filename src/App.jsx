import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp, ArrowRight, Compass, Filter, MapPin, MoreHorizontal,
  Plus, Search, Star, TentTree, X
} from 'lucide-react';

const categories = ['ทั้งหมด', 'ทะเลและชายหาด', 'ธรรมชาติ', 'วัดและวัฒนธรรม'];
const blankPlace = { name: '', province: '', category: categories[1], rating: '4.5', image_url: '', description: '' };

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...options?.headers }
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
  }
  return response.status === 204 ? null : response.json();
}

function PlaceForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || blankPlace);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, rating: Number(form.rating) });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-heading">
          <div><span className="eyebrow">จัดการสถานที่</span><h2 id="form-title">{initial ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="ปิด"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="place-form">
          <label>ชื่อสถานที่<input name="name" value={form.name} onChange={update} required maxLength="120" placeholder="เช่น วัดพระแก้ว" /></label>
          <div className="form-row">
            <label>จังหวัด<input name="province" value={form.province} onChange={update} required maxLength="100" placeholder="กรุงเทพมหานคร" /></label>
            <label>หมวดหมู่<select name="category" value={form.category} onChange={update}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
          </div>
          <div className="form-row">
            <label>คะแนน (0–5)<input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={update} required /></label>
            <label>ลิงก์รูปภาพ<input name="image_url" type="url" value={form.image_url} onChange={update} placeholder="https://..." /></label>
          </div>
          <label>รายละเอียด<textarea name="description" value={form.description} onChange={update} maxLength="1000" rows="3" placeholder="เล่าเสน่ห์ของสถานที่แห่งนี้" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>ยกเลิก</button><button className="button button-primary" disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึกสถานที่'}</button></div>
        </form>
      </section>
    </div>
  );
}

function PlaceCard({ place, onEdit, onDelete }) {
  return (
    <article className="place-card">
      <div className="place-image" style={{ backgroundImage: place.image_url ? `url("${place.image_url}")` : undefined }}>
        {!place.image_url && <TentTree size={34} />}
        <span className="category-tag">{place.category}</span>
        <div className="card-actions">
          <button className="icon-button" onClick={() => onEdit(place)} aria-label={`แก้ไข ${place.name}`}><MoreHorizontal size={19} /></button>
          <div className="action-menu"><button onClick={() => onEdit(place)}>แก้ไข</button><button className="danger-text" onClick={() => onDelete(place)}>ลบสถานที่</button></div>
        </div>
      </div>
      <div className="place-info">
        <div className="place-title-row"><h3>{place.name}</h3><span className="rating"><Star size={14} fill="currentColor" />{Number(place.rating).toFixed(1)}</span></div>
        <p className="place-location"><MapPin size={14} />{place.province}</p>
        <p className="place-description">{place.description || 'ยังไม่มีรายละเอียดของสถานที่นี้'}</p>
        <button className="text-link" onClick={() => onEdit(place)}>ดูรายละเอียด <ArrowRight size={15} /></button>
      </div>
    </article>
  );
}

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [sort, setSort] = useState('recommended');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  async function loadPlaces() {
    setError('');
    try {
      setPlaces(await request('/api/places'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadPlaces(); }, []);

  const visiblePlaces = useMemo(() => {
    const filtered = places.filter((place) => {
      const matchesCategory = category === 'ทั้งหมด' || place.category === category;
      const needle = query.trim().toLocaleLowerCase('th');
      return matchesCategory && (!needle || `${place.name} ${place.province} ${place.category}`.toLocaleLowerCase('th').includes(needle));
    });
    return filtered.sort((a, b) => sort === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'th'));
  }, [places, category, query, sort]);

  async function savePlace(place) {
    if (editing) await request(`/api/places/${editing.id}`, { method: 'PUT', body: JSON.stringify(place) });
    else await request('/api/places', { method: 'POST', body: JSON.stringify(place) });
    setFormOpen(false);
    setEditing(null);
    await loadPlaces();
  }

  async function deletePlace(place) {
    if (!window.confirm(`ต้องการลบ “${place.name}” ใช่ไหม?`)) return;
    try {
      await request(`/api/places/${place.id}`, { method: 'DELETE' });
      await loadPlaces();
    } catch (err) {
      setError(err.message);
    }
  }

  function openForm(place = null) {
    setEditing(place);
    setFormOpen(true);
  }

  const average = places.length ? (places.reduce((sum, place) => sum + Number(place.rating), 0) / places.length).toFixed(1) : '—';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark"><Compass size={22} /></span><span>เที่ยวไทย<small>TRAVEL ADMIN</small></span></a>
        <div className="sidebar-label">เมนูหลัก</div>
        <a className="nav-link active" href="#"><MapPin size={18} />สถานที่ท่องเที่ยว</a>
        <div className="sidebar-note"><div className="note-icon">✳</div><strong>เรื่องราวดี ๆ<br />รอให้คุณค้นพบ</strong><p>รวมแรงบันดาลใจจากทุกมุมของเมืองไทย</p><span>เที่ยวเมืองไทย ไปได้ทุกวัน</span></div>
        <div className="sidebar-footer"><div className="avatar">ท</div><div><strong>ผู้ดูแลระบบ</strong><span>จัดการข้อมูลท่องเที่ยว</span></div><MoreHorizontal size={20} /></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">แดชบอร์ด <span>/</span> สถานที่ท่องเที่ยว</div><div className="topbar-right"><span className="today-label">พื้นที่แห่งการเดินทาง</span><div className="avatar small-avatar">ท</div></div></header>
        <section className="page-content">
          <div className="welcome-row"><div><span className="eyebrow">TRAVEL OVERVIEW</span><h1>สถานที่ท่องเที่ยว</h1><p>จัดการและค้นพบจุดหมายปลายทางยอดนิยมทั่วประเทศไทย</p></div><button className="button button-primary add-button" onClick={() => openForm()}><Plus size={18} />เพิ่มสถานที่</button></div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon green-icon"><MapPin size={19} /></div><div className="stat-label">สถานที่ทั้งหมด</div><div className="stat-value">{places.length}<span> แห่ง</span></div><div className="stat-foot">จุดหมายที่บันทึกไว้ในระบบ</div></div>
            <div className="stat-card"><div className="stat-icon yellow-icon"><Star size={19} /></div><div className="stat-label">คะแนนเฉลี่ย</div><div className="stat-value">{average}<span> / 5</span></div><div className="stat-foot">จากคะแนนสถานที่ทั้งหมด</div></div>
            <div className="stat-card"><div className="stat-icon blue-icon"><TentTree size={19} /></div><div className="stat-label">หมวดหมู่</div><div className="stat-value">{new Set(places.map((place) => place.category)).size}<span> หมวด</span></div><div className="stat-foot">ทะเล ธรรมชาติ และวัฒนธรรม</div></div>
          </div>

          <section className="places-section">
            <div className="section-heading"><div><h2>จุดหมายยอดนิยม</h2><p>เลือกดูสถานที่ที่ใช่สำหรับการเดินทางครั้งต่อไป</p></div><button className="view-all" onClick={() => { setCategory('ทั้งหมด'); setQuery(''); }}>ดูทั้งหมด <ArrowRight size={16} /></button></div>
            <div className="toolbar">
              <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาสถานที่หรือจังหวัด..." /><kbd>⌘ K</kbd></label>
              <div className="toolbar-right"><span className="filter-label"><Filter size={15} />หมวดหมู่</span><select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><button className="sort-button" onClick={() => setSort(sort === 'rating' ? 'name' : 'rating')}><ArrowDownUp size={15} />{sort === 'rating' ? 'คะแนนสูงสุด' : sort === 'name' ? 'ชื่อสถานที่' : 'แนะนำ'}</button></div>
            </div>
            {error && <div className="error-banner" role="alert">{error} <button onClick={loadPlaces}>ลองอีกครั้ง</button></div>}
            {loading ? <div className="empty-state">กำลังโหลดสถานที่ท่องเที่ยว…</div> : visiblePlaces.length ? <div className="place-grid">{visiblePlaces.map((place) => <PlaceCard key={place.id} place={place} onEdit={openForm} onDelete={deletePlace} />)}</div> : <div className="empty-state">ไม่พบสถานที่ที่ตรงกับการค้นหา <button onClick={() => { setQuery(''); setCategory('ทั้งหมด'); }}>ล้างตัวกรอง</button></div>}
            <div className="results-footer"><span>แสดง {visiblePlaces.length} จาก {places.length} สถานที่</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>กลับด้านบน ↑</button></div>
          </section>
          <footer className="page-footer">เที่ยวไทย <span>·</span> แรงบันดาลใจในการเดินทาง เริ่มต้นที่นี่</footer>
        </section>
      </main>
      {formOpen && <PlaceForm initial={editing || undefined} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={savePlace} />}
    </div>
  );
}
