// SIMULASI DATABASE LOKAL MENGGUNAKAN LOCALSTORAGE
// Jika data kosong di awal, buat akun dummy default untuk testing
if (!localStorage.getItem("users_db")) {
    const defaultUsers = [
        { email: "donatur@zchain.com", password: "password123", nama: "Muzaki Aceh" }
    ];
    localStorage.setItem("users_db", JSON.stringify(defaultUsers));
}

// Simulasi status koneksi blockchain
let isBlockchainConnected = true; 

document.addEventListener("DOMContentLoaded", () => {
    simulasikanCekKoneksi();
});

// Menjalankan pengecekan status server blockchain di awal layar (Aman & Lancar)
function simulasikanCekKoneksi() {
    const spinner = document.getElementById("connection-spinner");
    const statusText = document.getElementById("connection-status-text");
    const errorActions = document.getElementById("connection-error-actions");

    spinner.classList.remove("hidden");
    errorActions.classList.add("hidden");
    statusText.innerText = "Memeriksa koneksi ke Server Blockchain...";

    // Menggunakan delay 1.5 detik langsung pindah tanpa halangan API eksternal
    setTimeout(() => {
        if (isBlockchainConnected) {
            spinner.classList.add("hidden");
            showScreen("auth-screen");
            showToast("System/API: Terhubung ke Jaringan Polygon Mainnet.", "success");
        } else {
            spinner.classList.add("hidden");
            statusText.innerText = "";
            errorActions.classList.remove("hidden");
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

// --- AKSI REGISTER MENGGUNAKAN LOCALSTORAGE ---
function handleRegister(e) {
    e.preventDefault();
    const nama = document.getElementById("reg-nama").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const hp = document.getElementById("reg-hp").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    if(!nama || !email || !hp || !password) {
        showToast("Validasi Gagal: Field input tidak boleh kosong!", "danger");
        return;
    }

    let currentUsers = JSON.parse(localStorage.getItem("users_db"));

    // Cek apakah email sudah terdaftar di localstorage
    const isExist = currentUsers.some(user => user.email === email);
    if (isExist) {
        showToast("Error: Email sudah dipakai pengguna lain!", "warning");
        return;
    }

    // Simpan user baru
    currentUsers.push({ nama, email, hp, password });
    localStorage.setItem("users_db", JSON.stringify(currentUsers));

    showToast("Akun Berhasil Dibuat! Silakan masuk menggunakan email tersebut.", "success");
    switchAuthTab('login');
}

// --- AKSI VALIDASI LOGIN MENGGUNAKAN LOCALSTORAGE ---
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if(!email || !password) {
        showToast("Validasi Gagal: Email & Password harus diisi!", "danger");
        return;
    }

    const currentUsers = JSON.parse(localStorage.getItem("users_db"));

    // Cari user yang cocok
    const userFound = currentUsers.find(user => user.email === email && user.password === password);

    if (!userFound) {
        showToast("Login Gagal: Kombinasi Email & Password salah!", "danger");
        return;
    }

    // Jika akun ditemukan, masuk ke dashboard utama
    showToast(`Berhasil Masuk! Selamat Datang ${userFound.nama}`, "success");
    document.getElementById("logged-user-name").innerText = userFound.nama;
    showScreen("dashboard-screen");
}

function switchTab(tabId) {
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(`tab-${tabId}-content`).classList.add("active");
}

// --- ALUR SIMULASI DONASI ---
function handleDonation(e) {
    e.preventDefault();
    const jenis = document.getElementById("donasi-jenis").value;
    const nominal = parseFloat(document.getElementById("donasi-nominal").value);
    const metode = document.getElementById("donasi-metode").value;

    if(isNaN(nominal) || nominal < 10000) {
        showToast("Nominal tidak valid! Minimal transaksi adalah Rp 10.000", "danger");
        return;
    }

    const feePlatform = nominal * 0.005; 
    showToast(`Menghubungkan gerbang pembayaran via ${metode.toUpperCase()}...`, "warning");

    setTimeout(() => {
        const fakeHash = "0x" + Math.random().toString(16).substr(2, 40);
        showToast(`Pembayaran Berhasil! Potongan operasional 0.5% (Rp ${feePlatform}) dihitung otomatis.`, "success");
        showToast(`Blockchain Logged: Hash Event [donation] terekam. Hash: ${fakeHash.substring(0,14)}...`, "success");
    }, 1200);
}

// --- ALUR SIMULASI QARDHUL HASAN ---
function handleQardhul(e) {
    e.preventDefault();
    const nik = document.getElementById("qardhul-nik").value.trim();
    const kerja = document.getElementById("qardhul-kerja").value;
    const nominal = document.getElementById("qardhul-nominal").value;

    if(!nik || !nominal) {
        showToast("Data NIK & Nominal Ajuan tidak boleh kosong!", "danger");
        return;
    }

    showToast("Memproses verifikasi data kependudukan ke sistem internal...", "warning");

    setTimeout(() => {
        if (nik.length < 6) {
            showToast("Verifikasi Gagal: Format NIK salah atau tidak terdata!", "danger");
        } else {
            showToast(`Sistem: Berhasil memvalidasi status pekerjaan sebagai ${kerja.toUpperCase()}.`, "success");
            showToast(`Penyaluran Disetujui! Transaksi modal dicatat secara anonim di jaringan smart contract.`, "success");
        }
    }, 1200);
}

// --- ALUR LAPORAN DAMPAK ---
function handleImpactReport(e) {
    e.preventDefault();
    const hasilPanen = document.getElementById("report-panen").value.trim();
    const isZakatReturnChecked = document.getElementById("report-zakat-return").checked;

    if(!hasilPanen) {
        showToast("Input hasil panen wajib diisi!", "danger");
        return;
    }

    showToast("Mengirimkan pembaruan laporan dampak usaha...", "warning");

    setTimeout(() => {
        const reportHash = "0x" + Math.random().toString(16).substr(2, 40);
        showToast(`Laporan dampak terbit! Log Hash [impact_report]: ${reportHash.substring(0,12)}...`, "success");
        
        if(isZakatReturnChecked) {
            showToast("Siklus Berkelanjutan: 2.5% potongan keuntungan bersih dialihkan kembali ke Pool Dana Abadi.", "success");
        }
    }, 1200);
}

function handleLogout() {
    showToast("Anda telah keluar dari sistem.", "warning");
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