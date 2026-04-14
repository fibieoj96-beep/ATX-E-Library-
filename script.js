// ==========================================
// 1. CONFIGURATION & DATA INITIALIZATION
// ==========================================
// Guna nama 'sb' supaya tidak gaduh dengan library 'supabase'
const SB_URL = "https://eurpvtwlzvwvkegyekwf.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cnB2dHdsenZ3dmtlZ3lla3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzQ4ODgsImV4cCI6MjA5MTc1MDg4OH0.qyPxQM5k4OB5TbrLAA1qQUfrChog8QQ_uhIw-6b5NEg";
const sb = supabase.createClient(SB_URL, SB_KEY);

const MASTER_KEY = "ATX_ADMIN_2026";
const LIMITS = { "Reading Room": 5, "Discussion Room": 2, "Computer Zone": 10 };

let users = JSON.parse(localStorage.getItem('atx_users')) || [];
let bookings = JSON.parse(localStorage.getItem('atx_bookings')) || [];
let session = JSON.parse(localStorage.getItem('atx_session')) || null;
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
        discussion: "PERBINCANGAN",
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
        discussion_room: "Bilik Perbincangan",
        comp_zone: "Zon Komputer",
        booking_date: "Tarikh Tempahan",
        start_time: "Masa Mula",
        end_time: "Masa Tamat",
			Hi: "Hai"
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
        end_time: "End Time",
			Hi: "Hai"
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

    // --- BAHAGIAN KEMASKINI PROFIL (FIX TELEFON & TEKS) ---
    const userDB = users.find(u => u.matrik === session.matrik);
    
    // 1. Gambar Profil
    const profDisplay = document.getElementById('profile-display');
    if(profDisplay) {
        profDisplay.innerHTML = (userDB && userDB.photo) 
            ? `<img src="${userDB.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` 
            : `<div style="width:100%; height:100%; background:#eee; border-radius:50%; border:1px solid #ddd;"></div>`;
    }

    // 2. Teks Profil (Nama, Matrik, Telefon)
    const pName = document.getElementById('prof-name');
    const pMatrik = document.getElementById('prof-matrik');
    const pPhone = document.getElementById('prof-phone');

    if (pName) pName.innerText = session.name || "-";
    if (pMatrik) pMatrik.innerText = session.matrik || "-";
    
    // Ambil data phone dari userDB (database) atau session
    if (pPhone) {
        pPhone.innerText = (userDB && userDB.phone) ? userDB.phone : (session.phone || "-");
    }
    // -------------------------------------------------------

    if (session.role === 'user') {
        const myAll = bookings.filter(b => b.matrik === session.matrik);

        const active = myAll.filter(b => 
            b.status === 'pending' || 
            b.status === 'approved' || 
            b.status === 'active'
        ).sort((a, b) => b.id - a.id);

        const history = myAll.filter(b => 
            b.status === 'rejected' || 
            b.status === 'ended'
        ).sort((a, b) => b.id - a.id);

        document.getElementById('countMy').innerText = active.length;

        document.getElementById('myList').innerHTML = active.map(b => {
            let actionButton = '';
            let statusColor = '#ffc107'; 
            let statusLabel = '';

            if (b.status === 'approved') {
                actionButton = `<button onclick="showQR('${b.id}')" style="background:#28a745; color:white; border:none; padding:8px 12px; border-radius:8px; font-size:11px; font-weight:800;">CHECK-IN QR</button>`;
                statusColor = '#28a745'; 
                statusLabel = `<span class="status-badge badge-green" style="margin-top:5px;">APPROVED</span>`;
            } else if (b.status === 'active') {
                actionButton = `<button onclick="showQR('${b.id}')" style="background:var(--primary); color:white; border:none; padding:8px 12px; border-radius:8px; font-size:11px; font-weight:800;">CHECK-OUT QR</button>`;
                statusColor = '#28a745';
                statusLabel = `<span class="status-badge badge-green" style="margin-top:5px;">IN-USE</span>`;
            } else {
                actionButton = `<button onclick="deleteBooking('${b.id}')" style="color:#dc3545; border:1.5px solid #dc3545; background:none; padding:5px 10px; border-radius:8px; font-weight:bold; font-size:10px;">CANCEL</button>`;
                statusLabel = `<span style="font-size:10px; color:#64748b; font-weight:bold;">WAITING APPROVAL</span>`;
            }

            return `
            <div class="card" style="border-left: 6px solid ${statusColor}; margin-bottom:12px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:var(--primary); font-size:15px; display:block; margin-bottom:2px;">${b.type}</strong>
                    <small style="color:var(--accent); font-weight:bold; display:block;">Tarikh: ${b.date}</small>
                    <small style="opacity:0.7; display:block;">Masa: ${b.start} - ${b.end}</small>
                    ${statusLabel}
                </div>
                ${actionButton}
            </div>`;
        }).join('') || `<p style="text-align:center; opacity:0.6; padding:20px;">Tiada tempahan aktif.</p>`;

        document.getElementById('history-list').innerHTML = history.map(b => {
            const isEnded = (b.status === 'ended');
            const sClass = isEnded ? 'badge-red' : 'badge-red'; 
            const sLabel = b.status.toUpperCase();
            
            return `
            <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:var(--primary); font-size:14px;">${b.type}</strong><br>
                    <small style="opacity:0.7; display:block; margin-top:4px;">Tarikh: ${b.date}</small>
                    <small style="opacity:0.8; font-weight:bold;">Masa: ${b.start} - ${b.end}</small>
                </div>
                <div class="status-badge ${sClass}">${sLabel}</div>
            </div>`;
        }).join('') || '<p style="text-align:center; padding:20px;">Tiada sejarah.</p>';

    } else {
        let needsSaving = false;
        bookings.forEach(b => {
            if (b.status === 'approved' && b.date === today && curT >= b.end) {
                b.status = 'ended';
                needsSaving = true;
            }
        });
        if (needsSaving) saveToLocal();

        for (let zone in LIMITS) {
            const occupied = bookings.filter(b => {
                const isApprovedToday = (b.status === 'approved' && b.date === today);
                const isOngoing = (curT >= b.start && curT < b.end);
                let roomMatch = false;
                const type = b.type.toLowerCase();
                if (zone === "Reading Room" && (type.includes("reading") || type.includes("bacaan"))) roomMatch = true;
                if (zone === "Discussion Room" && (type.includes("discussion") || type.includes("perbincangan"))) roomMatch = true;
                if (zone === "Computer Zone" || zone === "Computer Lab") {
                    if (type.includes("computer") || type.includes("komputer") || type.includes("zon")) roomMatch = true;
                }
                return isApprovedToday && isOngoing && roomMatch;
            }).length;

            let elId = (zone === "Reading Room") ? "stat-bacaan" : (zone === "Discussion Room") ? "stat-perbincangan" : "stat-komputer";
            const el = document.getElementById(elId);
            if (el) {
                const baki = LIMITS[zone] - occupied;
                el.innerText = `${baki}/${LIMITS[zone]}`;
                el.style.color = (baki <= 0) ? "#dc3545" : "#28a745";
            }
        }

        const pendingData = bookings.filter(b => b.status === 'pending').sort((a, b) => b.id - a.id);
        document.getElementById('adminTable').innerHTML = pendingData.map(b => `
            <div class="card" style="border-left: 6px solid #ffc107; display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:10px;">
                <div>
                    <strong>${b.uName}</strong><br>
                    <small>${b.type} | ${b.date}</small>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="updateStatus(${b.id}, 'approved')" style="background:#28a745; color:white; border:none; padding:8px 12px; border-radius:8px; font-size:10px; font-weight:bold;">APPROVE</button>
                    <button onclick="updateStatus(${b.id}, 'rejected')" style="background:#dc3545; color:white; border:none; padding:8px 12px; border-radius:8px; font-size:10px; font-weight:bold;">REJECT</button>
                </div>
            </div>`).join('') || '<p style="text-align:center; padding:10px; opacity:0.6;">Tiada permohonan baru.</p>';

        const liveData = bookings.filter(b => b.date === today && b.status === 'approved' && curT < b.end).sort((a, b) => b.id - a.id);
        document.getElementById('live-bookings').innerHTML = liveData.map(b => `
            <div class="card" style="border-left: 6px solid #28a745; display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:10px;">
                <div class="status-dot bg-live"></div>
                <div>
                    <strong>${b.uName}</strong><br>
                    <small>${b.type} | Masa: ${b.start} - ${b.end}</small>
                </div>
            </div>`).join('') || '<p style="text-align:center; opacity:0.6; padding:10px;">Tiada pelajar aktif.</p>';

        const justEnded = bookings.filter(b => b.status === 'ended').sort((a, b) => b.id - a.id);
        const adminLiveHist = document.getElementById('admin-live-history');
        if(adminLiveHist) {
            adminLiveHist.innerHTML = justEnded.map(b => `
                <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${b.uName}</strong><br>
                        <small style="opacity:0.7;">${b.type} | ${b.date}</small><br>
                        <small style="color:var(--accent); font-weight:bold;">Masa: ${b.start} - ${b.end}</small>
                    </div>
                    <div class="status-badge badge-red">ENDED</div>
                </div>`).join('') || '<p style="text-align:center; padding:10px; opacity:0.5;">Tiada sesi tamat.</p>';
        }

        const archive = bookings.filter(b => 
            b.status === 'rejected' || 
            (b.status === 'approved' && (b.date < today || (b.date === today && b.end <= curT)))
        ).sort((a, b) => b.id - a.id);

        const archTable = document.getElementById('adminHistoryTable');
        if (archTable) {
            archTable.innerHTML = archive.map(b => {
                const isGreen = (b.status === 'approved');
                const sClass = isGreen ? 'badge-green' : 'badge-red';
                let displayStatus = b.status.toUpperCase();
                if(isGreen && (b.date < today || (b.date === today && b.end <= curT))) displayStatus = "EXPIRED";
                return `
                <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--primary); font-size:15px;">${b.uName}</strong><br>
                        <small style="opacity:0.8;">${b.type} | ${b.date}</small>
                    </div>
                    <div class="status-badge ${sClass}">${displayStatus}</div>
                </div>`;
            }).join('') || '<p style="text-align:center; padding:30px; opacity:0.5;">Tiada rekod.</p>';
        }
    }
}
// ==========================================
// 3. AUTHENTICATION (SUPABASE CLOUD)
// ==========================================

