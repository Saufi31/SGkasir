// minimal full-core logic (Firestore not used). Data persisted to localStorage.
// Later bisa ganti ke Firebase / IndexedDB.
if(!state.stok) state.stok=[];
if(!state.hp) state.hp=[];

function tambahBarang(){
  const nama = document.getElementById('st_nama').value.trim();
  const modal = parseFloat(document.getElementById('st_modal').value)||0;
  const jual = parseFloat(document.getElementById('st_jual').value)||0;
  const jumlah = parseInt(document.getElementById('st_jumlah').value)||0;
  if(!nama) return alert('Isi nama barang');
  const id='brg_'+Date.now();
  state.stok.push({id,nama,modal,jual,jumlah});
  saveState(); renderStok();
  document.getElementById('st_nama').value=''; document.getElementById('st_modal').value=''; document.getElementById('st_jual').value=''; document.getElementById('st_jumlah').value='';
}
function renderStok(){
  const tbody=document.getElementById('tblStok'); tbody.innerHTML='';
  state.stok.forEach(b=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${b.nama}</td><td>Rp ${format(b.modal)}</td><td>Rp ${format(b.jual)}</td><td>${b.jumlah}</td>
    <td><button onclick="hapusBarang('${b.id}')">Hapus</button></td>`;
    tbody.appendChild(tr);
  });
}
function hapusBarang(id){
  state.stok=state.stok.filter(b=>b.id!==id);
  saveState(); renderStok();
}
function tambahHP(){
  const nama=document.getElementById('hp_nama').value.trim();
  const jumlah=parseFloat(document.getElementById('hp_jumlah').value)||0;
  const ket=document.getElementById('hp_ket').value.trim();
  const jenis=document.getElementById('hp_jenis').value;
  if(!nama||!jumlah) return alert('Lengkapi data');
  const id='hp_'+Date.now();
  state.hp.push({id,nama,jumlah,ket,jenis,status:'belum'});
  saveState(); renderHP();
  document.getElementById('hp_nama').value=''; document.getElementById('hp_jumlah').value=''; document.getElementById('hp_ket').value='';
}
function renderHP(){
  const tbody=document.getElementById('tblHP'); tbody.innerHTML='';
  state.hp.forEach(h=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${h.nama}</td><td>${h.jenis}</td><td>Rp ${format(h.jumlah)}</td><td>${h.ket}</td><td>${h.status}</td>
    <td>${h.status==='belum'?`<button onclick="lunasHP('${h.id}')">Lunas</button>`:''}<button onclick="hapusHP('${h.id}')">Hapus</button></td>`;
    tbody.appendChild(tr);
  });
}
function lunasHP(id){
  const h=state.hp.find(x=>x.id===id); if(h) h.status='lunas';
  saveState(); renderHP();
}
function hapusHP(id){
  state.hp=state.hp.filter(x=>x.id!==id);
  saveState(); renderHP();
}


const STORE_KEY = 'sgkasir_v1';
const STORE_META = 'sgkasir_meta';
let state = { accounts: [], transactions: [], store:{} };

// init
document.addEventListener('DOMContentLoaded', ()=>{
  renderStok();
  renderHP();
  loadState();
  bindUI();
  renderAccounts();
  renderHistory();
  updateRekap();
});

function bindUI(){
  document.getElementById('btnBurger').addEventListener('click', toggleDrawer);
  document.getElementById('btnTheme').addEventListener('click', toggleTheme);
  // fill account selects
  renderAccounts();
}

function toggleDrawer(){
  const d = document.getElementById('drawer');
  d.classList.toggle('open');
}
function show(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('drawer').classList.remove('open');
  if(id==='rekap') updateRekap();
  if(id==='history') renderHistory();
  if(id==='saldo') renderAccounts();
}

function toggleTheme(){
  const body = document.body;
  const cur = body.getAttribute('data-theme') || 'light';
  const next = cur==='light' ? 'dark' : 'light';
  body.setAttribute('data-theme', next);
  document.getElementById('btnTheme').textContent = next==='light' ? '🌙' : '☀️';
  saveMeta();
}

/* ----------------- STORAGE ----------------- */
function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  const meta = localStorage.getItem(STORE_META);
  if(raw) state = JSON.parse(raw);
  if(!state.accounts) state.accounts = [];
  if(!state.transactions) state.transactions = [];
  if(meta){
    try{ const m = JSON.parse(meta); if(m.theme) document.body.setAttribute('data-theme', m.theme); }catch(e){}
  }
}
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function saveMeta(){ const m = { theme: document.body.getAttribute('data-theme') || 'light' }; localStorage.setItem(STORE_META, JSON.stringify(m)); }

