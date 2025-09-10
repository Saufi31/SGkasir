/* FINAL STABLE app.js
   key: sgkasir_final
   All features active. UI controlled via showSection().
*/
const KEY = 'sgkasir_final_v1';
let data = {
  akun: [{ id: 'acc_0', nama: 'Cash', saldo: 0 }],
  transaksi: [],
  pemasukan: [],
  pengeluaran: [],
  stok: [],
  hutang: [],
  note: ''
};

function load(){
  const raw = localStorage.getItem(KEY);
  if(raw) data = JSON.parse(raw);
  applyNote();
  renderAll();
}
function save(){ localStorage.setItem(KEY, JSON.stringify(data)); }

/* NAV */
function showSection(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
  // close offcanvas if open
  document.querySelectorAll('.offcanvas.show').forEach(off=>{
    bootstrap.Offcanvas.getInstance(off).hide();
  });
  // render targeted content
  if(id==='history') renderHistory();
  if(id==='rekap') renderRekap();
  if(id==='saldo') renderSaldo();
  if(id==='stok') renderStok();
  if(id==='hutang') renderHutang();
}

/* THEME */
(function initTheme(){
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const saved = localStorage.getItem(KEY + '_theme');
  if(saved==='dark'){ body.classList.add('dark'); }
  themeToggle.addEventListener('click', ()=>{
    body.classList.toggle('dark');
    localStorage.setItem(KEY + '_theme', body.classList.contains('dark') ? 'dark' : 'light');
  });
})();

/* UTILS */
function fmt(n){ return Number(n||0).toLocaleString('id-ID'); }
function now(){ return new Date().toLocaleString(); }
function findAkunById(id){ return data.akun.find(a=>a.id===id); }
function uid(prefix='id'){ return prefix + Date.now().toString(36); }
function applyNote(){ const n = data.note || ''; const ta = document.getElementById('catatanPengaturan'); if(ta) ta.value = n; }

/* RENDER ALL */
function renderAll(){
  renderAkunSelect();
  renderAkunList();
  renderStok();
  renderHutang();
  renderHistory();
  renderRekap();
  renderSaldoMini();
}

/* AKUN */
function renderAkunSelect(){
  const sel = document.getElementById('akunTransaksi');
  if(!sel) return;
  sel.innerHTML = '';
  data.akun.forEach((a, idx)=>{
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.nama} (Rp ${fmt(a.saldo)})`;
    sel.appendChild(opt);
  });
  renderSaldoMini();
}
function renderAkunList(){
  const tbody = document.getElementById('saldoTable');
  if(!tbody) return;
  tbody.innerHTML = '';
  data.akun.forEach(a=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.nama}</td><td>Rp ${fmt(a.saldo)}</td>`;
    tbody.appendChild(tr);
  });
}
function tambahAkun(){
  const name = document.getElementById('namaAkunBaru').value.trim();
  const saldo = parseInt(document.getElementById('saldoAwal').value) || 0;
  if(!name) return alert('Isi nama akun');
  data.akun.push({ id: uid('acc_'), nama: name, saldo });
  save(); renderAkunSelect(); renderAkunList(); renderRekap();
  document.getElementById('namaAkunBaru').value=''; document.getElementById('saldoAwal').value='';
}

