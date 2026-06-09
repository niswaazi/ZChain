// ============================================================
// Z-CHAIN PLATFORM — MULTI-ROLE SYSTEM v4
// ============================================================

const DB_VERSION = "zchain_v4";

function resetDatabase() {
    const SEED = [
        { email:"donatur@zchain.com",  password:"password123", nama:"Muzaki Atjeh",    role:"donatur"  },
        { email:"mustahik@zchain.com", password:"password123", nama:"Hasan Petani",     role:"mustahik" },
        { email:"admin@zchain.com",    password:"admin123",    nama:"Admin Z-Chain",    role:"admin"    },
        { email:"mitra@zchain.com",    password:"mitra123",    nama:"LAZ Aceh Mandiri", role:"mitra"    }
    ];
    localStorage.setItem("zchain_users",    JSON.stringify(SEED));
    localStorage.setItem("zchain_pool",     "128500000");
    localStorage.setItem("zchain_donasi",   "[]");
    localStorage.setItem("zchain_qardhul",  "[]");
    localStorage.setItem("zchain_laporan",  "[]");
    localStorage.setItem("zchain_disalurkan","0");
    localStorage.setItem("zchain_return",   "0");
    localStorage.setItem(DB_VERSION,        "1");
}

function initDatabase() {
    if (!localStorage.getItem(DB_VERSION)) { resetDatabase(); return; }
    let users = JSON.parse(localStorage.getItem("zchain_users") || "[]");
    if (!users.length || !users[0].role) { resetDatabase(); return; }

    // Pastikan akun seed testing selalu ada (jangan sampai hilang)
    const SEED_EMAILS = ["donatur@zchain.com","mustahik@zchain.com","admin@zchain.com","mitra@zchain.com"];
    const SEED = [
        { email:"donatur@zchain.com",  password:"password123", nama:"Muzaki Atjeh",    role:"donatur"  },
        { email:"mustahik@zchain.com", password:"password123", nama:"Hasan Petani",     role:"mustahik" },
        { email:"admin@zchain.com",    password:"admin123",    nama:"Admin Z-Chain",    role:"admin"    },
        { email:"mitra@zchain.com",    password:"mitra123",    nama:"LAZ Aceh Mandiri", role:"mitra"    }
    ];
    let changed = false;
    SEED.forEach(s => {
        const idx = users.findIndex(u => u.email === s.email);
        if (idx < 0) { users.push(s); changed = true; }
        else if (!users[idx].password || !users[idx].role) { users[idx] = { ...users[idx], ...s }; changed = true; }
    });
    if (changed) localStorage.setItem("zchain_users", JSON.stringify(users));

    // ensure all keys
    if (!localStorage.getItem("zchain_donasi"))    localStorage.setItem("zchain_donasi",   "[]");
    if (!localStorage.getItem("zchain_qardhul"))   localStorage.setItem("zchain_qardhul",  "[]");
    if (!localStorage.getItem("zchain_laporan"))   localStorage.setItem("zchain_laporan",  "[]");
    if (!localStorage.getItem("zchain_disalurkan"))localStorage.setItem("zchain_disalurkan","0");
    if (!localStorage.getItem("zchain_return"))    localStorage.setItem("zchain_return",   "0");
    if (!localStorage.getItem("zchain_pool"))      localStorage.setItem("zchain_pool",     "128500000");
}

// ---- STATE ----
let penggunaAktif = null;
const isBlockchainConnected = true;

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    syncPoolDisplays();
    simulasikanCekKoneksi();
    hitungKalkulasiDonasi();
    hitungZakatUsaha();
});

