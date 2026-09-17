// --- DATA STATE ---
let students = JSON.parse(localStorage.getItem('my_class_students')) || [
    { id: 1, name: "Budi Santoso", gender: "L", score: "A" },
    { id: 2, name: "Andi Wijaya", gender: "L", score: "B" },
    { id: 3, name: "Candra", gender: "L", score: "A" },
    { id: 4, name: "Deni", gender: "L", score: "C" },
    { id: 5, name: "Siti Rahma", gender: "P", score: "A" },
    { id: 6, name: "Dewi", gender: "P", score: "B" },
    { id: 7, name: "Eni", gender: "P", score: "A" },
    { id: 8, name: "Fitri", gender: "P", score: "C" }
];

let justiceMode = false;

function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function saveData() {
    localStorage.setItem('my_class_students', JSON.stringify(students));
    renderStudentTable();
    updateHomeStats();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    if (tabId === 'spinTab') {
        initWheelMode();
    }
}

// Update Home Stats
function updateHomeStats() {
    const total = students.length;
    const boys = students.filter(s => s.gender === 'L').length;
    const girls = students.filter(s => s.gender === 'P').length;

    if (document.getElementById('statTotal')) document.getElementById('statTotal').innerText = total;
    if (document.getElementById('statBoys')) document.getElementById('statBoys').innerText = boys;
    if (document.getElementById('statGirls')) document.getElementById('statGirls').innerText = girls;
}

// --- TAB 1: DATABASE LOGIC ---
const studentForm = document.getElementById('studentForm');

if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editStudentId').value;
        const name = document.getElementById('nameInput').value.trim();
        const gender = document.getElementById('genderInput').value;
        const score = document.getElementById('scoreInput').value;

        if (name) {
            if (editId) {
                const index = students.findIndex(s => s.id == editId);
                if (index !== -1) {
                    students[index].name = name;
                    students[index].gender = gender;
                    students[index].score = score;
                }
            } else {
                students.push({ id: Date.now(), name, gender, score });
            }

            saveData();
            cancelEdit();
        }
    });
}

function startEditStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('nameInput').value = student.name;
    document.getElementById('genderInput').value = student.gender;
    document.getElementById('scoreInput').value = student.score;

    document.getElementById('formTitle').innerText = "✏️ Edit Data Siswa";
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "💾 Simpan";
    submitBtn.className = "btn btn-primary";
    document.getElementById('cancelEditBtn').style.display = "inline-block";

    document.getElementById('studentForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('editStudentId').value = "";
    document.getElementById('studentForm').reset();

    document.getElementById('formTitle').innerText = "Tambah / Edit Data Siswa";
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "+ Tambah Siswa";
    submitBtn.className = "btn btn-primary";
    document.getElementById('cancelEditBtn').style.display = "none";
}

function deleteStudent(id) {
    if (confirm("Yakin ingin menghapus siswa ini?")) {
        students = students.filter(s => s.id !== id);
        saveData();
        cancelEdit();
    }
}

