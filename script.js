// --- DATA STATE ---
let students = JSON.parse(localStorage.getItem('my_class_students')) || [
    { id: 1, name: "Budi Santoso", gender: "L", score: "A" },
    { id: 2, name: "Andi Wijaya", gender: "L", score: "B" },
    { id: 3, name: "Candra", gender: "L", score: "A" },
    { id: 4, name: "Deni", gender: "L", score: "B" },
    { id: 5, name: "Siti Rahma", gender: "P", score: "A" },
    { id: 6, name: "Dewi", gender: "P", score: "B" },
    { id: 7, name: "Eni", gender: "P", score: "A" },
    { id: 8, name: "Fitri", gender: "P", score: "B" }
];

let justiceMode = false;

// Helper: Shuffle Array (Penting agar tidak error!)
function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Save Data
function saveData() {
    localStorage.setItem('my_class_students', JSON.stringify(students));
    renderStudentTable();
}

// Tab Navigation
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (tabId === 'spinTab') {
        initWheelMode();
    }
}

// --- TAB 1: DATABASE LOGIC ---
const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('nameInput').value.trim();
        const gender = document.getElementById('genderInput').value;
        const score = document.getElementById('scoreInput').value;

        if (name) {
            students.push({ id: Date.now(), name, gender, score });
            saveData();
            studentForm.reset();
        }
    });
}

function deleteStudent(id) {
    students = students.filter(s => s.id !== id);
    saveData();
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    document.getElementById('totalStudentsCount').innerText = students.length;

    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.name}</td>
            <td><span class="badge badge-${s.gender}">${s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span></td>
            <td><span class="badge badge-${s.score}">Nilai ${s.score}</span></td>
            <td><button class="btn btn-danger" onclick="deleteStudent(${s.id})">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function clearAllData() {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data siswa?")) {
        students = [];
        saveData();
    }
}

function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "database_siswa.json");
    dlAnchorElem.click();
}