// ============================================================
// SCREEN
// ============================================================
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ============================================================
// CONNECTION CHECK
// ============================================================
function simulasikanCekKoneksi() {
    const spinner     = document.getElementById("connection-spinner");
    const statusText  = document.getElementById("connection-status-text");
    const errorBox    = document.getElementById("connection-error-actions");
    spinner.classList.remove("hidden");
    errorBox.classList.add("hidden");
    statusText.textContent = "Membuka enkripsi & memverifikasi node Polygon RPC...";
    setTimeout(() => {
        spinner.classList.add("hidden");
        if (isBlockchainConnected) {
            showScreen("auth-screen");
            log("donatur","SYSTEM","Koneksi sukses ke Polygon Mainnet. Smart Contract verified.","success");
            toast("Node Blockchain Siap Dioperasikan.","success");
        } else {
            statusText.textContent = "";
            errorBox.classList.remove("hidden");
        }
    }, 1400);
}

// ============================================================
// AUTH TABS
// ============================================================
function switchAuthTab(type) {
    const isLogin = type === "login";
    document.getElementById("tab-login").classList.toggle("active", isLogin);
    document.getElementById("tab-register").classList.toggle("active", !isLogin);
    document.getElementById("login-form").classList.toggle("hidden", !isLogin);
    document.getElementById("register-form").classList.toggle("hidden", isLogin);
}

// ============================================================
// REGISTER
// ============================================================
function handleRegister(e) {
    e.preventDefault();
    const nama     = v("reg-nama");
    const email    = v("reg-email");
    const hp       = v("reg-hp");
    const password = v("reg-password");
    const role     = v("reg-role");

    const users = db("zchain_users");
    if (users.some(u => u.email === email)) {
        toast("Email sudah terdaftar!","danger");
        return;
    }
    users.push({ nama, email, hp, password, role });
    save("zchain_users", users);
    toast("Akun berhasil didaftarkan sebagai " + role + "!","success");
    switchAuthTab("login");
}

// ============================================================
// LOGIN
// ============================================================
function handleLogin(e) {
    e.preventDefault();
    const email    = v("login-email");
    const password = v("login-password");
    const user     = db("zchain_users").find(u => u.email === email && u.password === password);

    if (!user) {
        toast("Email atau password salah!","danger");
        log("donatur","AUTH","Gagal otentikasi: " + email,"warning");
        return;
    }

    penggunaAktif = user;
    toast("Selamat Datang, " + user.nama + "! [" + user.role.toUpperCase() + "]","success");
    log(user.role,"AUTH","Akses disetujui: " + user.nama + " (" + user.role + ")","success");

    // set nama di navbar
    const nameMap = { donatur:"donatur-user-name", mustahik:"mustahik-user-name", admin:"admin-user-name", mitra:"mitra-user-name" };
    setText(nameMap[user.role], user.nama);

    // route
    switch (user.role) {
        case "donatur":
            showScreen("dashboard-donatur");
            refreshDonatur();
            break;
        case "mustahik":
            showScreen("dashboard-mustahik");
            renderStatusPengajuan();
            break;
        case "admin":
            showScreen("dashboard-admin");
            refreshAdmin();
            break;
        case "mitra":
            showScreen("dashboard-mitra");
            refreshMitra();
            break;
    }
    syncPoolDisplays();
}

// ============================================================
// LOGOUT
// ============================================================
function handleLogout() {
    penggunaAktif = null;
    toast("Anda telah keluar dari sistem.","warning");
    showScreen("auth-screen");
}

// ============================================================
// RESET TESTING
// ============================================================
function handleResetTesting() {
    resetDatabase();
    setText("login-email","");
    setText("login-password","");
    if (document.getElementById("login-email"))    document.getElementById("login-email").value = "";
    if (document.getElementById("login-password")) document.getElementById("login-password").value = "";
    toast("✅ Data testing direset! Silakan login ulang.","success");
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tabId, btnEl) {
    if (!btnEl) return;
    const dashboard = btnEl.closest(".dashboard-container");
    if (!dashboard) return;

    dashboard.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    btnEl.classList.add("active");

    dashboard.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById("tab-" + tabId + "-content");
    if (target) target.classList.add("active");

    // refresh on open
    const r = {
        "riwayat-donasi":    refreshDonatur,
        "tracking-dampak":   refreshTracking,
        "status-pengajuan":  renderStatusPengajuan,
        "admin-overview":    refreshAdmin,
        "admin-antrian":     renderAntreanAdmin,
        "admin-donasi":      renderRekapDonasi,
        "admin-laporan":     renderAdminLaporan,
        "mitra-monitoring":  refreshMitra,
        "mitra-mustahik":    renderMitraMustahik,
        "mitra-zakat":       renderMitraZakat,
    };
    if (r[tabId]) r[tabId]();
}