// Render Student Cards Modern (Responsif Mobile)
function renderStudentTable() {
    const container = document.getElementById('studentListContainer');
    if (!container) return;
    container.innerHTML = '';
    document.getElementById('totalStudentsCount').innerText = students.length;

    students.forEach(s => {
        const item = document.createElement('div');
        item.className = 'student-card-item';
        const scoreLabel = s.score === 'A' ? 'A (Easy)' : s.score === 'B' ? 'B (Average)' : 'C (Hardcore)';
        
        item.innerHTML = `
            <div class="student-info">
                <span class="student-name">${s.name}</span>
                <div class="student-tags">
                    <span class="badge badge-${s.gender}">${s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    <span class="badge badge-${s.score}">${scoreLabel}</span>
                </div>
            </div>
            <div class="student-actions">
                <button class="btn btn-outline" onclick="startEditStudent(${s.id})">✏️</button>
                <button class="btn btn-danger-outline" onclick="deleteStudent(${s.id})">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function clearAllData() {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data siswa?")) {
        students = [];
        saveData();
        cancelEdit();
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
let spinVelocity = 0;
let spinTime = 0;
let spinTimeTotal = 0;

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
        status.innerText = "🎉 Semua siswa telah selesai dimasukkan!";
        if (spinBtn) spinBtn.disabled = true;
    } else {
        const currentGender = currentWheelQueue[0].gender === 'L' ? 'Laki-laki' : 'Perempuan';
        const infoText = spinModeOption === 'genderFirst' 
            ? `Antrean: Siswa ${currentGender} (${currentWheelQueue.length} Anak)` 
            : `Antrean: Campur (${currentWheelQueue.length} Anak)`;

        status.innerText = `Kelompok ${currentGroupIndex + 1} | ${infoText}`;
        if (spinBtn) spinBtn.disabled = false;
    }
}

function drawWheel() {
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 320;
    
    wheelCanvas.width = displaySize * dpr;
    wheelCanvas.height = displaySize * dpr;
    wheelCanvas.style.width = displaySize + 'px';
    wheelCanvas.style.height = displaySize + 'px';
    
    ctx.scale(dpr, dpr);

    const numOptions = currentWheelQueue.length;
    const outsideRadius = 145;
    const textRadius = 90;
    const insideRadius = 25;

    ctx.clearRect(0, 0, displaySize, displaySize);

    if (numOptions === 0) {
        ctx.beginPath();
        ctx.arc(160, 160, outsideRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.fill();
        ctx.fillStyle = "#475569";
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Selesai!", 160, 165);
        return;
    }

    const arc = Math.PI / (numOptions / 2);
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
    const fontSize = numOptions > 25 ? '9px' : numOptions > 15 ? '10px' : '12px';

    for (let i = 0; i < numOptions; i++) {
        const angle = startAngle + i * arc;
        ctx.fillStyle = colors[i % colors.length];

        ctx.beginPath();
        ctx.arc(160, 160, outsideRadius, angle, angle + arc, false);
        ctx.arc(160, 160, insideRadius, angle + arc, angle, true);
        ctx.stroke();
        ctx.fill();

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 3;
        
        ctx.translate(160 + Math.cos(angle + arc / 2) * textRadius, 
                      160 + Math.sin(angle + arc / 2) * textRadius);
        
        ctx.rotate(angle + arc / 2);
        
        ctx.font = `bold ${fontSize} sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        
        const text = currentWheelQueue[i].name;
        const maxLength = numOptions > 25 ? 10 : 14;
        const formattedText = text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;

        ctx.fillText(formattedText, 40, 0);
        ctx.restore();
    }
}

function spinWheelAuto() {
    if (isSpinning || currentWheelQueue.length === 0) return;
    isSpinning = true;
    
    const direction = Math.random() < 0.5 ? 1 : -1;
    spinVelocity = (Math.random() * 15 + 15) * direction;
    
    spinTime = 0;
    spinTimeTotal = Math.random() * 8000 + 2000;
    rotateWheelAuto();
}

function rotateWheelAuto() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const currentSpeed = spinVelocity * (1 - (spinTime / spinTimeTotal));
    startAngle += (currentSpeed * Math.PI / 180);
    drawWheel();
    spinTimeout = setTimeout(rotateWheelAuto, 30);
}

function stopRotateWheel() {
    clearTimeout(spinTimeout);
    const numOptions = currentWheelQueue.length;
    
    let normalizedAngle = startAngle % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

    const degrees = normalizedAngle * 180 / Math.PI + 90;
    const arcd = 360 / numOptions;
    const index = Math.floor((360 - (degrees % 360)) / arcd) % numOptions;
    
    const selectedStudent = currentWheelQueue.splice(index, 1)[0];
    wheelGroups[currentGroupIndex].push(selectedStudent);

    currentGroupIndex = (currentGroupIndex + 1) % wheelGroups.length;
    isSpinning = false;
    
    updateWheelStatus();
    renderWheelResults();
    drawWheel();
}

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
        spinVelocity = dragVelocity * 300;
        spinTime = 0;
        spinTimeTotal = Math.min(Math.max(Math.abs(spinVelocity) * 200, 2000), 10000);
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
        alert("Database siswa kosong!");
        return;
    }

    let groups = Array.from({ length: numGroups }, () => []);

    if (justiceMode) {
        distributeJusticeGlobal(students, groups);
    } else {
        const boys = students.filter(s => s.gender === 'L');
        const girls = students.filter(s => s.gender === 'P');
        
        shuffleArray(boys).forEach(s => getSmallestGroup(groups).push(s));
        shuffleArray(girls).forEach(s => getSmallestGroup(groups).push(s));
    }

    renderAdvanceResults(groups);
}