/* -------------- ACCOUNTS --------------- */
function tambahAkun(){
  const name = document.getElementById('acc_name').value.trim();
  const type = document.getElementById('acc_type').value;
  const bal = parseFloat(document.getElementById('acc_balance').value)||0;
  if(!name) return alert('Isi nama akun');
  const id = 'acc_' + Date.now();
  state.accounts.push({id,name,type,balance:bal});
  saveState(); renderAccounts();
  document.getElementById('acc_name').value=''; document.getElementById('acc_balance').value='0';
}
function renderAccounts(){
  const tbl = document.getElementById('tblAkun');
  const sel = document.getElementById('tx_akun');
  tbl.innerHTML = ''; sel.innerHTML = '<option value="">-- pilih akun --</option>';
  state.accounts.forEach(a=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.name}</td><td>${a.type}</td><td>Rp ${format(a.balance)}</td>`;
    tbl.appendChild(tr);
    const opt = document.createElement('option'); opt.value = a.id; opt.textContent = `${a.name} (${a.type})`;
    sel.appendChild(opt);
  });
  updateRekap();
}

/* -------------- TRANSAKSI -------------- */
function simpanPenjualan(){
  const nama = document.getElementById('tx_produk').value.trim();
  const harga = parseFloat(document.getElementById('tx_harga').value)||0;
  const acc = document.getElementById('tx_akun').value;
  if(!nama || !harga || !acc) return alert('Isi semua field');
  const tx = { id:'tx_'+Date.now(), ts:new Date().toISOString(), jenis:'penjualan', desc:nama, amount:harga, account:acc };
  state.transactions.unshift(tx);
  const a=state.accounts.find(x=>x.id===acc); if(a) a.balance+=harga;
  // kurangi stok jika ada barang dengan nama sama
  const brg=state.stok.find(b=>b.nama.toLowerCase()===nama.toLowerCase()); if(brg){ brg.jumlah=Math.max(0,brg.jumlah-1); }
  saveState(); clearTransaksi(); renderHistory(); renderAccounts(); renderStok(); alert('Penjualan tersimpan');
}
  const nama = document.getElementById('tx_produk').value.trim();
  const harga = parseFloat(document.getElementById('tx_harga').value)||0;
  const acc = document.getElementById('tx_akun').value;
  if(!nama || !harga || !acc) return alert('Isi semua field dan pilih akun');
  const tx = { id:'tx_'+Date.now(), ts: new Date().toISOString(), jenis:'penjualan', desc:nama, amount: harga, account: acc };
  state.transactions.unshift(tx);
  // update akun balance
  const a = state.accounts.find(x=>x.id===acc); if(a) a.balance += harga;
  saveState(); clearTransaksi(); renderHistory(); renderAccounts(); alert('Penjualan tersimpan');
}
function clearTransaksi(){ document.getElementById('tx_produk').value=''; document.getElementById('tx_harga').value=''; }

/* Pemasukan / Pengeluaran via modal-simple (form in drawer) */
function openForm(type){
  const label = type==='pemasukan' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran';
  const value = prompt(label + '\nFormat: Keterangan | Jumlah | AkunID (opsional)\nContoh: Setoran Modal|100000|');
  if(!value) return;
  const parts = value.split('|').map(s=>s.trim());
  const desc = parts[0]||type;
  const amt = parseFloat(parts[1])||0;
  const accId = parts[2] || (state.accounts[0] ? state.accounts[0].id : '');
  if(!accId) return alert('Belum ada akun. Tambah akun dulu di menu Saldo Akun');
  const tx = { id:'tx_'+Date.now(), ts:new Date().toISOString(), jenis: type, desc:desc, amount: (type==='pemasukan'? amt : -amt), account: accId };
  state.transactions.unshift(tx);
  const a = state.accounts.find(x=>x.id===accId); if(a) a.balance += (type==='pemasukan'? amt : -amt);
  saveState(); renderHistory(); renderAccounts(); alert('Tersimpan: ' + type);
}

/* -------------- HISTORY & FILTER -------------- */
function renderHistory(list){
  const rows = document.getElementById('tblHistory');
  const data = list || state.transactions;
  rows.innerHTML = '';
  data.forEach(tx=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="checkbox" class="chkItem" data-id="${tx.id}"></td><td>${new Date(tx.ts).toLocaleString()}</td><td>${tx.jenis}</td><td>${tx.desc}</td><td>Rp ${format(tx.amount)}</td>`;
    rows.appendChild(tr);
  });
}
function applyFilter(){
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  const jenis = document.getElementById('filterJenis').value;
  let list = state.transactions.slice();
  if(jenis) list = list.filter(t=>t.jenis===jenis);
  if(from){ const f=new Date(from); list = list.filter(t=> new Date(t.ts) >= f); }
  if(to){ const t=new Date(to); t.setDate(t.getDate()+1); list = list.filter(tx=> new Date(tx.ts) < t); }
  renderHistory(list);
}
function toggleAll(cb){
  document.querySelectorAll('.chkItem').forEach(c=>c.checked = cb.checked);
}

