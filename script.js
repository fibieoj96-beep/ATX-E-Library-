// ==========================================
// 1. CONFIGURATION & DATA INITIALIZATION
// ==========================================
const MASTER_KEY = "ATX_ADMIN_2026";
const LIMITS = { "Reading Room": 5, "Discussion Room": 2, "Computer Zone": 10 };

let users = JSON.parse(localStorage.getItem('atx_users')) || [];
let bookings = JSON.parse(localStorage.getItem('atx_bookings')) || [];
let session = null;
let currentLang = localStorage.getItem('atx_lang') || 'ms';
let bruteStream = null;
let bruteLoop = null;

const translations = {
    ms: {
        login_title: "LOG MASUK",
        student_id: "No. Matrik",
        password: "Kata Laluan",
        signin_btn: "MASUK",
        new_here: "Baru di sini?",
        register_link: "Daftar",
        reg_title: "CIPTA AKAUN",
        role: "Peranan",
        student: "Pelajar",
        admin: "Admin",
        full_name: "Nama Penuh",
        register_btn: "DAFTAR SEKARANG",
        back_to_login: "← Kembali",
        options: "PILIHAN",
        profile: "Profil Saya",
        settings: "Tetapan",
        logout: "Log Keluar",
        dashboard_title: "Papan Pemuka",
        admin_panel: "PANEL ADMIN",
        scanner_title: "PENGESAHAN KEHADIRAN (QR)",
        open_cam: "BUKA KAMERA SCANNER",
        close_cam: "TUTUP KAMERA",
        reading: "BACAAN",
        discussion: "DISKUSI",
        computer: "KOMPUTER",
        active_student_sessions: "Sesi Pelajar Aktif",
        history_ended: "SEJARAH SESI (TAMAT)",
        my_active_bookings: "TEMPAHAN AKTIF SAYA",
        booking_history: "SEJARAH TEMPAHAN",
        info_college: "INFO & PROGRAM KOLEJ",
        new_books: "Buku Baru",
        books_desc: "Digital Tech 2026 di Rak A1.",
        literacy: "Literasi",
        workshop_desc: "Bengkel pada 20 April.",
        qr_modal_title: "KOD QR TEMPAHAN",
        close: "TUTUP",
        archive: "ARKIB REKOD",
        change_photo: "TUKAR GAMBAR",
        dark_mode: "Mod Gelap",
        app_language: "Bahasa Aplikasi",
        update_name: "KEMASKINI NAMA",
        change_password: "TUKAR KATA LALUAN",
        make_booking: "BUAT TEMPAHAN",
        confirm_booking: "SAHKAN TEMPAHAN",
        // --- TAMBAHAN UNTUK FIX BLANK INPUTS ---
        choose_room: "Pilih Bilik",
        reading_room: "Bilik Bacaan",
        discussion_room: "Bilik Diskusi",
        comp_zone: "Zon Komputer",
        booking_date: "Tarikh Tempahan",
        start_time: "Masa Mula",
        end_time: "Masa Tamat"
    },
    en: {
        login_title: "LOGIN",
        student_id: "Student ID",
        password: "Password",
        signin_btn: "SIGN IN",
        new_here: "New Here?",
        register_link: "Register",
        reg_title: "CREATE ACCOUNT",
        role: "Role",
        student: "Student",
        admin: "Admin",
        full_name: "Full Name",
        register_btn: "REGISTER NOW",
        back_to_login: "← Back",
        options: "OPTIONS",
        profile: "My Profile",
        settings: "Settings",
        logout: "Logout",
        dashboard_title: "Dashboard",
        admin_panel: "ADMIN PANEL",
        scanner_title: "ATTENDANCE VERIFICATION (QR)",
        open_cam: "OPEN SCANNER CAMERA",
        close_cam: "CLOSE CAMERA",
        reading: "READING",
        discussion: "DISCUSSION",
        computer: "COMPUTER",
        active_student_sessions: "Active Student Sessions",
        history_ended: "SESSION HISTORY (ENDED)",
        my_active_bookings: "MY ACTIVE BOOKINGS",
        booking_history: "BOOKING HISTORY",
        info_college: "INFO & COLLEGE PROGRAMS",
        new_books: "New Books",
        books_desc: "Digital Tech 2026 at Shelf A1.",
        literacy: "Literacy",
        workshop_desc: "Workshop on April 20th.",
        qr_modal_title: "BOOKING QR CODE",
        close: "CLOSE",
        archive: "RECORD ARCHIVE",
        change_photo: "CHANGE PHOTO",
        dark_mode: "Dark Mode",
        app_language: "App Language",
        update_name: "UPDATE NAME",
        change_password: "CHANGE PASSWORD",
        make_booking: "MAKE A BOOKING",
        confirm_booking: "CONFIRM BOOKING",
        // --- TAMBAHAN UNTUK FIX BLANK INPUTS ---
        choose_room: "Choose Room",
        reading_room: "Reading Room",
        discussion_room: "Discussion Room",
        comp_zone: "Computer Zone",
        booking_date: "Booking Date",
        start_time: "Start Time",
        end_time: "End Time"
    }
};