// ============================================================
// KALKULASI
// ============================================================
function hitungKalkulasiDonasi() {
    const n   = parseFloat(document.getElementById("donasi-nominal")?.value) || 0;
    const fee = n * 0.005;
    setText("calc-kotor", "Rp " + fmt(n));
    setText("calc-fee",   "Rp " + fmt(fee));
    setText("calc-net",   "Rp " + fmt(n - fee));
}

function hitungZakatUsaha() {
    const p = parseFloat(document.getElementById("report-pendapatan")?.value) || 0;
    setText("calc-pendapatan-bersih", "Rp " + fmt(p));
    setText("calc-zakat-return",      "Rp " + fmt(p * 0.025));
}

// ============================================================
// DONASI
// ============================================================
function handleDonation(e) {
    e.preventDefault();
    const jenis   = v("donasi-jenis");
    const nominal = parseFloat(v("donasi-nominal"));
    const metode  = v("donasi-metode");

    if (nominal < 10000) { toast("Minimal donasi Rp 10.000","danger"); return; }

    const fee    = nominal * 0.005;
    const net    = nominal - fee;
    const txHash = genHash();
    const waktu  = now();

    // pool
    setNum("zchain_pool", getNum("zchain_pool") + net);

    // save
    const donasi = db("zchain_donasi");
    donasi.push({ id:txHash, waktu, nama:penggunaAktif.nama, email:penggunaAktif.email, jenis, metode, nominal, fee, net });
    save("zchain_donasi", donasi);

    syncPoolDisplays();

    // kuitansi
    document.getElementById("receipt-placeholder-text").classList.add("hidden");
    document.getElementById("receipt-real-content").classList.remove("hidden");
    setText("rec-time",   waktu);
    setText("rec-nama",   penggunaAktif.nama);
    setText("rec-jenis",  jenis);
    setText("rec-metode", metode);
    setText("rec-gross",  "Rp " + fmt(nominal));
    setText("rec-fee",    "Rp " + fmt(fee));
    setText("rec-net",    "Rp " + fmt(net));
    setText("rec-hash",   txHash);

    toast("Transaksi berhasil! Hash terekam on-chain.","success");
    log("donatur","SMART CONTRACT","Event [donation] " + jenis + " via " + metode + ". Gross: Rp " + fmt(nominal) + ". Net: Rp " + fmt(net),"success");
    log("donatur","BLOCKCHAIN","Block Confirmed. TX: " + txHash,"success");
}