async function handleLogin() {
    const u = document.getElementById('logUser').value.trim();
    const p = document.getElementById('logPass').value;

    if (!u || !p) return alert("Sila isi ID dan Password!");

    // Pintu belakang Admin (Hardcoded)
    if (u === "admin" && p === "123") {
        session = { name: "Administrator", matrik: "ADM-001", role: "admin", phone: "60123456789" };
        loginSuccess();
        return;
    }

    try {
        // Ambil data dari table 'users' di Supabase
        const { data, error } = await sb
            .from('users')
            .select('*')
            .eq('matrik', u)
            .single();

        if (error || !data) {
            return alert("ID Matrik tidak dijumpai!");
        }

        if (data.pass === p) {
            session = data;
            loginSuccess();
        } else {
            alert("Kata laluan salah!");
        }
    } catch (err) {
        alert("Ralat Rangkaian: " + err.message);
    }
}

async function handleSignup() {
    const n = document.getElementById('regName').value.trim();
    const m = document.getElementById('regMatrik').value.trim();
    const p = document.getElementById('regPass').value;
    const r = document.getElementById('regRole').value;
    const s = document.getElementById('regSecret').value;
    const ph = document.getElementById('regPhone').value.trim();

    if (!n || !p || !ph) return alert("Sila isi maklumat wajib (Nama, No. Tel, Password)!");
    if (r === 'admin' && s !== MASTER_KEY) return alert("Master Key Admin Salah!");

    const autoID = (r === 'admin' ? "ADM-" : "STU-") + Date.now().toString().slice(-4);
    const finalID = m || autoID;

    try {
        // Simpan data ke Cloud Supabase
        const { error } = await sb
            .from('users')
            .insert([{ 
                matrik: finalID, 
                name: n, 
                pass: p, 
                role: r, 
                phone: ph 
            }]);

        if (error) {
            if (error.code === '23505') alert("No. Matrik atau Telefon sudah berdaftar!");
            else alert("Gagal Daftar: " + error.message);
            return;
        }

        alert("Pendaftaran Cloud Berjaya! Sila Login guna ID: " + finalID);
        showAuthForm('login');

    } catch (err) {
        alert("Sistem Crash: " + err.message);
    }
}

