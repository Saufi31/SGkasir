// ========================== DATA ==========================
let data = {
  transaksi: [],
  pemasukan: [],
  pengeluaran: [],
  akun: [{ nama: "Cash", saldo: 0 }],
  stok: [],
  hutang: []
};

// ========================== UTIL ==========================
function simpanData() {
  localStorage.setItem("kasirData", JSON.stringify(data));
}

function loadData() {
  let saved = localStorage.getItem("kasirData");
  if (saved) {
    data = JSON.parse(saved);
  }
  renderHistory();
  renderRekap();
  renderAkun();
  renderStok();
  renderHutang();
}

// ========================== NAVIGASI ==========================
function showSection(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // tutup sidebar
  let offcanvas = document.querySelector(".offcanvas.show");
  if (offcanvas) {
    bootstrap.Offcanvas.getInstance(offcanvas).hide();
  }
}

// ========================== TRANSAKSI ==========================
function simpanTransaksi() {
  let nama = document.getElementById("namaProduk").value;
  let harga = parseInt(document.getElementById("hargaProduk").value) || 0;
  let akunIndex = document.getElementById("akunTransaksi").selectedIndex;

  if (!nama || harga <= 0) {
    alert("Lengkapi data transaksi");
    return;
  }

  let trx = {
    nama,
    harga,
    akun: data.akun[akunIndex].nama,
    tanggal: new Date().toLocaleString()
  };

  data.transaksi.push(trx);
  data.akun[akunIndex].saldo += harga;
  simpanData();
  renderHistory();
  renderRekap();
  renderAkun();
  bersihkanForm();
}

function bersihkanForm() {
  document.getElementById("namaProduk").value = "";
  document.getElementById("hargaProduk").value = "";
}

// ========================== PEMASUKAN / PENGELUARAN ==========================
function tambahPemasukan(jumlah, ket) {
  if (jumlah <= 0) return;
  let obj = { jumlah, ket, tanggal: new Date().toLocaleString() };
  data.pemasukan.push(obj);
  data.akun[0].saldo += jumlah; // default ke Cash
  simpanData();
  renderHistory();
  renderRekap();
  renderAkun();
}

function tambahPengeluaran(jumlah, ket) {
  if (jumlah <= 0) return;
  let obj = { jumlah, ket, tanggal: new Date().toLocaleString() };
  data.pengeluaran.push(obj);
  data.akun[0].saldo -= jumlah; // default ke Cash
  simpanData();
  renderHistory();
  renderRekap();
  renderAkun();
}

// ========================== SALDO AKUN ==========================
function renderAkun() {
  let akunList = document.getElementById("akunList");
  let akunTransaksi = document.getElementById("akunTransaksi");
  if (!akunList || !akunTransaksi) return;

  akunList.innerHTML = "";
  akunTransaksi.innerHTML = "";

  data.akun.forEach((a, i) => {
    akunList.innerHTML += `<tr><td>${a.nama}</td><td>Rp ${a.saldo.toLocaleString()}</td></tr>`;
    akunTransaksi.innerHTML += `<option>${a.nama}</option>`;
  });
}

function tambahAkun(nama, saldo) {
  if (!nama) return;
  data.akun.push({ nama, saldo });
  simpanData();
  renderAkun();
  renderRekap();
}

// ========================== STOK BARANG ==========================
function renderStok() {
  let stokList = document.getElementById("stokList");
  if (!stokList) return;
  stokList.innerHTML = "";
  data.stok.forEach(b => {
    stokList.innerHTML += `<tr><td>${b.nama}</td><td>${b.jumlah}</td><td>Rp ${b.harga.toLocaleString()}</td></tr>`;
  });
}

function tambahStok() {
  let nama = document.getElementById("namaBarang").value;
  let jumlah = parseInt(document.getElementById("stokJumlah").value) || 0;
  let harga = parseInt(document.getElementById("stokHarga").value) || 0;
  if (!nama || jumlah <= 0 || harga <= 0) return;
  data.stok.push({ nama, jumlah, harga });
  simpanData();
  renderStok();
}

// ========================== HUTANG / PIUTANG ==========================
function renderHutang() {
  let hutangList = document.getElementById("hutangList");
  if (!hutangList) return;
  hutangList.innerHTML = "";
  data.hutang.forEach(h => {
    hutangList.innerHTML += `<tr><td>${h.nama}</td><td>Rp ${h.jumlah.toLocaleString()}</td><td>${h.tipe}</td></tr>`;
  });
}