// ============================================================
// QARDHUL HASAN
// ============================================================
function handleQardhul(e) {
    e.preventDefault();
    const nik       = v("qardhul-nik");
    const kerja     = v("qardhul-kerja");
    const nominal   = parseFloat(v("qardhul-nominal"));
    const deskripsi = v("qardhul-deskripsi");

    if (nik.length !== 16 || isNaN(Number(nik))) {
        toast("NIK tidak valid — harus 16 digit angka!","danger");
        log("mustahik","VERIFIKASI","Rejection: NIK gagal validasi kependudukan.","warning");
        return;
    }
    if (!nominal || nominal <= 0 || nominal > 10000000) {
        toast("Nominal tidak valid. Maksimal Rp 10.000.000","danger");
        return;
    }

    const txHash  = genHash();
    const waktu   = now();
    const maskedNIK    = nik.substring(0,6) + "**********";
    const maskedWallet = "0x" + rndHex(6) + "..." + rndHex(4);

    const list = db("zchain_qardhul");
    list.push({ id:txHash, waktu, nama:penggunaAktif.nama, email:penggunaAktif.email, maskedNIK, maskedWallet, kerja, nominal, deskripsi, status:"menunggu" });
    save("zchain_qardhul", list);

    toast("Pengajuan dikirim! Menunggu verifikasi Admin.","success");
    log("mustahik","BACKEND","NIK " + maskedNIK + " mengajukan modal kluster [" + kerja + "]. Status: MENUNGGU.","warning");
    log("mustahik","BLOCKCHAIN","Pengajuan on-chain. TX: " + txHash,"success");

    renderStatusPengajuan();
    e.target.reset();
}

// ============================================================
// LAPORAN DAMPAK
// ============================================================
function handleImpactReport(e) {
    e.preventDefault();
    const deskripsi  = v("report-panen");
    const tonase     = parseFloat(v("report-tonase")) || 0;
    const pendapatan = parseFloat(v("report-pendapatan"));
    const zakat      = pendapatan * 0.025;
    const txHash     = genHash();
    const waktu      = now();

    setNum("zchain_pool",   getNum("zchain_pool") + zakat);
    setNum("zchain_return", getNum("zchain_return") + zakat);

    const list = db("zchain_laporan");
    list.push({ id:txHash, waktu, nama:penggunaAktif.nama, email:penggunaAktif.email, deskripsi, tonase, pendapatan, zakat });
    save("zchain_laporan", list);

    syncPoolDisplays();
    toast("Laporan dipublikasikan! Zakat return tercatat.","success");
    log("mustahik","IMPACT REPORT","Submit laporan: \"" + deskripsi + "\". Tonase: " + tonase + " Kg.","success");
    log("mustahik","BLOCKCHAIN","Event [zakat_return] Rp " + fmt(zakat) + " masuk Pool. TX: " + txHash,"warning");

    e.target.reset();
    hitungZakatUsaha();
}

// ============================================================
// RENDER — DONATUR
// ============================================================
function refreshDonatur() {
    renderRiwayatDonasi();
    refreshTracking();
}

function renderRiwayatDonasi() {
    const el = document.getElementById("riwayat-donasi-list");
    if (!el) return;
    const list = db("zchain_donasi").filter(d => penggunaAktif && d.email === penggunaAktif.email).reverse();
    if (!list.length) { el.innerHTML = emptyState("📭","Belum ada riwayat donasi."); return; }
    el.innerHTML = list.map(d => `
      <div class="list-card">
        <div class="list-card-header">
          <span class="badge-jenis">${d.jenis}</span>
          <span class="list-card-time">${d.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Gross</span><strong>Rp ${fmt(d.nominal)}</strong></div>
          <div class="list-row"><span>Fee Platform (0.5%)</span><span class="text-danger">− Rp ${fmt(d.fee)}</span></div>
          <div class="list-row"><span>Net Disalurkan</span><strong class="text-success">Rp ${fmt(d.net)}</strong></div>
          <div class="list-row"><span>Metode</span><span>${d.metode}</span></div>
        </div>
        <div class="hash-code" style="margin-top:9px">${d.id}</div>
      </div>`).join("");
}