async function loginSuccess() {
    localStorage.setItem('atx_session', JSON.stringify(session));
    
    // Tarik data tempahan dari Cloud supaya skrin tidak kosong
    await fetchBookings(); 

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'flex';
    
    // Tunjuk view ikut peranan
    document.getElementById('admin-view').style.display = (session.role === 'admin' ? 'block' : 'none');
    document.getElementById('student-view').style.display = (session.role === 'user' ? 'block' : 'none');
    
    renderData();
    showPage('dashboard');
}

async function fetchBookings() {
    const { data, error } = await sb
        .from('bookings')
        .select('*')
        .order('id', { ascending: false });

    if (!error) {
        bookings = data || [];
        renderData();
    }
}

function checkRole() {
    const role = document.getElementById('regRole').value;
    const adminKeyBox = document.getElementById('adminKeyBox');
    const matrikGroup = document.getElementById('matrikInputGroup');

    if (role === 'admin') {
        adminKeyBox.style.display = 'block';
        matrikGroup.style.display = 'none';

    } else {
        adminKeyBox.style.display = 'none';
        matrikGroup.style.display = 'block';
    }
}


function showAuthForm(type) {
    const loginForm = document.querySelector('.login-form');
    const signupForm = document.querySelector('.signup-form');
    const forgotForm = document.querySelector('.forgot-form');
    const authBox = document.getElementById('authBox');

    // Sembunyikan semua borang sapa murni
    if(loginForm) loginForm.style.display = 'none';
    if(signupForm) signupForm.style.display = 'none';
    if(forgotForm) forgotForm.style.display = 'none';

    // Tunjuk yang berkenaan sja
    if (type === 'signup') {
        if(authBox) authBox.classList.add('active');
        if(signupForm) signupForm.style.display = 'flex';
    } else if (type === 'forgot') {
        if(forgotForm) forgotForm.style.display = 'flex';
    } else {
        if(authBox) authBox.classList.remove('active');
        if(loginForm) loginForm.style.display = 'flex';
    }
}