function importJSON(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                students = importedData;
                saveData();
                alert("Database siswa berhasil di-import!");
            }
        } catch (err) {
            alert("Format file JSON tidak valid.");
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// --- TAB 2: MANUAL WHEEL SPIN LOGIC ---
let wheelCanvas = document.getElementById('wheelCanvas');
let ctx = wheelCanvas ? wheelCanvas.getContext('2d') : null;

let boysQueue = [];
let girlsQueue = [];
let currentWheelQueue = [];
let spinModeOption = 'genderFirst';

let wheelGroups = [];
let currentGroupIndex = 0;
let isSpinning = false;
let startAngle = 0;
let spinTimeout = null;
let spinArcStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;

// Touch/Drag variables
let isDragging = false;
let lastTouchAngle = 0;
let dragVelocity = 0;
let lastTime = 0;

function initWheelMode() {
    const groupInput = document.getElementById('wheelGroupCount');
    const orderInput = document.getElementById('spinOrder');
    
    if (!groupInput || !orderInput) return;

    const numGroups = parseInt(groupInput.value) || 1;
    spinModeOption = orderInput.value;
    
    wheelGroups = Array.from({ length: numGroups }, () => []);
    currentGroupIndex = 0;

    boysQueue = shuffleArray(students.filter(s => s.gender === 'L'));
    girlsQueue = shuffleArray(students.filter(s => s.gender === 'P'));

    if (spinModeOption === 'genderFirst') {
        if (boysQueue.length > 0) {
            currentWheelQueue = boysQueue;
        } else {
            currentWheelQueue = girlsQueue;
        }
    } else {
        currentWheelQueue = shuffleArray([...students]);
    }

    updateWheelStatus();
    renderWheelResults();
    drawWheel();
}

function updateWheelStatus() {
    const status = document.getElementById('wheelStatus');
    const spinBtn = document.getElementById('spinBtn');
    if (!status) return;
    
    if (spinModeOption === 'genderFirst' && currentWheelQueue.length === 0) {
        if (boysQueue.length === 0 && girlsQueue.length > 0) {
            currentWheelQueue = girlsQueue;
        }
    }

    if (currentWheelQueue.length === 0) {
        status.innerText = "🎉 Semua siswa telah selesai dimasukkan ke dalam kelompok!";
        if (spinBtn) spinBtn.disabled = true;
    } else {
        const currentGender = currentWheelQueue[0].gender === 'L' ? 'Laki-laki' : 'Perempuan';
        const infoText = spinModeOption === 'genderFirst' 
            ? `Antrean: Siswa ${currentGender} (${currentWheelQueue.length} Anak)` 
            : `Antrean: Campur Semua Siswa (${currentWheelQueue.length} Anak)`;

        status.innerText = `Memutar untuk: Kelompok ${currentGroupIndex + 1} | ${infoText}`;
        if (spinBtn) spinBtn.disabled = false;
    }
}

function drawWheel() {
    if (!ctx) return;

    // --- FITUR AGAR CANVAS TAJAM (NGGAK NGEBLUR) ---
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 350; // Ukuran tampilan di layar
    
    // Set ukuran fisik canvas sesuai resolusi layar
    wheelCanvas.width = displaySize * dpr;
    wheelCanvas.height = displaySize * dpr;
    wheelCanvas.style.width = displaySize + 'px';
    wheelCanvas.style.height = displaySize + 'px';
    
    // Scale context agar gambar tetap proporsional dan tajam
    ctx.scale(dpr, dpr);

    const numOptions = currentWheelQueue.length;
    const outsideRadius = 160;
    const textRadius = 100;
    const insideRadius = 30;

    ctx.clearRect(0, 0, displaySize, displaySize);

    if (numOptions === 0) {
        ctx.beginPath();
        ctx.arc(175, 175, outsideRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.fill();
        ctx.fillStyle = "#475569";
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Selesai!", 175, 180);
        return;
    }

    const arc = Math.PI / (numOptions / 2);
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
    const fontSize = numOptions > 25 ? '10px' : numOptions > 15 ? '11px' : '13px';

    for (let i = 0; i < numOptions; i++) {
        const angle = startAngle + i * arc;
        ctx.fillStyle = colors[i % colors.length];

        ctx.beginPath();
        ctx.arc(175, 175, outsideRadius, angle, angle + arc, false);
        ctx.arc(175, 175, insideRadius, angle + arc, angle, true);
        ctx.stroke();
        ctx.fill();

        ctx.save();
        
        // --- WARNA TULISAN SELALU PUTIH ---
        ctx.fillStyle = "#ffffff";
        
        // Bayangan tipis pada teks agar makin kontras & tidak blur
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 3;
        
        ctx.translate(175 + Math.cos(angle + arc / 2) * textRadius, 
                      175 + Math.sin(angle + arc / 2) * textRadius);
        
        ctx.rotate(angle + arc / 2);
        
        ctx.font = `bold ${fontSize} sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        
        const text = currentWheelQueue[i].name;
        const maxLength = numOptions > 25 ? 12 : 16;
        const formattedText = text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;

        ctx.fillText(formattedText, 45, 0);
        ctx.restore();
    }
}

function spinWheelAuto() {
    if (isSpinning || currentWheelQueue.length === 0) return;
    isSpinning = true;
    
    spinArcStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000;
    rotateWheelAuto();
}

function rotateWheelAuto() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const spinAngle = spinArcStart - easeOut(spinTime, 0, spinArcStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel();
    spinTimeout = setTimeout(rotateWheelAuto, 30);
}

function stopRotateWheel() {
    clearTimeout(spinTimeout);
    const numOptions = currentWheelQueue.length;
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = 180 / (numOptions / 2);
    const index = Math.floor((360 - (degrees % 360)) / arcd) % numOptions;
    
    const selectedStudent = currentWheelQueue.splice(index, 1)[0];
    wheelGroups[currentGroupIndex].push(selectedStudent);

    currentGroupIndex = (currentGroupIndex + 1) % wheelGroups.length;
    isSpinning = false;
    
    updateWheelStatus();
    renderWheelResults();
    drawWheel();
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// Drag / Touch Listeners
function getAngle(x, y) {
    if (!wheelCanvas) return 0;
    const rect = wheelCanvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(y - cy, x - cx);
}

function handlePointerDown(e) {
    if (isSpinning || currentWheelQueue.length === 0) return;
    isDragging = true;
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    lastTouchAngle = getAngle(px, py);
    lastTime = Date.now();
    dragVelocity = 0;
}

function handlePointerMove(e) {
    if (!isDragging) return;
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    const currentAngle = getAngle(px, py);
    const now = Date.now();
    
    let delta = currentAngle - lastTouchAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    startAngle += delta;
    drawWheel();

    const dt = now - lastTime;
    if (dt > 0) {
        dragVelocity = delta / dt;
    }

    lastTouchAngle = currentAngle;
    lastTime = now;
}

function handlePointerUp() {
    if (!isDragging) return;
    isDragging = false;

    if (Math.abs(dragVelocity) > 0.005) {
        isSpinning = true;
        spinArcStart = Math.abs(dragVelocity) * 400;
        spinTime = 0;
        spinTimeTotal = Math.min(Math.max(spinArcStart * 200, 2000), 6000);
        rotateWheelAuto();
    }
}

if (wheelCanvas) {
    wheelCanvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    wheelCanvas.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
}

function renderWheelResults() {
    const container = document.getElementById('wheelGroupResults');
    if (!container) return;
    container.innerHTML = '';
    wheelGroups.forEach((group, gIdx) => {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML = `<h4>Kelompok ${gIdx + 1} (${group.length} Siswa)</h4>`;
        const ul = document.createElement('ul');

        group.forEach((s, sIdx) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="editable-name" contenteditable="true" onblur="wheelGroups[${gIdx}][${sIdx}].name = this.innerText">
                    ${s.name}
                </span>
                <div>
                    <span class="badge badge-${s.gender}">${s.gender}</span>
                </div>
            `;
            ul.appendChild(li);
        });
        card.appendChild(ul);
        container.appendChild(card);
    });
}