function refreshTracking() {
    const donasi  = db("zchain_donasi");
    const qardhul = db("zchain_qardhul");
    const masuk   = donasi.reduce((a,d)=>a+d.net, 0);
    const keluar  = qardhul.filter(q=>q.status==="disetujui").reduce((a,q)=>a+q.nominal,0);
    const ret     = getNum("zchain_return");
    setText("track-masuk",  "Rp "+fmt(masuk));
    setText("track-keluar", "Rp "+fmt(keluar));
    setText("track-return", "Rp "+fmt(ret));

    const el = document.getElementById("dampak-publik-list");
    if (!el) return;
    const laporan = db("zchain_laporan").slice().reverse();
    if (!laporan.length) { el.innerHTML = emptyState("","Belum ada laporan dampak."); return; }
    el.innerHTML = laporan.map(l=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="badge-jenis badge-dampak">Laporan Panen</span>
          <span class="list-card-time">${l.waktu}</span>
        </div>
        <p style="font-size:0.86rem;margin:6px 0;color:var(--text)">${l.deskripsi}</p>
        <div class="list-card-body">
          <div class="list-row"><span>Tonase</span><strong>${l.tonase} Kg</strong></div>
          <div class="list-row"><span>Pendapatan Bersih</span><strong class="text-success">Rp ${fmt(l.pendapatan)}</strong></div>
          <div class="list-row"><span>Zakat Return ke Pool</span><strong class="text-warning">Rp ${fmt(l.zakat)}</strong></div>
        </div>
      </div>`).join("");
}

// ============================================================
// RENDER — MUSTAHIK
// ============================================================
function renderStatusPengajuan() {
    const el = document.getElementById("status-pengajuan-list");
    if (!el) return;
    const list = db("zchain_qardhul")
        .filter(q => penggunaAktif && q.email === penggunaAktif.email)
        .reverse();
    if (!list.length) { el.innerHTML = emptyState("📬","Belum ada pengajuan yang tercatat."); return; }
    el.innerHTML = list.map(q=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="status-badge status-${q.status}">${labelStatus(q.status)}</span>
          <span class="list-card-time">${q.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Kluster Usaha</span><strong>${q.kerja}</strong></div>
          <div class="list-row"><span>Nominal Diajukan</span><strong>Rp ${fmt(q.nominal)}</strong></div>
          <div class="list-row"><span>Rencana</span><span>${q.deskripsi}</span></div>
          <div class="list-row"><span>NIK (Disamarkan)</span><span style="font-family:monospace;font-size:0.78rem">${q.maskedNIK}</span></div>
        </div>
        ${q.status==="disetujui" ? `<div class="info-alert" style="margin-top:10px">✅ Modal telah dicairkan. Gunakan dengan amanah.</div>` : ""}
        ${q.status==="ditolak"   ? `<div class="info-tip"  style="margin-top:10px;border-color:var(--danger);background:var(--danger-soft)">❌ Pengajuan ditolak. Silakan ajukan ulang dengan data yang benar.</div>` : ""}
      </div>`).join("");
}

// ============================================================
// RENDER — ADMIN
// ============================================================
function refreshAdmin() {
    const users   = db("zchain_users");
    const donasi  = db("zchain_donasi");
    const qardhul = db("zchain_qardhul");
    const totalDonasi    = donasi.reduce((a,d)=>a+d.net,0);
    const totalDisalurkan = getNum("zchain_disalurkan");
    const pending = qardhul.filter(q=>q.status==="menunggu").length;

    setText("admin-stat-users",     users.length);
    setText("admin-stat-donasi",    "Rp "+fmt(totalDonasi));
    setText("admin-stat-pending",   pending);
    setText("admin-stat-disalurkan","Rp "+fmt(totalDisalurkan));

    // activity log
    const all = [
        ...donasi.map(d=>({ waktu:d.waktu, teks:"💰 Donasi "+d.jenis+" Rp "+fmt(d.nominal)+" dari "+d.nama })),
        ...qardhul.map(q=>({ waktu:q.waktu, teks:"🌾 Pengajuan Rp "+fmt(q.nominal)+" dari "+q.nama+" ["+q.status+"]" }))
    ].reverse().slice(0,10);
    const el = document.getElementById("admin-activity-log");
    if (el) el.innerHTML = all.length
        ? all.map(a=>`<div class="activity-item"><span class="activity-time">${a.waktu}</span><span>${a.teks}</span></div>`).join("")
        : emptyState("","Belum ada aktivitas.");

    renderAntreanAdmin();
    renderRekapDonasi();
    renderAdminLaporan();
}