function backToLogin() {
    // 1. Cari semua borang
    const login = document.querySelector('.login-form');
    const signup = document.querySelector('.signup-form');
    const forgot = document.querySelector('.forgot-form');
    const box = document.getElementById('authBox');

    // 2. Paksa tutup semua, buka Login sja
    if(login) login.style.setProperty('display', 'flex', 'important');
    if(signup) signup.style.setProperty('display', 'none', 'important');
    if(forgot) forgot.style.setProperty('display', 'none', 'important');

    // 3. Buang class active supaya kotak jadi pendek balik
    if(box) box.classList.remove('active');
    
    console.log("Balik ke Login sapa murni!");
}

function toggleAuth() {
    const authBox = document.getElementById('authBox');
    if (authBox.classList.contains('active')) {
        showAuthForm('login');
    } else {
        showAuthForm('signup');
    }
}

// Tambahan: Fungsi hantar kod reset ke WhatsApp
function sendWhatsAppReset() {
    const phone = document.getElementById('forgotPhone').value.trim();
    const user = users.find(u => u.phone === phone);

    if (!user) {
        alert("Nombor telefon tidak dijumpai!");
        return;
    }

    const newPass = Math.floor(100000 + Math.random() * 900000).toString();
    user.pass = newPass;
    saveToLocal();

    const roleLabel = (user.role === 'admin' ? "ADMIN" : "PELAJAR");
    const msg = "Hai " + user.name + " (" + roleLabel + "),\n\nKata laluan sementara E-Library ATX anda: " + newPass + "\nID Login: " + user.matrik + "\n\nSila log masuk segera dan tukar password anda.";

    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg), '_blank');
    showAuthForm('login');
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