// --- TAB 3: ADVANCE INSTANT SPIN LOGIC ---
function toggleJustice() {
    justiceMode = !justiceMode;
    const btn = document.getElementById('justiceBtn');
    const status = document.getElementById('justiceStatus');
    if (justiceMode) {
        btn.classList.add('active');
        status.innerText = "ON (Aktif)";
    } else {
        btn.classList.remove('active');
        status.innerText = "OFF";
    }
}

function runAdvanceSpin() {
    const numGroups = parseInt(document.getElementById('advGroupCount').value) || 1;
    if (students.length === 0) {
        alert("Database siswa kosong! Masukkan data terlebih dahulu.");
        return;
    }

    let groups = Array.from({ length: numGroups }, () => []);

    const boys = students.filter(s => s.gender === 'L');
    const girls = students.filter(s => s.gender === 'P');

    distributeCategory(boys, groups, justiceMode);
    distributeCategory(girls, groups, justiceMode);

    renderAdvanceResults(groups);
}

function addStudentToSmallestGroup(student, groups) {
    let minSize = Math.min(...groups.map(g => g.length));
    let smallestGroups = groups.filter(g => g.length === minSize);
    smallestGroups[0].push(student);
}

function distributeCategory(categoryStudents, groups, useJustice) {
    if (useJustice) {
        let groupA = shuffleArray(categoryStudents.filter(s => s.score === 'A'));
        let groupB = shuffleArray(categoryStudents.filter(s => s.score === 'B'));

        groupA.forEach(student => addStudentToSmallestGroup(student, groups));
        groupB.forEach(student => addStudentToSmallestGroup(student, groups));
    } else {
        let shuffled = shuffleArray(categoryStudents);
        shuffled.forEach(student => addStudentToSmallestGroup(student, groups));
    }
}

function renderAdvanceResults(groups) {
    const container = document.getElementById('advGroupResults');
    if (!container) return;
    container.innerHTML = '';

    groups.forEach((group, gIdx) => {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML = `<h4>Kelompok ${gIdx + 1} (${group.length} Siswa)</h4>`;
        const ul = document.createElement('ul');

        group.forEach((s) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="editable-name" contenteditable="true">
                    ${s.name}
                </span>
                <div>
                    <span class="badge badge-${s.gender}">${s.gender}</span>
                </div>
            `;
            ul.appendChild(li);
        });
        card.appendChild(ul);
        container.appendChild(card);
    });
}

// DOM Event Listeners Safe Setup
document.addEventListener("DOMContentLoaded", () => {
    renderStudentTable();
    initWheelMode();

    const wheelGroupInput = document.getElementById('wheelGroupCount');
    const spinOrderInput = document.getElementById('spinOrder');

    if (wheelGroupInput) {
        wheelGroupInput.addEventListener('change', initWheelMode);
        wheelGroupInput.addEventListener('input', initWheelMode);
    }
    if (spinOrderInput) {
        spinOrderInput.addEventListener('change', initWheelMode);
    }
});