// ==========================================
// 2. CORE ENGINE: RENDER DATA (CLEAN UI)
// ==========================================
function renderData() {
    if(!session) return;
    const t = translations[currentLang];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const curT = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('welcome').innerText = (t.welcome_prefix || "Hai, ") + session.name;

    // --- 14. TUKAR GAMBAR (PROFILE PHOTO) ---
    const userDB = users.find(u => u.matrik === session.matrik);
    const profDisplay = document.getElementById('profile-display');
    if(profDisplay) {
        profDisplay.innerHTML = (userDB && userDB.photo) 
            ? `<img src="${userDB.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` 
            : `<div style="width:100%; height:100%; background:#eee; border-radius:50%; border:1px solid #ddd;"></div>`;
    }

// --- GANTI DALAM RENDERDATA() BAHAGIAN STUDENT VIEW SAHAJA ---

    if (session.role === 'user') {
        // ==========================================
        // STUDENT VIEW (NEWEST ON TOP)
        // ==========================================
        const myAll = bookings.filter(b => b.matrik === session.matrik);
        
        // 1. Ambil yang Aktif & Susun (Terbaru di atas)
        const active = myAll.filter(b => 
            b.status === 'pending' || 
            (b.status === 'approved' && (b.date > today || (b.date === today && b.end > curT)))
        ).sort((a, b) => b.id - a.id); // <--- Sorting terbaru atas

        // 2. Ambil History & Susun (Terbaru di atas)
        const history = myAll.filter(b => 
            b.status === 'rejected' || 
            b.status === 'ended' || 
            (b.status === 'approved' && (b.date < today || (b.date === today && b.end <= curT)))
        ).sort((a, b) => b.id - a.id); // <--- Sorting terbaru atas

        document.getElementById('countMy').innerText = active.length;

        // Render Active List
        document.getElementById('myList').innerHTML = active.map(b => {
            const color = b.status === 'approved' ? '#28a745' : '#ffc107';
            return `
            <div class="card" style="border-left: 6px solid ${color}; margin-bottom:12px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--primary); font-size:14px;">${b.type}</strong><br>
                        <small style="font-weight:bold; color:var(--accent); display:block; margin:4px 0;">Tarikh: ${b.date}</small>
                        <small style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px;">Masa: ${b.start} - ${b.end}</small>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="showQR(${b.id})" style="border:1px solid var(--accent); background:none; padding:5px 10px; border-radius:5px; font-size:11px; color:var(--accent); font-weight:bold;">QR</button>
                        <button onclick="deleteBooking(${b.id})" style="color:#dc3545; border:1px solid #dc3545; background:none; padding:5px 10px; border-radius:5px; font-weight:bold; font-size:11px;">CANCEL</button>
                    </div>
                </div>
            </div>`;
        }).join('') || `<p style="text-align:center; opacity:0.6;">Tiada tempahan aktif.</p>`;

        // Render History List (Newest Top)
        const histList = document.getElementById('history-list');
        histList.innerHTML = history.map(b => {
            const sColor = b.status === 'rejected' ? '#dc3545' : '#6c757d';
            return `
            <div style="padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; opacity:0.8;">
                <div>
                    <strong>${b.type}</strong><br>
                    <small>Tarikh: ${b.date}</small><br>
                    <small style="font-weight:bold;">Masa: ${b.start} - ${b.end}</small>
                </div>
                <div style="color:${sColor}; font-size:10px; font-weight:bold; border:1.5px solid ${sColor}; padding:2px 6px; border-radius:4px; text-transform:uppercase;">${b.status}</div>
            </div>`;
        }).join('') || `<p style="text-align:center;">Tiada sejarah.</p>`;
        
        if (history.length > 0) histList.style.display = 'block';
    } else {
        // ==========================================
        // ADMIN VIEW (AUTO-END, SORTING, TIME & DATE)
        // ==========================================
        
        // 1. AUTO-END LOGIC (Optimum: Simpan skali sja kalau ada perubahan status)
        let needsSaving = false;
        bookings.forEach(b => {
            if (b.status === 'approved' && b.date === today && curT >= b.end) {
                b.status = 'ended';
                needsSaving = true;
            }
        });
        if (needsSaving) saveToLocal();

                        // 2. LOGIK BAKI BILIK (INDICATORS) - FIX MUKTAMAD
        for (let zone in LIMITS) {
            // Kita kira sesi yang status 'approved' sbg 'Occupied' (Guna Bilik)
            const occupied = bookings.filter(b => {
                // Syarat 1: Mesti status 'approved' dan tarikh hari ini
                const isApprovedToday = (b.status === 'approved' && b.date === today);
                
                // Syarat 2: Jam sekarang mesti sudah mula tapi belum tamat
                const isOngoing = (curT >= b.start && curT < b.end);

                // Syarat 3: Nama bilik mesti match (kita guna keywords sja supaya senang)
                let roomMatch = false;
                const type = b.type.toLowerCase();
                if (zone === "Reading Room" && (type.includes("reading") || type.includes("bacaan"))) roomMatch = true;
                if (zone === "Discussion Room" && (type.includes("discussion") || type.includes("diskusi"))) roomMatch = true;
                if (zone === "Computer Zone" || zone === "Computer Lab") {
                    if (type.includes("computer") || type.includes("komputer") || type.includes("zon")) roomMatch = true;
                }

                return isApprovedToday && isOngoing && roomMatch;
            }).length;

            // Cari ID Element yang betul sperti dalam HTML bos
            let elId = "";
            if (zone === "Reading Room") elId = "stat-bacaan";
            else if (zone === "Discussion Room") elId = "stat-diskusi";
            else elId = "stat-komputer";

            const el = document.getElementById(elId);
            if (el) {
                const baki = LIMITS[zone] - occupied;
                el.innerText = `${baki}/${LIMITS[zone]}`;
                
                // Kalau baki 0, kita kasi warna merah sikit biar admin perasan
                el.style.color = (baki <= 0) ? "#dc3545" : "#28a745";
                el.style.fontWeight = "bold";
            }
        }


        // 3. PENDING LIST (TERBARU DI ATAS)
        const pendingData = bookings.filter(b => b.status === 'pending').sort((a, b) => b.id - a.id);
        document.getElementById('adminTable').innerHTML = pendingData.map(b => `
            <div class="card" style="border-left: 6px solid #ffc107; display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:10px;">
                <div>
                    <strong>${b.uName}</strong><br>
                    <small>${b.type} | Tarikh: ${b.date}</small><br>
                    <small style="color:var(--accent); font-weight:bold;">Masa: ${b.start} - ${b.end}</small>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="updateStatus(${b.id}, 'approved')" style="background:#28a745; color:white; border:none; padding:8px 12px; border-radius:8px; font-size:10px; font-weight:bold;">APPROVE</button>
                    <button onclick="updateStatus(${b.id}, 'rejected')" style="background:#dc3545; color:white; border:none; padding:8px 12px; border-radius:8px; font-size:10px; font-weight:bold;">REJECT</button>
                </div>
            </div>`).join('') || '<p style="text-align:center; padding:10px; opacity:0.6;">Tiada permohonan baru.</p>';

        // 4. LIVE SESSIONS (TERBARU DI ATAS)
        const liveData = bookings.filter(b => 
            b.date === today && b.status === 'approved' && curT < b.end
        ).sort((a, b) => b.id - a.id);

        document.getElementById('live-bookings').innerHTML = liveData.map(b => `
            <div class="card" style="border-left: 6px solid #28a745; display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:10px;">
                <div style="width:10px; height:10px; background:#28a745; border-radius:50%; box-shadow:0 0 8px #28a745;"></div>
                <div>
                    <strong>${b.uName}</strong><br>
                    <small>${b.type} | Tarikh: ${b.date}</small><br>
                    <small style="font-weight:bold; color:var(--accent);">Masa: ${b.start} - ${b.end}</small>
                </div>
            </div>`).join('') || '<p style="text-align:center; opacity:0.6; padding:10px;">Tiada pelajar aktif sekarang.</p>';

        // 5. SESSION HISTORY DASHBOARD (HANYA 'ENDED' - TERBARU DI ATAS)
        const justEnded = bookings.filter(b => b.status === 'ended').sort((a, b) => b.id - a.id);
        const adminLiveHist = document.getElementById('admin-live-history');
        if(adminLiveHist) {
            adminLiveHist.innerHTML = justEnded.map(b => `
                <div style="padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${b.uName}</strong><br>
                        <small>${b.type} | Tarikh: ${b.date}</small><br>
                        <small style="color:var(--accent); font-weight:bold;">Masa: ${b.start} - ${b.end}</small>
                    </div>
                    <div style="color:#6c757d; font-size:10px; font-weight:bold; border:1px solid; padding:2px 4px; border-radius:4px;">ENDED</div>
                </div>`).join('') || '<p style="text-align:center; padding:10px; opacity:0.5;">Tiada sesi tamat.</p>';
            if(justEnded.length > 0) adminLiveHist.style.display = 'block';
        }

        // 6. RECORD ARCHIVE PANEL (APPROVED, REJECTED, ENDED & EXPIRED - TERBARU DI ATAS)
        const fullArchive = bookings.filter(b => 
            b.status === 'rejected' || 
            b.status === 'ended' || 
            (b.status === 'approved' && (b.date < today || (b.date === today && b.end <= curT)))
        ).sort((a, b) => b.id - a.id);

        const archTable = document.getElementById('adminHistoryTable');
        if(archTable) {
            archTable.innerHTML = fullArchive.map(b => {
                let sColor = '#6c757d'; 
                let sText = b.status.toUpperCase();
                if(b.status === 'rejected') sColor = '#dc3545';
                else if(b.status === 'approved') { 
                    sColor = '#28a745'; 
                    if(b.date < today || (b.date === today && b.end <= curT)) sText = "EXPIRED";
                }
                return `
                <div style="padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${b.uName}</strong><br>
                        <small>${b.type} | Tarikh: ${b.date}</small><br>
                        <small style="color:var(--accent); font-weight:bold;">Masa: ${b.start} - ${b.end}</small>
                    </div>
                    <div style="color:${sColor}; font-size:10px; font-weight:bold; border:1.5px solid ${sColor}; padding:2px 4px; border-radius:4px;">${sText}</div>
                </div>`;
            }).join('') || '<p style="text-align:center; padding:20px; opacity:0.5;">Tiada rekod arkib.</p>';
        }
    } // Penutup Admin View
}
// ==========================================
// 3. AUTH & 13. CONTAINER AUTO-EXPAND
// ==========================================
function handleLogin() {
    const u = document.getElementById('logUser').value.trim(), 
          p = document.getElementById('logPass').value;

    // 1. KOD LAMA BOS (Pintu Belakang Admin)
    if (u === "admin" && p === "123") {
        session = { name: "Administrator", matrik: "ADM-001", role: "admin", photo: null };
    } 
    else {
        // 2. KOD LAMA BOS (Cari user dalam database)
        const f = users.find(x => x.matrik === u && x.pass === p);
        if (f) {
            session = JSON.parse(JSON.stringify(f)); // Deep copy gaya bos
        } else {
            return alert("No Matrik atau Password Salah!");
        }
    }

    // 3. TRANSISI UI (Kekal kod asal bos)
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'flex';
    document.getElementById('admin-view').style.display = (session.role === 'admin' ? 'block' : 'none');
    document.getElementById('student-view').style.display = (session.role === 'user' ? 'block' : 'none');
    
    renderData(); 
    showPage('dashboard');
}