/* TRANSAKSI */
function onJenisChange(){
  const jenis = document.getElementById('jenisTransaksi').value;
  const adminWrap = document.getElementById('adminWrap');
  adminWrap.style.display = (jenis==='PPOB' || jenis==='Transfer' || jenis==='Tarik Tunai') ? 'block' : 'none';
}
function simpanTransaksi(){
  const jenis = document.getElementById('jenisTransaksi').value;
  const nama = document.getElementById('namaProduk').value.trim();
  const harga = parseInt(document.getElementById('hargaProduk').value) || 0;
  const admin = parseInt(document.getElementById('adminBiaya')?.value) || 0;
  const akunId = document.getElementById('akunTransaksi').value;

  if(!nama || harga<=0) return alert('Lengkapi nama dan nominal');
  const akun = findAkunById(akunId);
  if(!akun) return alert('Pilih akun valid');

  // handle per jenis
  const tx = { id: uid('tx_'), tanggal: now(), jenis, nama, harga, admin, akun: akunId };

  if(jenis==='Aksesoris'){
    // reduce stok if exist
    const stokItem = data.stok.find(s => s.nama.toLowerCase() === nama.toLowerCase());
    if(stokItem){
      if(stokItem.jumlah <= 0) return alert('Stok habis');
      stokItem.jumlah = Math.max(0, stokItem.jumlah - 1);
    }
    // proceed: omzet + akun saldo
    akun.saldo += harga;
  } else if(jenis==='Transfer'){
    // Transfer: ask target akun id (prompt shows list)
    const targetName = prompt('Tujuan transfer (masukkan nama akun tujuan persis):','');
    if(!targetName) return alert('Batal: tujuan transfer kosong');
    const target = data.akun.find(a=>a.nama.toLowerCase()===targetName.toLowerCase());
    if(!target) return alert('Akun tujuan tidak ditemukan');
    // subtract from source, add to target
    if(akun.saldo < harga) return alert('Saldo akun sumber tidak cukup');
    akun.saldo -= harga;
    target.saldo += (harga - admin);
  } else if(jenis==='Tarik Tunai'){
    // tarik tunai: uang tunai (Cash) bertambah, akun dipilih berkurang
    const cash = data.akun.find(a=>a.nama.toLowerCase()==='cash') || data.akun[0];
    if(akun.saldo < harga) return alert('Saldo akun tidak cukup');
    akun.saldo -= (harga + admin);
    cash.saldo += harga;
  } else {
    // normal sale types -> add to account
    akun.saldo += harga;
  }

  data.transaksi.unshift(tx);
  save();
  renderAll();
  clearTransaksiForm();
  alert('Transaksi tersimpan');
}
function clearTransaksiForm(){
  document.getElementById('namaProduk').value='';
  document.getElementById('hargaProduk').value='';
  document.getElementById('adminBiaya') && (document.getElementById('adminBiaya').value='');
}

/* PEMASUKAN / PENGELUARAN */
function tambahPemasukan(){
  const j = parseInt(document.getElementById('jumlahPemasukan').value) || 0;
  const ket = document.getElementById('ketPemasukan').value || 'Pemasukan';
  if(j<=0) return alert('Jumlah tidak valid');
  data.pemasukan.unshift({ id: uid('in_'), tanggal: now(), jumlah: j, ket });
  data.akun[0].saldo += j; // default ke Cash
  save(); renderAll();
  document.getElementById('jumlahPemasukan').value=''; document.getElementById('ketPemasukan').value='';
}
function tambahPengeluaran(){
  const j = parseInt(document.getElementById('jumlahPengeluaran').value) || 0;
  const ket = document.getElementById('ketPengeluaran').value || 'Pengeluaran';
  if(j<=0) return alert('Jumlah tidak valid');
  data.pengeluaran.unshift({ id: uid('out_'), tanggal: now(), jumlah: j, ket });
  data.akun[0].saldo -= j;
  save(); renderAll();
  document.getElementById('jumlahPengeluaran').value=''; document.getElementById('ketPengeluaran').value='';
}

/* STOK */
function renderStok(){
  const t = document.getElementById('stokTable');
  if(!t) return;
  t.innerHTML = '';
  data.stok.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.nama}</td><td>${s.jumlah}</td><td>Rp ${fmt(s.harga)}</td>`;
    t.appendChild(tr);
  });
}
function tambahStok(){
  const nama = document.getElementById('namaBarang').value.trim();
  const jumlah = parseInt(document.getElementById('stokJumlah').value) || 0;
  const harga = parseInt(document.getElementById('stokHarga').value) || 0;
  if(!nama || jumlah<=0) return alert('Isi data stok valid');
  data.stok.unshift({ id: uid('s_'), nama, jumlah, harga });
  save(); renderStok();
  document.getElementById('namaBarang').value=''; document.getElementById('stokJumlah').value=''; document.getElementById('stokHarga').value='';
}

/* HUTANG/PIUTANG */
function renderHutang(){
  const t = document.getElementById('hutangTable');
  if(!t) return;
  t.innerHTML = '';
  data.hutang.forEach(h=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${h.nama}</td><td>Rp ${fmt(h.jumlah)}</td><td>${h.tipe}</td>`;
    t.appendChild(tr);
  });
}
function tambahHutang(){
  const nama = document.getElementById('namaHutang').value.trim();
  const jumlah = parseInt(document.getElementById('jumlahHutang').value) || 0;
  const tipe = document.getElementById('tipeHutang').value;
  if(!nama || jumlah<=0) return alert('Isi data hutang/piutang valid');
  data.hutang.unshift({ id: uid('h_'), nama, jumlah, tipe });
  save(); renderHutang();
  document.getElementById('namaHutang').value=''; document.getElementById('jumlahHutang').value='';
}

