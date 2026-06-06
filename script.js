// INITIALIZE DATABASE EMULATION TO LOCALSTORAGE
if (!localStorage.getItem("zchain_users")) {
    const database_users = [
        { email: "donatur@zchain.com", password: "password123", nama: "Muzaki Atjeh" }
    ];
    localStorage.setItem("zchain_users", JSON.stringify(database_users));
}
if (!localStorage.getItem("zchain_pool")) {
    localStorage.setItem("zchain_pool", "128500000"); 
}

let isBlockchainConnected = true;
let namaPenggunaAktif = "Muzaki Atjeh";

document.addEventListener("DOMContentLoaded", () => {
    updatePoolDisplay();
    simulasikanCekKoneksi();
    hitungKalkulasiDonasi();
    hitungZakatUsaha();
});

function simulasikanCekKoneksi() {
    const spinner = document.getElementById("connection-spinner");
    const statusText = document.getElementById("connection-status-text");
    const errorActions = document.getElementById("connection-error-actions");

    spinner.classList.remove("hidden");
    errorActions.classList.add("hidden");
    statusText.innerText = "Membuka enkripsi & memverifikasi node Polygon RPC...";

    setTimeout(() => {
        if (isBlockchainConnected) {
            spinner.classList.add("hidden");
            showScreen("auth-screen");
            pushLog("SYSTEM", "Koneksi sukses terkoneksi ke Jaringan Polygon Mainnet RPC Node. Smart Contract verified.", "success");
            showToast("System/API: Node Blockchain Siap Dioperasikan.", "success");
        } else {
            spinner.classList.add("hidden");
            statusText.innerText = "";
            errorActions.classList.remove("hidden");
            pushLog("SYSTEM", "CRITICAL ERROR: Koneksi node RPC terputus.", "danger");
        }
    }, 1500);
}

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

function switchAuthTab(type) {
    document.getElementById("tab-login").classList.remove("active");
    document.getElementById("tab-register").classList.remove("active");
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.add("hidden");

    if(type === 'login') {
        document.getElementById("tab-login").classList.add("active");
        document.getElementById("login-form").classList.remove("hidden");
    } else {
        document.getElementById("tab-register").classList.add("active");
        document.getElementById("register-form").classList.remove("hidden");
    }
}

function handleRegister(e) {
    e.preventDefault();
    const nama = document.getElementById("reg-nama").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const hp = document.getElementById("reg-hp").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    let users = JSON.parse(localStorage.getItem("zchain_users"));
    if (users.some(u => u.email === email)) {
        showToast("Registrasi Gagal: Email ini sudah terdaftar!", "danger");
        pushLog("VALIDASI DB", `Gagal mendaftarkan email ${email} (Sudah ada di database public.users_login)`, "warning");
        return;
    }

    users.push({ nama, email, hp, password });
    localStorage.setItem("zchain_users", JSON.stringify(users));
    
    showToast("Akun Berhasil Didaftarkan!", "success");
    pushLog("DATABASE LAYER", `Tabel public.users_login sukses mencatat baris entitas baru untuk: ${nama}`, "success");
    switchAuthTab('login');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const users = JSON.parse(localStorage.getItem("zchain_users"));
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showToast("Login Gagal: Email atau password salah!", "danger");
        pushLog("AUTH EXCEPTION", `Gagal otentikasi login untuk alamat email: ${email}`, "warning");
        return;
    }

    namaPenggunaAktif = user.nama;
    showToast(`Selamat Datang, ${user.nama}!`, "success");
    pushLog("AUTH CORE", `Akses disetujui untuk ${user.nama}. Session token terekam.`, "success");
    document.getElementById("logged-user-name").innerText = user.nama;
    showScreen("dashboard-screen");
}

function hitungKalkulasiDonasi() {
    const nominal = parseFloat(document.getElementById("donasi-nominal").value) || 0;
    const fee = nominal * 0.005; 
    const net = nominal - fee;

    document.getElementById("calc-kotor").innerText = "Rp " + nominal.toLocaleString("id-ID");
    document.getElementById("calc-fee").innerText = "Rp " + fee.toLocaleString("id-ID");
    document.getElementById("calc-net").innerText = "Rp " + net.toLocaleString("id-ID");
}

function hitungZakatUsaha() {
    const pendapatan = parseFloat(document.getElementById("report-pendapatan").value) || 0;
    const zakatReturn = pendapatan * 0.025; 

    document.getElementById("calc-zakat-return").innerText = "Rp " + zakatReturn.toLocaleString("id-ID");
}

function switchTab(tabId) {
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(`tab-${tabId}-content`).classList.add("active");
    pushLog("UI INTERACTION", `Navigasi dialihkan ke Tab: ${tabId.toUpperCase()}`, "system");
}