function processCheckOut(id) {
    const b = bookings.find(x => x.id == id);
    if (!b) return alert("Kod QR tidak sah!");

    const now = new Date();
    const curT = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');

    if (b.status === 'approved') {
        b.status = 'active';
        saveToLocal();
        renderData();
        alert("Check-in berjaya! Sesi pelajar telah bermula.");
    } 
    else if (b.status === 'active') {
        b.status = 'ended';
        b.end = curT;
        saveToLocal();
        renderData();
        alert("Check-out berjaya! Sesi telah tamat.");
    } 
    else {
        alert("Status tidak membenarkan imbasan.");
    }
}

function manualCheckInOut() {
    const v = document.getElementById('manual-scan-id').value;
    if(v) processCheckOut(v);
}

function showQR(id) {
    const b = bookings.find(x => x.id == id);
    if (!b) return;
    
    const qrModal = document.getElementById('qr-modal');
    const qrImage = document.getElementById('qr-image');
    const qrIdDisplay = document.getElementById('qr-id-display');
    
    if (qrModal && qrImage && qrIdDisplay) {
        qrModal.style.display = 'flex';
        qrIdDisplay.innerText = "ID: " + b.id;
        qrImage.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${b.id}" style="width:180px; background:white; padding:5px;">`;
    }
}

function closeQR() {
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) qrModal.style.display = 'none';
}

// ==========================================
// 5. 14. TUKAR GAMBAR & 4. TUKAR PASSWORD
// ==========================================
function uploadPhoto(event) { 
    const file = event.target.files[0]; 
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result;

        // Hantar gambar ke Cloud
        const { error } = await sb
            .from('users')
            .update({ photo: base64Image })
            .eq('matrik', session.matrik);

        if (!error) {
            session.photo = base64Image;
            localStorage.setItem('atx_session', JSON.stringify(session));
            renderData();
            alert("Gambar profil berjaya dipasang!");
        } else {
            alert("Gagal simpan gambar: " + error.message);
        }
    };
    reader.readAsDataURL(file);
}
// --- FUNGSI KEMASKINI NAMA (UPDATE NAME) ---
// --- KEMASKINI NAMA (CLOUD) ---
async function updateAccountInfo() {
    const newName = document.getElementById('set-name').value.trim();
    if (!newName) return alert("Sila masukkan nama baru!");

    const { error } = await sb
        .from('users')
        .update({ name: newName }) // Tukar di Cloud
        .eq('matrik', session.matrik); // Cari ikut No Matrik bos

    if (!error) {
        session.name = newName; // Update session dalam apps
        localStorage.setItem('atx_session', JSON.stringify(session));
        renderData();
        alert("Nama Berjaya Dikemaskini di Cloud!");
        document.getElementById('set-name').value = "";
    } else {
        alert("Gagal update: " + error.message);
    }
}

// --- TUKAR PASSWORD (CLOUD) ---
async function updatePassword() {
    const newPass = document.getElementById('set-pass').value;
    if (!newPass || newPass.length < 4) return alert("Password min 4 karakter!");

    const { error } = await sb
        .from('users')
        .update({ pass: newPass })
        .eq('matrik', session.matrik);

    if (!error) {
        alert("Kata laluan berjaya ditukar di Cloud!");
        document.getElementById('set-pass').value = "";
    } else {
        alert("Gagal tukar password: " + error.message);
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
    document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active-page'));
    const target = document.getElementById('page-' + p);
    if(target) target.classList.add('active-page');
    
    const fabBack = document.getElementById('fab-back');
    if(fabBack) fabBack.style.display = (p === 'dashboard' ? 'none' : 'flex');

    if(p === 'profile' && session) {
        const nameEl = document.getElementById('prof-name');
        const matrikEl = document.getElementById('prof-matrik');
        if(nameEl) nameEl.innerText = session.name;
        if(matrikEl) matrikEl.innerText = (session.role === 'admin' ? 'Administrator' : session.matrik);
    }
    document.getElementById('mainMenu').classList.remove('open');
}


function saveToLocal() {
    localStorage.setItem('atx_users', JSON.stringify(users));
    localStorage.setItem('atx_bookings', JSON.stringify(bookings));
}

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