function tambahHutang() {
  let nama = document.getElementById("namaHutang").value;
  let jumlah = parseInt(document.getElementById("jumlahHutang").value) || 0;
  let tipe = document.getElementById("tipeHutang").value;
  if (!nama || jumlah <= 0) return;
  data.hutang.push({ nama, jumlah, tipe });
  simpanData();
  renderHutang();
}

// ========================== AUDIT STOK ==========================
function auditStok() {
  let out = "<ul>";
  data.stok.forEach(b => {
    out += `<li>${b.nama}: stok ${b.jumlah}</li>`;
  });
  out += "</ul>";
  document.getElementById("auditList").innerHTML = out;
}

// ========================== HISTORY ==========================
function renderHistory() {
  let historyList = document.getElementById("historyList");
  if (!historyList) return;
  historyList.innerHTML = "";

  data.transaksi.forEach(t => {
    historyList.innerHTML += `<li class="list-group-item">[Penjualan] ${t.tanggal} - ${t.nama} Rp ${t.harga.toLocaleString()} (${t.akun})</li>`;
  });
  data.pemasukan.forEach(p => {
    historyList.innerHTML += `<li class="list-group-item text-success">[Pemasukan] ${p.tanggal} - Rp ${p.jumlah.toLocaleString()} (${p.ket})</li>`;
  });
  data.pengeluaran.forEach(p => {
    historyList.innerHTML += `<li class="list-group-item text-danger">[Pengeluaran] ${p.tanggal} - Rp ${p.jumlah.toLocaleString()} (${p.ket})</li>`;
  });
}

// ========================== REKAP ==========================
function renderRekap() {
  let omzet = data.transaksi.reduce((a, b) => a + b.harga, 0);
  let pemasukan = data.pemasukan.reduce((a, b) => a + b.jumlah, 0);
  let pengeluaran = data.pengeluaran.reduce((a, b) => a + b.jumlah, 0);
  let saldo = data.akun.reduce((a, b) => a + b.saldo, 0);

  document.getElementById("rekapOmzet").innerText = omzet.toLocaleString();
  document.getElementById("rekapPemasukan").innerText = pemasukan.toLocaleString();
  document.getElementById("rekapPengeluaran").innerText = pengeluaran.toLocaleString();
  document.getElementById("rekapSaldo").innerText = saldo.toLocaleString();
}

// ========================== EXPORT / SHARE ==========================
function exportCSV() {
  let rows = [["Tanggal", "Tipe", "Nama", "Jumlah", "Akun/Ket"]];
  data.transaksi.forEach(t => rows.push([t.tanggal, "Transaksi", t.nama, t.harga, t.akun]));
  data.pemasukan.forEach(p => rows.push([p.tanggal, "Pemasukan", p.ket, p.jumlah, "Cash"]));
  data.pengeluaran.forEach(p => rows.push([p.tanggal, "Pengeluaran", p.ket, p.jumlah, "Cash"]));

  let csv = rows.map(r => r.join(",")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "rekap.csv";
  a.click();
}

function printData() {
  let catatan = document.getElementById("catatanShare").value;
  let w = window.open();
  w.document.write("<h3>SGkasir</h3><p>" + catatan + "</p><pre>" + JSON.stringify(data, null, 2) + "</pre>");
  w.print();
}

function shareTXT() {
  let catatan = document.getElementById("catatanShare").value;
  let text = "SGkasir\n" + catatan + "\n\n" + JSON.stringify(data, null, 2);
  if (navigator.share) {
    navigator.share({ text });
  } else {
    alert(text);
  }
}

function sharePNG() {
  html2canvas(document.body).then(canvas => {
    canvas.toBlob(blob => {
      let file = new File([blob], "kasir.png", { type: "image/png" });
      if (navigator.share) {
        navigator.share({ files: [file] });
      } else {
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "kasir.png";
        a.click();
      }
    });
  });
}

// ========================== RESET ==========================
function resetData() {
  if (confirm("Yakin reset semua data?")) {
    localStorage.removeItem("kasirData");
    location.reload();
  }
}

// ========================== THEME ==========================
document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ========================== START ==========================
window.onload = loadData;