function handleDonation(e) {
    e.preventDefault();
    const jenis = document.getElementById("donasi-jenis").value;
    const nominal = parseFloat(document.getElementById("donasi-nominal").value);
    const metode = document.getElementById("donasi-metode").value;

    if (nominal < 10000) {
        showToast("Kesalahan: Minimal nominal kontribusi adalah Rp 10.000", "danger");
        return;
    }

    const fee = nominal * 0.005;
    const net = nominal - fee;

    let currentPool = parseFloat(localStorage.getItem("zchain_pool"));
    localStorage.setItem("zchain_pool", (currentPool + net).toString());
    updatePoolDisplay();

    const txHash = "0x" + [...Array(40)].map(() => Math.floor(Math.random()*16).toString(16)).join("");
    const waktuSkrg = new Date().toLocaleString("id-ID");

    showToast("Transaksi Berhasil! Hash Terekam on-chain.", "success");
    
    document.getElementById("receipt-placeholder-text").classList.add("hidden");
    document.getElementById("receipt-real-content").classList.remove("hidden");
    
    document.getElementById("rec-time").innerText = waktuSkrg;
    document.getElementById("rec-nama").innerText = namaPenggunaAktif;
    document.getElementById("rec-jenis").innerText = jenis;
    document.getElementById("rec-metode").innerText = metode;
    document.getElementById("rec-gross").innerText = "Rp " + nominal.toLocaleString("id-ID");
    document.getElementById("rec-fee").innerText = "Rp " + fee.toLocaleString("id-ID");
    document.getElementById("rec-net").innerText = "Rp " + net.toLocaleString("id-ID");
    document.getElementById("rec-hash").innerText = txHash;

    pushLog("SMART CONTRACT CALL", `Event [donation] triggered via ${metode}. Gross: Rp ${nominal.toLocaleString()}. Net: Rp ${net.toLocaleString()}. Fee: Rp ${fee.toLocaleString()}`, "success");
    pushLog("BLOCKCHAIN LOG", `Block #3829411 Mined & Confirmed. Transaction Hash: ${txHash}`, "success");
}

function handleQardhul(e) {
    e.preventDefault();
    const nik = document.getElementById("qardhul-nik").value.trim();
    const kerja = document.getElementById("qardhul-kerja").value;
    const nominal = parseFloat(document.getElementById("qardhul-nominal").value);

    if (nik.length !== 16 || isNaN(nik)) {
        showToast("Error: Format NIK Aceh tidak valid (Wajib 16 digit angka)!", "danger");
        pushLog("VERIFICATION SYSTEM", "Rejection: NIK gagal memvalidasi data kependudukan Capil.", "warning");
        return;
    }

    if (nominal > 10000000 || nominal <= 0) {
        showToast("Error: Batas maksimal pengajuan adalah Rp 10.000.000", "danger");
        return;
    }

    let currentPool = parseFloat(localStorage.getItem("zchain_pool"));
    if (nominal > currentPool) {
        showToast("Maaf, saldo Pool Dana Abadi sistem sedang tidak mencukupi.", "danger");
        return;
    }

    localStorage.setItem("zchain_pool", (currentPool - nominal).toString());
    updatePoolDisplay();

    showToast("Penyaluran Qardhul Hasan Disetujui!", "success");
    const anonymousWallet = "0x" + Math.random().toString(16).substr(2, 6) + "..." + Math.random().toString(16).substr(2, 4);
    pushLog("BACKEND SYSTEM", `NIK ${nik.substring(0,6)}********** terverifikasi bekerja sebagai kluster [${kerja}]. Status: LOLOS.`, "success");
    pushLog("SMART CONTRACT CALL", `Penyaluran modal approved on-chain. Disbursed Rp ${nominal.toLocaleString()} to masked address [${anonymousWallet}]. No interest / Riba applied.`, "success");
}

function handleImpactReport(e) {
    e.preventDefault();
    const deskripsi = document.getElementById("report-panen").value.trim();
    const pendapatan = parseFloat(document.getElementById("report-pendapatan").value);
    const zakatReturn = pendapatan * 0.025;

    let currentPool = parseFloat(localStorage.getItem("zchain_pool"));
    localStorage.setItem("zchain_pool", (currentPool + zakatReturn).toString());
    updatePoolDisplay();

    showToast("Laporan Berhasil Dipublikasikan!", "success");
    pushLog("IMPACT REPORT SERVICE", `Mustahik submit laporan: "${deskripsi}"`, "success");
    pushLog("BLOCKCHAIN LOG", `Automated Event [zakat_return] executed. Keuntungan Rp ${pendapatan.toLocaleString()} dipotong 2.5% (Rp ${zakatReturn.toLocaleString()}) dialirkan kembali masuk ke Pool Abadi Z-Chain. Siklus Berkelanjutan tercatat on-chain.`, "warning");
}

function updatePoolDisplay() {
    const current = parseFloat(localStorage.getItem("zchain_pool"));
    document.getElementById("pool-dana-abadi").innerText = "Rp " + current.toLocaleString("id-ID");
}

function pushLog(module, text, type = "system") {
    const container = document.getElementById("logs-container");
    const el = document.createElement("div");
    const now = new Date().toLocaleTimeString();
    el.className = `log-entry ${type}`;
    el.innerText = `[${now}] [${module}]: ${text}`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight; 
}

function handleLogout() {
    showToast("Keamanan: Anda telah logged out.", "warning");
    showScreen("auth-screen");
}

function showToast(message, type = "primary") {
    const container = document.getElementById("notification-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}