function renderAntreanAdmin() {
    const el = document.getElementById("antrian-list");
    if (!el) return;
    const list = db("zchain_qardhul").filter(q=>q.status==="menunggu");
    if (!list.length) { el.innerHTML = emptyState("✅","Tidak ada antrean. Semua permohonan telah diproses."); return; }
    el.innerHTML = list.map(q=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="status-badge status-menunggu">⏳ Menunggu Verifikasi</span>
          <span class="list-card-time">${q.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Nama Mustahik</span><strong>${q.nama}</strong></div>
          <div class="list-row"><span>NIK (Disamarkan)</span><span style="font-family:monospace;font-size:0.78rem">${q.maskedNIK}</span></div>
          <div class="list-row"><span>Kluster Usaha</span><strong>${q.kerja}</strong></div>
          <div class="list-row"><span>Nominal Diajukan</span><strong>Rp ${fmt(q.nominal)}</strong></div>
          <div class="list-row"><span>Rencana</span><span>${q.deskripsi}</span></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn btn-success btn-sm" onclick="prosesQardhul('${q.id}','disetujui')">✅ Setujui & Cairkan</button>
          <button class="btn btn-danger  btn-sm" onclick="prosesQardhul('${q.id}','ditolak')">❌ Tolak Pengajuan</button>
        </div>
      </div>`).join("");
}

function prosesQardhul(txId, keputusan) {
    const list = db("zchain_qardhul");
    const idx  = list.findIndex(q=>q.id===txId);
    if (idx<0) return;
    const q = list[idx];

    if (keputusan==="disetujui") {
        const pool = getNum("zchain_pool");
        if (q.nominal > pool) { toast("Saldo Pool tidak mencukupi!","danger"); return; }
        setNum("zchain_pool",      pool - q.nominal);
        setNum("zchain_disalurkan", getNum("zchain_disalurkan") + q.nominal);
        syncPoolDisplays();
        toast("✅ " + q.nama + " DISETUJUI. Rp " + fmt(q.nominal) + " dicairkan!","success");
        log("admin","SMART CONTRACT","Approved Rp "+fmt(q.nominal)+" ke ["+q.maskedWallet+"]. Kluster: "+q.kerja+". No riba.","success");
    } else {
        toast("❌ Pengajuan " + q.nama + " DITOLAK.","danger");
        log("admin","ADMIN DECISION","Pengajuan "+q.nama+" ("+q.kerja+") ditolak.","warning");
    }

    list[idx].status = keputusan;
    save("zchain_qardhul", list);
    renderAntreanAdmin();
    refreshAdmin();
}

function renderRekapDonasi() {
    const el = document.getElementById("admin-donasi-list");
    if (!el) return;
    const list = db("zchain_donasi").slice().reverse();
    if (!list.length) { el.innerHTML = emptyState("","Belum ada donasi."); return; }
    el.innerHTML = list.map(d=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="badge-jenis">${d.jenis}</span>
          <span class="list-card-time">${d.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Donatur</span><strong>${d.nama}</strong></div>
          <div class="list-row"><span>Gross</span><strong>Rp ${fmt(d.nominal)}</strong></div>
          <div class="list-row"><span>Fee (0.5%)</span><span class="text-danger">Rp ${fmt(d.fee)}</span></div>
          <div class="list-row"><span>Net</span><strong class="text-success">Rp ${fmt(d.net)}</strong></div>
          <div class="list-row"><span>Metode</span><span>${d.metode}</span></div>
        </div>
        <div class="hash-code" style="margin-top:9px">${d.id}</div>
      </div>`).join("");
}

function renderAdminLaporan() {
    const el = document.getElementById("admin-laporan-list");
    if (!el) return;
    const list = db("zchain_laporan").slice().reverse();
    if (!list.length) { el.innerHTML = emptyState("","Belum ada laporan dampak."); return; }
    el.innerHTML = list.map(l=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="badge-jenis badge-dampak">Impact Report</span>
          <span class="list-card-time">${l.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Mustahik</span><strong>${l.nama}</strong></div>
          <div class="list-row"><span>Laporan</span><span>${l.deskripsi}</span></div>
          <div class="list-row"><span>Tonase</span><strong>${l.tonase} Kg</strong></div>
          <div class="list-row"><span>Pendapatan</span><strong class="text-success">Rp ${fmt(l.pendapatan)}</strong></div>
          <div class="list-row"><span>Zakat Return (2.5%)</span><strong class="text-warning">Rp ${fmt(l.zakat)}</strong></div>
        </div>
      </div>`).join("");
}

// ============================================================
// RENDER — MITRA
// ============================================================
function refreshMitra() {
    const laporan = db("zchain_laporan");
    const tonase  = laporan.reduce((a,l)=>a+(l.tonase||0),0);
    const pend    = laporan.reduce((a,l)=>a+l.pendapatan,0);
    const zakat   = laporan.reduce((a,l)=>a+l.zakat,0);

    setText("mitra-stat-laporan",    laporan.length);
    setText("mitra-stat-tonase",     tonase+" Kg");
    setText("mitra-stat-pendapatan", "Rp "+fmt(pend));
    setText("mitra-stat-zakat",      "Rp "+fmt(zakat));

    renderBarChart(laporan);
    renderMitraMustahik();
    renderMitraZakat();
}

function renderBarChart(laporan) {
    const el = document.getElementById("chart-container");
    if (!el) return;
    if (!laporan.length) {
        el.innerHTML = `<div id="chart-empty" class="empty-state"><p>Grafik muncul setelah mustahik mengirim laporan pertama.</p></div>`;
        return;
    }
    const maxT = Math.max(...laporan.map(l=>l.tonase||0), 1);
    const bars = laporan.slice(-8).map((l,i)=>{
        const pct = Math.round(((l.tonase||0)/maxT)*100);
        const hue = 155 + i*18;
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;min-width:0">
          <span style="font-size:0.65rem;color:var(--muted);font-weight:700">${l.tonase||0} Kg</span>
          <div style="width:100%;background:#e2e8f0;border-radius:4px 4px 0 0;height:130px;display:flex;align-items:flex-end">
            <div style="width:100%;height:${pct}%;background:hsl(${hue},58%,42%);border-radius:4px 4px 0 0;transition:height 0.4s ease"></div>
          </div>
          <span style="font-size:0.62rem;color:var(--muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%">${l.nama.split(" ")[0]}</span>
        </div>`;
    }).join("");
    el.innerHTML = `
      <div style="display:flex;gap:8px;align-items:flex-end;padding:0 4px;height:175px">${bars}</div>
      <p style="text-align:center;font-size:0.67rem;color:var(--muted);margin-top:8px">Tonase Panen per Laporan (Kg)</p>`;
}

function renderMitraMustahik() {
    const el = document.getElementById("mitra-mustahik-list");
    if (!el) return;
    const list = db("zchain_qardhul").filter(q=>q.status==="disetujui");
    if (!list.length) { el.innerHTML = emptyState("","Belum ada mustahik yang menerima penyaluran modal."); return; }
    el.innerHTML = list.map(q=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="status-badge status-disetujui">✅ Modal Diterima</span>
          <span class="list-card-time">${q.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Nama</span><strong>${q.nama}</strong></div>
          <div class="list-row"><span>Kluster</span><strong>${q.kerja}</strong></div>
          <div class="list-row"><span>Modal</span><strong class="text-success">Rp ${fmt(q.nominal)}</strong></div>
          <div class="list-row"><span>Rencana</span><span>${q.deskripsi}</span></div>
          <div class="list-row"><span>Wallet Anonim</span><span style="font-family:monospace;font-size:0.76rem">${q.maskedWallet}</span></div>
        </div>
      </div>`).join("");
}

function renderMitraZakat() {
    const el = document.getElementById("mitra-zakat-list");
    if (!el) return;
    const list = db("zchain_laporan").slice().reverse();
    if (!list.length) { el.innerHTML = emptyState("","Belum ada data zakat return."); return; }
    el.innerHTML = list.map(l=>`
      <div class="list-card">
        <div class="list-card-header">
          <span class="badge-jenis" style="background:var(--warning-soft);color:#92400e;border-color:rgba(217,119,6,0.3)">♻️ Zakat Return</span>
          <span class="list-card-time">${l.waktu}</span>
        </div>
        <div class="list-card-body">
          <div class="list-row"><span>Mustahik</span><strong>${l.nama}</strong></div>
          <div class="list-row"><span>Sumber</span><span>${l.deskripsi}</span></div>
          <div class="list-row"><span>Pendapatan Usaha</span><strong>Rp ${fmt(l.pendapatan)}</strong></div>
          <div class="list-row"><span>Zakat Return (2.5%)</span><strong class="text-warning">Rp ${fmt(l.zakat)}</strong></div>
          <div class="list-row"><span>Status</span><span class="status-badge status-disetujui">✅ Tersalurkan ke Pool</span></div>
        </div>
      </div>`).join("");
}

// ============================================================
// UTILS
// ============================================================
function syncPoolDisplays() {
    const val = "Rp " + fmt(getNum("zchain_pool"));
    ["pool-donatur","pool-mustahik","pool-admin","pool-mitra"].forEach(id=>setText(id,val));
}
function labelStatus(s) {
    return {menunggu:"⏳ Menunggu Verifikasi", disetujui:"✅ Disetujui", ditolak:"❌ Ditolak"}[s]||s;
}
function emptyState(icon,msg) {
    return `<div class="empty-state">${icon?`<span style="font-size:2rem">${icon}</span>`:""}<p>${msg}</p></div>`;
}
function genHash() {
    return "0x" + [...Array(40)].map(()=>Math.floor(Math.random()*16).toString(16)).join("");
}
function rndHex(n) {
    return [...Array(n)].map(()=>Math.floor(Math.random()*16).toString(16)).join("");
}
function fmt(n) { return (n||0).toLocaleString("id-ID"); }
function now()  { return new Date().toLocaleString("id-ID"); }
function v(id)  { return document.getElementById(id)?.value||""; }
function setText(id,val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function db(key)         { try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return[]} }
function save(key,val)   { localStorage.setItem(key, JSON.stringify(val)); }
function getNum(key)     { return parseFloat(localStorage.getItem(key)||"0")||0; }
function setNum(key,val) { localStorage.setItem(key, val.toString()); }

function log(target, module, text, type="system") {
    const map = { donatur:"logs-donatur", mustahik:"logs-mustahik", admin:"logs-admin", mitra:"logs-mitra" };
    const ids = target==="all" ? Object.values(map) : (map[target] ? [map[target]] : []);
    ids.forEach(cid=>{
        const c=document.getElementById(cid);
        if(!c) return;
        const el=document.createElement("div");
        el.className="log-entry "+type;
        el.textContent="["+new Date().toLocaleTimeString()+"] ["+module+"]: "+text;
        c.appendChild(el);
        c.scrollTop=c.scrollHeight;
    });
}

function toast(msg, type="primary") {
    const c=document.getElementById("notification-container");
    const t=document.createElement("div");
    t.className="toast "+type;
    t.textContent=msg;
    c.appendChild(t);
    setTimeout(()=>{ t.style.animation="slideIn 0.3s ease reverse forwards"; setTimeout(()=>t.remove(),300); },4000);
}