function handleSignup() {
    // Ambil input (Termasuk regPhone baru)
    const n = document.getElementById('regName').value.trim(),
          m = document.getElementById('regMatrik').value.trim(),
          p = document.getElementById('regPass').value,
          r = document.getElementById('regRole').value,
          s = document.getElementById('regSecret').value,
          ph = document.getElementById('regPhone').value.trim();

    // 1. VALIDASI (Kekal kod lama bos)
    if (!n || !p) return alert("Sila isi Nama & Password!");
    if (r === 'admin' && s !== MASTER_KEY) return alert("Master Key Salah!");
    
    // 2. LOGIK AUTO-ID (Penambahbaikan dari kod asal bos)
    const prefix = (r === 'admin' ? "ADM-" : "STU-");
    const autoID = prefix + Date.now().toString().slice(-4);
    const finalID = m || autoID; // Pakai m kalau ada, kalau kosong pakai autoID

    // 3. SIMPAN DATA (Kekal struktur asal bos + phone & photo)
    users.push({ 
        name: n, 
        matrik: finalID, 
        pass: p, 
        role: r, 
        phone: ph, 
        photo: null 
    });

    saveToLocal(); 
    alert("Pendaftaran Berjaya! ID Login: " + finalID); 
    toggleAuth();
}



function checkRole() {
    const r = document.getElementById('regRole').value;
    document.getElementById('adminKeyBox').style.display = (r === 'admin' ? 'block' : 'none');
    const mInput = document.getElementById('matrikInputGroup');
    if(mInput) mInput.style.display = (r === 'admin' ? 'none' : 'block');
}