/* -------------- EXPORT / PRINT / SHARE -------------- */
async function exportSelected(mode){
  else if(mode==='csv'){
  const rows=[['Tanggal','Jenis','Keterangan','Jumlah']];
  items.forEach(it=>rows.push([new Date(it.ts).toLocaleString(),it.jenis,it.desc,it.amount]));
  const csv=rows.map(r=>r.join(',')).join('\n');
  downloadBlob(csv,'history.csv','text/csv');
}
  // collect selected ids
  const ids = Array.from(document.querySelectorAll('.chkItem')).filter(c=>c.checked).map(c=>c.dataset.id);
  if(ids.length===0) return alert('Pilih minimal satu transaksi');
  const items = ids.map(id=> state.transactions.find(t=>t.id===id)).filter(Boolean);
  const meta = loadStoreMeta();
  const note = document.getElementById('exportNote').value || '';
  const html = buildPrintHtml(meta, items, note);
  if(mode==='print'){
    const pa = document.getElementById('printArea'); pa.innerHTML = html; pa.style.display='block'; window.print(); pa.style.display='none';
  } else if(mode==='txt'){
    const txt = buildText(meta, items, note);
    downloadBlob(txt, 'struk.txt','text/plain');
  } else if(mode==='png'){
    const pa = document.getElementById('printArea'); pa.innerHTML = html; pa.style.display='block';
    await html2canvas(pa).then(canvas=>{ const url = canvas.toDataURL('image/png'); const a=document.createElement('a'); a.href=url; a.download='struk.png'; a.click(); });
    pa.style.display='none';
  }
}

function buildPrintHtml(meta, items, note){
  const logo = meta.logo || 'logo.png';
  let out = `<div style="text-align:center;font-family:Arial;color:#000">`;
  if(logo) out += `<img src="${logo}" style="width:64px;height:64px;object-fit:contain"><br>`;
  out += `<strong>${meta.name||'Toko'}</strong><br>${meta.address||''}<br>HP: ${meta.phone||''}<hr>`;
  out += `<table style="width:100%;border-collapse:collapse">`;
  out += `<thead><tr><th>No</th><th>Keterangan</th><th>Jumlah</th></tr></thead><tbody>`;
  items.forEach((it,i)=>{ out += `<tr><td>${i+1}</td><td>${escapeHtml(it.desc)}</td><td>Rp ${format(it.amount)}</td></tr>`; });
  out += `</tbody></table><hr>`;
  if(note) out += `<div><strong>Catatan:</strong><div>${escapeHtml(note)}</div></div>`;
  out += `</div>`;
  return out;
}
function buildText(meta, items, note){
  let lines = [];
  lines.push(meta.name||'Toko');
  if(meta.address) lines.push(meta.address);
  if(meta.phone) lines.push('HP: '+meta.phone);
  lines.push('--------------------------');
  items.forEach((it,i)=>{ lines.push(`${i+1}. ${it.desc} — Rp ${format(it.amount)}`); });
  lines.push('--------------------------');
  if(note) lines.push('Catatan: '+note);
  return lines.join('\n');
}
function downloadBlob(content, filename, type){
  const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

/* -------------- REKAP -------------- */
function updateRekap(){
  const omzet = state.transactions.filter(t=>t.jenis==='penjualan').reduce((s,t)=>s+(t.amount||0),0);
  const masuk = state.transactions.filter(t=>t.jenis==='pemasukan').reduce((s,t)=>s+(t.amount||0),0);
  const keluar = state.transactions.filter(t=>t.jenis==='pengeluaran').reduce((s,t)=>s+(Math.abs(t.amount)||0),0);
  const saldo = state.accounts.reduce((s,a)=>s+(a.balance||0),0);
  document.getElementById('rekapOmzet').textContent = format(omzet);
  document.getElementById('rekapMasuk').textContent = format(masuk);
  document.getElementById('rekapKeluar').textContent = format(keluar);
  document.getElementById('rekapSaldo').textContent = format(saldo);
}
function generateRekap(){
  updateRekap();
  const m = document.getElementById('rekapMonth').value;
  alert('Rekap untuk ' + (m||'seluruh periode') + ' ditampilkan di layar.');
}

/* -------------- STORE META -------------- */
function saveStore(){
  const s = { name: document.getElementById('store_name').value || '', address: document.getElementById('store_address').value || '', phone: document.getElementById('store_phone').value || '', logo: document.getElementById('store_logo').value || 'logo.png' };
  localStorage.setItem('sgkasir_store', JSON.stringify(s)); alert('Simpan pengaturan toko'); loadStoreMeta();
}
function loadStoreMeta(){
  const r = localStorage.getItem('sgkasir_store'); return r? JSON.parse(r) : { name:'SGkasir', address:'', phone:'', logo:'logo.png' };
}

/* -------------- HELPERS -------------- */
function format(n){ return Number(n||0).toLocaleString('id-ID'); }
function escapeHtml(s){ if(!s) return ''; return s.toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }