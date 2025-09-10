// =================== Data Storage ===================
let data = {
  akun: [
    { nama: "Kas (Cash)", saldo: 0 },
    { nama: "Bank", saldo: 0 }
  ],
  transaksi: [],
  pemasukan: [],
  pengeluaran: []
};

// Load dari localStorage
if (localStorage.getItem("sgkasir")) {
  data = JSON.parse(localStorage.getItem("sgkasir"));
}
function saveData() {
  localStorage.setItem("sgkasir", JSON.stringify(data));
}

// =================== Utility ===================
function formatRp(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}
function updateUI() {
  // Rekap
  let omzet = 0, pemasukan = 0, pengeluaran = 0, saldo = 0;

  data.transaksi.forEach(t => omzet += t.harga);
  data.pemasukan.forEach(p => pemasukan += p.jumlah);
  data.pengeluaran.forEach(p => pengeluaran += p.jumlah);
  data.akun.forEach(a => saldo += a.saldo);

  document.getElementById("rekapOmzet").innerText = formatRp(omzet);
  document.getElementById("rekapPemasukan").innerText = formatRp(pemasukan);
  document.getElementById("rekapPengeluaran").innerText = formatRp(pengeluaran);
  document.getElementById("rekapSaldo").innerText = formatRp(saldo);

  // History
  let list = document.getElementById("historyList");
  if (list) {
    list.innerHTML = "";
    [...data.transaksi, ...data.pemasukan, ...data.pengeluaran].forEach(item => {
      let li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${item.tanggal} - ${item.ket} - Rp ${formatRp(item.jumlah || item.harga)}`;
      list.appendChild(li);
    });
  }

  // Akun Dropdown
  let akunSelect = document.getElementById("akunTransaksi");
  if (akunSelect) {
    akunSelect.innerHTML = "";
    data.akun.forEach(a => {
      let opt = document.createElement("option");
      opt.value = a.nama;
      opt.textContent = `${a.nama} (Rp ${formatRp(a.saldo)})`;
      akunSelect.appendChild(opt);
    });
  }

  saveData();
}
updateUI();

// =================== Transaksi ===================
function simpanTransaksi() {
  let nama = document.getElementById("namaProduk").value;
  let harga = parseInt(document.getElementById("hargaProduk").value) || 0;
  let akun = document.getElementById("akunTransaksi").value;
  if (!nama || harga <= 0) return alert("Lengkapi data transaksi");

  let trx = { tanggal: new Date().toLocaleString(), ket: nama, harga, akun };
  data.transaksi.push(trx);

  // Update saldo akun
  let akunObj = data.akun.find(a => a.nama === akun);
  if (akunObj) akunObj.saldo += harga;

  saveData();
  updateUI();
  bersihkanForm();
}
function bersihkanForm() {
  document.getElementById("namaProduk").value = "";
  document.getElementById("hargaProduk").value = "";
}

// =================== Pemasukan & Pengeluaran ===================
function tambahPemasukan(jumlah, ket = "Pemasukan") {
  let item = { tanggal: new Date().toLocaleString(), jumlah, ket };
  data.pemasukan.push(item);
  data.akun[0].saldo += jumlah; // default ke Kas
  saveData(); updateUI();
}
function tambahPengeluaran(jumlah, ket = "Pengeluaran") {
  let item = { tanggal: new Date().toLocaleString(), jumlah, ket };
  data.pengeluaran.push(item);
  data.akun[0].saldo -= jumlah; // default ke Kas
  saveData(); updateUI();
}

// =================== Export & Share ===================
function exportCSV() {
  let rows = [["Tanggal", "Keterangan", "Jumlah"]];
  [...data.transaksi, ...data.pemasukan, ...data.pengeluaran].forEach(i => {
    rows.push([i.tanggal, i.ket, i.jumlah || i.harga]);
  });
  let csv = rows.map(r => r.join(",")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url; a.download = "history.csv"; a.click();
}

function printData() {
  let catatan = document.getElementById("catatanShare").value;
  let win = window.open("", "", "width=600,height=400");
  win.document.write("<pre>" + catatan + "\n\n");
  data.transaksi.forEach(t => {
    win.document.write(`${t.tanggal} - ${t.ket} - Rp ${formatRp(t.harga)}\n`);
  });
  win.document.write("</pre>");
  win.print();
}

function shareTXT() {
  let txt = document.getElementById("catatanShare").value + "\n\n";
  data.transaksi.forEach(t => txt += `${t.tanggal} - ${t.ket} - Rp ${formatRp(t.harga)}\n`);
  let blob = new Blob([txt], { type: "text/plain" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url; a.download = "history.txt"; a.click();
}

function sharePNG() {
  let area = document.getElementById("historyList");
  html2canvas(area).then(canvas => {
    let a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "history.png"; a.click();
  });
}

// =================== UI Control ===================
function showSection(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(".offcanvas.show")?.classList.remove("show");
}

document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

// =================== Library untuk PNG ===================
function loadHtml2Canvas() {
  if (typeof html2canvas === "undefined") {
    let s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.body.appendChild(s);
  }
}
loadHtml2Canvas();