function toggleAuth() { 
    const box = document.getElementById('authBox');
    const loginForm = document.querySelector('.login-form');
    const signupForm = document.querySelector('.signup-form');
    const forgotForm = document.querySelector('.forgot-form');

    box.classList.toggle('active');

    // 13. Auto-Expand Container height (Logic asal bos)
    if (box.classList.contains('active')) {
        box.style.maxHeight = "850px"; // Kasi tinggi sikit sbb signup banyak field
        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
        forgotForm.style.display = 'none';
    } else {
        box.style.maxHeight = "500px";
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
        forgotForm.style.display = 'none';
    }
}

// Tambahan: Fungsi untuk switch ke page Lupa Password (WhatsApp)
function toggleForgot() {
    const loginForm = document.querySelector('.login-form');
    const forgotForm = document.querySelector('.forgot-form');
    const signupForm = document.querySelector('.signup-form');

    signupForm.style.display = 'none';
    
    if (forgotForm.style.display === 'flex') {
        forgotForm.style.display = 'none';
        loginForm.style.display = 'flex';
    } else {
        loginForm.style.display = 'none';
        forgotForm.style.display = 'flex';
    }
}

// Tambahan: Fungsi hantar kod reset ke WhatsApp
function sendWhatsAppReset() {
    const phone = document.getElementById('forgotPhone').value.trim();
    const user = users.find(u => u.phone === phone);
    
    if (!user) return alert("Nombor telefon tidak terdaftar!");

    const newPass = Math.floor(100000 + Math.random() * 900000).toString();
    user.pass = newPass; 
    saveToLocal();

    const msg = `Hai ${user.name}, kata laluan sementara E-Library ATX anda: ${newPass}. Sila log masuk dan tukar segera.`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
    
    toggleForgot(); // Balik ke skrin login
}