function getSmallestGroup(groups) {
    let minSize = Math.min(...groups.map(g => g.length));
    return groups.filter(g => g.length === minSize)[0];
}

function distributeJusticeGlobal(allStudents, groups) {
    let listA = shuffleArray(allStudents.filter(s => s.score === 'A'));
    let listB = shuffleArray(allStudents.filter(s => s.score === 'B'));
    let listC = shuffleArray(allStudents.filter(s => s.score === 'C'));

    const maxAperGroup = Math.ceil(listA.length / groups.length);

    listA.forEach(student => {
        let validGroups = groups.filter(g => g.filter(s => s.score === 'A').length < maxAperGroup);
        if (validGroups.length === 0) validGroups = groups;
        
        let target = validGroups.reduce((prev, curr) => prev.length <= curr.length ? prev : curr);
        target.push(student);
    });

    groups.forEach(group => {
        const countA = group.filter(s => s.score === 'A').length;
        if (countA >= 2 && listC.length > 0) {
            const cIndex = listC.findIndex(c => !group.some(g => g.gender === c.gender));
            const selectedC = cIndex !== -1 ? listC.splice(cIndex, 1)[0] : listC.pop();
            group.push(selectedC);
        }
    });

    listC.forEach(student => {
        let target = groups.reduce((prev, curr) => {
            const countCPrev = prev.filter(s => s.score === 'C').length;
            const countCCurr = curr.filter(s => s.score === 'C').length;
            if (countCPrev !== countCCurr) return countCPrev < countCCurr ? prev : curr;
            return prev.length <= curr.length ? prev : curr;
        });
        target.push(student);
    });

    listB.forEach(student => {
        let target = groups.reduce((prev, curr) => prev.length <= curr.length ? prev : curr);
        target.push(student);
    });
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

// Download Laporan
function downloadGroupReport(containerId, titleInputId) {
    const titleInput = document.getElementById(titleInputId);
    const reportTitle = titleInput ? titleInput.value.trim() : "";

    if (!reportTitle) {
        alert("Wajib mengisi judul foto/laporan!");
        if (titleInput) titleInput.focus();
        return;
    }

    const container = document.getElementById(containerId);
    if (!container || container.children.length === 0) {
        alert("Belum ada kelompok!");
        return;
    }

    const now = new Date();
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = now.toLocaleDateString('id-ID', optionsDate);
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";

    const headerDiv = document.createElement('div');
    headerDiv.style.background = '#ffffff';
    headerDiv.style.padding = '16px';
    headerDiv.style.textAlign = 'center';
    headerDiv.style.borderBottom = '3px solid #6366f1';
    headerDiv.style.marginBottom = '12px';
    headerDiv.style.borderRadius = '8px';
    headerDiv.innerHTML = `
        <h2 style="color: #6366f1; margin-bottom: 4px; font-size: 18px;">${reportTitle}</h2>
        <p style="color: #64748b; font-size: 11px; font-weight: bold;">
            📅 Diresmikan pada: ${dateFormatted} | 🕒 Pukul: ${timeFormatted}
        </p>
    `;

    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.background = '#f1f5f9';
    wrapper.style.borderRadius = '12px';
    
    const containerClone = container.cloneNode(true);
    
    wrapper.appendChild(headerDiv);
    wrapper.appendChild(containerClone);
    document.body.appendChild(wrapper);

    html2canvas(wrapper, {
        scale: 2,
        backgroundColor: '#f1f5f9'
    }).then(canvas => {
        const link = document.createElement('a');
        const filename = `${reportTitle.replace(/[/\\?%*:|"<>]/g, '_')}_${now.toISOString().slice(0,10)}.png`;
        
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();

        document.body.removeChild(wrapper);
    }).catch(err => {
        alert("Gagal menyimpan gambar!");
        if (document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
        }
    });
}

// DOM Initializer
document.addEventListener("DOMContentLoaded", () => {
    renderStudentTable();
    updateHomeStats();
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