/* HISTORY & REKAP */
function renderHistory(){
  const list = document.getElementById('historyList'); if(!list) return;
  list.innerHTML = '';
  // transactions
  data.transaksi.forEach(tx=>{
    const akun = findAkunById(tx.akun);
    list.insertAdjacentHTML('beforeend',
      `<li class="list-group-item">[${tx.jenis}] ${tx.tanggal} • ${tx.nama} • Rp ${fmt(tx.harga)} • ${akun?.nama||''}</li>`);
  });
  // pemasukan
  data.pemasukan.forEach(p=> list.insertAdjacentHTML('beforeend', `<li class="list-group-item list-group-item-success">[Pemasukan] ${p.tanggal} • Rp ${fmt(p.jumlah)} • ${p.ket}</li>`));
  // pengeluaran
  data.pengeluaran.forEach(q=> list.insertAdjacentHTML('beforeend', `<li class="list-group-item list-group-item-danger">[Pengeluaran] ${q.tanggal} • Rp ${fmt(q.jumlah)} • ${q.ket}</li>`));
}
function renderRekap(){
  const omzet = data.transaksi.reduce((s,t)=> s + (t.harga||0), 0);
  const saldoTotal = data.akun.reduce((s,a)=> s + (a.saldo||0), 0);
  document.getElementById('rekapOmzet').textContent = 'Rp ' + fmt(omzet);
  document.getElementById('rekapSaldo').textContent = 'Rp ' + fmt(saldoTotal);
  renderAkunList();
}
function renderAkunList(){
  const ul = document.getElementById('akunList'); if(!ul) return;
  ul.innerHTML = '';
  data.akun.forEach(a=> ul.insertAdjacentHTML('beforeend', `<li class="list-group-item">${a.nama} • Rp ${fmt(a.saldo)}</li>`));
}
function renderSaldoMini(){
  const el = document.getElementById('saldoMini'); if(!el) return;
  const total = data.akun.reduce((s,a)=> s + (a.saldo||0), 0);
  el.textContent = 'Saldo: Rp ' + fmt(total);
}

/* AUDIT */
function auditStok(){
  const out = data.stok.map(s=> `${s.nama}: ${s.jumlah}`).join('<br>');
  document.getElementById('auditResult').innerHTML = out || '<small>Tidak ada barang</small>';
}

/* EXPORT / SHARE / PRINT */
function exportCSV(){
  const rows = [['Tanggal','Jenis','Keterangan','Jumlah','Akun']];
  data.transaksi.forEach(t => rows.push([t.tanggal,t.jenis,t.nama,t.harga, findAkunById(t.akun)?.nama || '']));
  data.pemasukan.forEach(p => rows.push([p.tanggal,'Pemasukan',p.ket,p.jumlah,'']));
  data.pengeluaran.forEach(q => rows.push([q.tanggal,'Pengeluaran',q.ket,q.jumlah,'']));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'sgkasir_history.csv'; a.click();
}
function downloadJSON(){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'sgkasir_backup.json'; a.click();
}
function printHistory(){
  const note = document.getElementById('catatanShare').value || data.note || '';
  const w = window.open('','_blank','width=800,height=600');
  w.document.write(`<pre>${note}\n\n${JSON.stringify(data, null, 2)}</pre>`);
  w.print(); w.close();
}
function shareTXT(){
  const note = document.getElementById('catatanShare').value || data.note || '';
  let txt = note + '\n\n';
  data.transaksi.forEach(t=> txt += `[${t.jenis}] ${t.tanggal} - ${t.nama} - Rp ${fmt(t.harga)}\n`);
  const blob = new Blob([txt], { type: 'text/plain' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'sgkasir.txt'; a.click();
}
function sharePNG(){
  html2canvas(document.querySelector('main')).then(canvas=>{
    canvas.toBlob(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'sgkasir.png'; a.click();
    });
  });
}

/* RESET & SETTINGS */
function resetData(){
  if(!confirm('Yakin reset semua data?')) return;
  localStorage.removeItem(KEY);
  location.reload();
}
document.getElementById('catatanPengaturan')?.addEventListener('change', (e)=>{ data.note = e.target.value; save(); });

// expose handlers used by HTML onclick attributes
window.showSection = showSection;
window.simpanTransaksi = simpanTransaksi;
window.tambahPemasukan = tambahPemasukan;
window.tambahPengeluaran = tambahPengeluaran;
window.tambahAkun = tambahAkun;
window.tambahStok = tambahStok;
window.tambahHutang = tambahHutang;
window.auditStok = auditStok;
window.exportCSV = exportCSV;
window.downloadJSON = downloadJSON;
window.printHistory = printHistory;
window.shareTXT = shareTXT;
window.sharePNG = sharePNG;
window.resetData = resetData;

/* init */
window.addEventListener('load', ()=>{
  load();
  // wire render functions to elements that need immediate update
  document.getElementById('namaAkunBaru')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') tambahAkun(); });
  onJenisChange();
});