// ==========================================
// 4. SCANNER, QR, CHECK-IN/OUT
// ==========================================
async function startBruteScanner() {
    const canvas = document.getElementById('safe-canvas'), ctx = canvas.getContext('2d');
    const v = document.createElement('video');
    try {
        bruteStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        v.srcObject = bruteStream; await v.play();
        document.getElementById('scanner-wrapper').style.display = 'block';
        document.getElementById('btn-start').style.display = 'none';
        document.getElementById('btn-stop').style.display = 'block';
        const tick = () => {
            if (!bruteStream) return;
            if (v.readyState === v.HAVE_ENOUGH_DATA) {
                canvas.width = v.videoWidth; canvas.height = v.videoHeight;
                ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                if (code) { processCheckOut(code.data); stopBruteScanner(); return; }
            }
            bruteLoop = requestAnimationFrame(tick);
        }; tick();
    } catch (e) { alert("Camera Denied"); }
}
function stopBruteScanner() { if (bruteLoop) cancelAnimationFrame(bruteLoop); if (bruteStream) { bruteStream.getTracks().forEach(t => t.stop()); bruteStream = null; } document.getElementById('scanner-wrapper').style.display = 'none'; document.getElementById('btn-start').style.display = 'block'; document.getElementById('btn-stop').style.display = 'none'; }
function processCheckOut(id) { const b = bookings.find(x => x.id == id); if(b && b.status === 'approved') { b.status = 'ended'; b.end = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}); saveToLocal(); renderData(); alert("Check-out Success!"); } }
function manualCheckInOut() { const v = document.getElementById('manual-scan-id').value; if(v) processCheckOut(v); }
function showQR(id) { const b = bookings.find(x => x.id === id); if(!b) return; document.getElementById('qr-modal').style.display = 'flex'; document.getElementById('qr-image').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${b.id}" style="width:180px; background:white; padding:5px;">`; document.getElementById('qr-id-display').innerText = "ID: " + b.id; }
function closeQR() { document.getElementById('qr-modal').style.display = 'none'; }

// ==========================================
// 5. 14. TUKAR GAMBAR & 4. TUKAR PASSWORD
// ==========================================
function uploadPhoto(event) { 
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const idx = users.findIndex(u => u.matrik === session.matrik);
        if (idx !== -1) { users[idx].photo = e.target.result; session.photo = e.target.result; saveToLocal(); renderData(); }
    };
    reader.readAsDataURL(file);
}

// --- FUNGSI KEMASKINI NAMA (UPDATE NAME) ---
function updateAccountInfo() {
    const newName = document.getElementById('set-name').value.trim();
    if (newName) {
        // Cari user dalam database array
        const idx = users.findIndex(u => u.matrik === session.matrik);
        if (idx !== -1) { 
            users[idx].name = newName; 
            session.name = newName; // Update session biar terus berubah di dashboard
            saveToLocal(); 
            renderData(); 
            alert("Nama Berjaya Dikemaskini!"); 
            document.getElementById('set-name').value = ""; 
        }
    } else {
        alert("Sila masukkan nama baru!");
    }
    // Cari user dalam database (users array)
    const idx = users.findIndex(u => u.matrik === session.matrik);
    
    if (idx !== -1) {
        // Kemaskini dalam database users
        users[idx].name = newName;
        // Kemaskini dalam session sekarang
        session.name = newName;
        
        // Kemaskini nama di semua tempahan yang pelajar ini buat
        bookings.forEach(b => {
            if (b.matrik === session.matrik) {
                b.uName = newName;
            }
        });

        saveToLocal(); // Simpan ke localStorage
        renderData();  // Update paparan dashboard (Hi, Nama Baru)
        alert("Nama berjaya dikemaskini!");
        document.getElementById('set-name').value = ""; // Kosongkan input
    }
}

// --- FUNGSI TUKAR PASSWORD (CHANGE PASSWORD) ---
function updatePassword() {
    const newPass = document.getElementById('set-pass').value;

    if (!newPass || newPass.length < 4) {
        return alert("Password mesti sekurang-kurangnya 4 karakter!");
    }

    // Cari user dalam database
    const idx = users.findIndex(u => u.matrik === session.matrik);

    if (idx !== -1) {
        users[idx].pass = newPass;
        session.pass = newPass; // Update session juga

        saveToLocal();
        alert("Kata laluan berjaya ditukar!");
        document.getElementById('set-pass').value = ""; // Kosongkan input
    }
}


// ==========================================
// 6. UI HELPERS (DARKMODE, TOGGLE)
// ==========================================
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); localStorage.setItem('atx_darkmode', document.body.classList.contains('dark-mode')); }
function togglePassword(id) { const el = document.getElementById(id); el.type = (el.type === "password" ? "text" : "password"); }

function toggleHistory() {
    const list = document.getElementById('history-list'), arrow = document.getElementById('history-arrow');
    const isHidden = (list.style.display === 'none' || list.style.display === '');
    list.style.display = isHidden ? 'block' : 'none';
    if(arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

function toggleAdminLiveHistory() {
    const list = document.getElementById('admin-live-history'), arrow = document.getElementById('admin-history-arrow');
    const isHidden = (list.style.display === 'none' || list.style.display === '');
    list.style.display = isHidden ? 'block' : 'none';
    if(arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

// ==========================================
// 7. NAVIGATION & INIT
// ==========================================
function showPage(p) {
    // 1. Sorok semua page, tunjuk page yang dipilih
    document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active-page'));
    const target = document.getElementById('page-' + p);
    if(target) {
        target.classList.add('active-page');
    } else {
        console.error("Page tidak dijumpai: page-" + p);
    }

    // 2. Kawal butang Back dan butang Tempah
    const fabBack = document.getElementById('fab-back');
    if(fabBack) fabBack.style.display = (p === 'dashboard' ? 'none' : 'flex');

    const fabT = document.getElementById('fab-tempah');
    if (fabT) {
        fabT.style.display = (session && session.role === 'user' && p === 'dashboard') ? 'flex' : 'none';
    }

    // 3. Logik Khas untuk Page Profile
    if(p === 'profile' && session) {
        const nameEl = document.getElementById('prof-name');
        const matrikEl = document.getElementById('prof-matrik');
        const phoneEl = document.getElementById('prof-phone'); 

        if(nameEl) nameEl.innerText = session.name || "-";
        if(matrikEl) matrikEl.innerText = (session.role === 'admin' ? 'Administrator' : session.matrik || "-");
        
        // Safety check: Hanya update kalau element ni wujud di HTML
        if(phoneEl) {
            phoneEl.innerText = session.phone || "Tiada Maklumat";
        }
    }
    
    // 4. Tutup menu automatik selepas tekan
    const mainMenu = document.getElementById('mainMenu');
    if(mainMenu) mainMenu.classList.remove('open');
}

function saveToLocal() { localStorage.setItem('atx_users', JSON.stringify(users)); localStorage.setItem('atx_bookings', JSON.stringify(bookings)); }
function updateStatus(id, s) { const idx = bookings.findIndex(b => b.id === id); if(idx !== -1) { bookings[idx].status = s; saveToLocal(); renderData(); } }
function deleteBooking(id) { if(confirm("Batal tempahan?")) { bookings = bookings.filter(b => b.id !== id); saveToLocal(); renderData(); } }

function submitBooking() { 
    const d = document.getElementById('bDate').value, 
          s = document.getElementById('bStart').value, 
          e = document.getElementById('bEnd').value, 
          t = document.getElementById('bType').value; 

    // Safety check supaya tidak crash kalau session kosong
    if(!session || !session.matrik) return alert("Sesi tamat, sila login semula!");

    if(d && s && e){ 
        bookings.push({
            id: Date.now(), 
            matrik: session.matrik, // Ini kunci akaun baru boleh buat booking
            uName: session.name, 
            type: t, 
            date: d, 
            start: s, 
            end: e, 
            status: 'pending'
        }); 
        saveToLocal(); 
        renderData(); 
        showPage('dashboard'); 
    } else { alert("Sila isi Tarikh & Masa!"); }
}


function toggleMenu() { document.getElementById('mainMenu').classList.toggle('open'); }
function applyTranslations() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        if (t[key]) el.innerText = t[key];
    });
}
// Fungsi untuk tukar bahasa (dipanggil oleh butang BM/EN)
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('atx_lang', lang); // Simpan dalam memory iPhone
    
    // Update visual butang BM|EN di skrin login
    const msBtn = document.getElementById('lang-ms');
    const enBtn = document.getElementById('lang-en');
    if(msBtn && enBtn) {
        msBtn.classList.toggle('active', lang === 'ms');
        enBtn.classList.toggle('active', lang === 'en');
        msBtn.style.opacity = (lang === 'ms') ? "1" : "0.5";
        enBtn.style.opacity = (lang === 'en') ? "1" : "0.5";
    }

    applyTranslations(); // Tukar teks statik (data-t)
    if(session) renderData(); // Tukar teks dinamik (list/history)
}

function applyTranslations() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        if (t[key]) {
            if (el.tagName === 'INPUT') {
                el.placeholder = t[key];
            } else if (el.tagName === 'OPTION') {
                el.text = t[key]; // Ini untuk tukar bahasa dalam dropdown
            } else {
                el.innerText = t[key];
            }
        }
    });
}


window.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    const isDark = localStorage.getItem('atx_darkmode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('darkToggle');
        if (toggle) toggle.checked = true; // SINC BUTANG TOGGLE ASAL
    }
});
