let semesters = JSON.parse(localStorage.getItem('grade-semesters') || '[]');
let currentSem = 0;

if (semesters.length === 0) {
  semesters.push({ name: 'Semester 1', subjects: [] });
}

function save() {
  localStorage.setItem('grade-semesters', JSON.stringify(semesters));
}

function getGrade(marks) {
  if (marks >= 90) return { grade: 'O', points: 10, color: '#10b981' };
  if (marks >= 80) return { grade: 'A+', points: 9, color: '#3b82f6' };
  if (marks >= 70) return { grade: 'A', points: 8, color: '#3b82f6' };
  if (marks >= 60) return { grade: 'B+', points: 7, color: '#f59e0b' };
  if (marks >= 50) return { grade: 'B', points: 6, color: '#f59e0b' };
  if (marks >= 40) return { grade: 'C', points: 5, color: '#f97316' };
  return { grade: 'F', points: 0, color: '#ef4444' };
}

function calcSGPA(subjects) {
  if (subjects.length === 0) return 0;
  const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);
  const totalPoints = subjects.reduce((s, sub) => {
    const { points } = getGrade(sub.marks);
    return s + points * sub.credits;
  }, 0);
  return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
}

function calcCGPA() {
  let totalCredits = 0;
  let totalPoints = 0;
  semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      const { points } = getGrade(sub.marks);
      totalCredits += sub.credits;
      totalPoints += points * sub.credits;
    });
  });
  return totalCredits === 0 ? '—' : (totalPoints / totalCredits).toFixed(2);
}

function addSemester() {
  semesters.push({ name: `Semester ${semesters.length + 1}`, subjects: [] });
  currentSem = semesters.length - 1;
  save();
  renderAll();
}

function deleteSemester(idx) {
  if (semesters.length === 1) { alert("Can't delete the only semester!"); return; }
  if (!confirm(`Delete ${semesters[idx].name}?`)) return;
  semesters.splice(idx, 1);
  currentSem = Math.min(currentSem, semesters.length - 1);
  save();
  renderAll();
}

function switchSem(idx) {
  currentSem = idx;
  renderAll();
}

function addSubject() {
  const name = document.getElementById('subjectName').value.trim();
  const credits = parseInt(document.getElementById('subjectCredits').value);
  const marks = parseFloat(document.getElementById('subjectMarks').value);
  const type = document.getElementById('subjectType').value;

  if (!name) { alert('Enter subject name!'); return; }
  if (isNaN(credits) || credits < 1) { alert('Enter valid credits!'); return; }
  if (isNaN(marks) || marks < 0 || marks > 100) { alert('Enter marks between 0-100!'); return; }

  semesters[currentSem].subjects.push({
    id: Date.now(), name, credits, marks, type
  });

  document.getElementById('subjectName').value = '';
  document.getElementById('subjectCredits').value = '';
  document.getElementById('subjectMarks').value = '';
  save();
  renderAll();
}

function deleteSubject(idx) {
  semesters[currentSem].subjects.splice(idx, 1);
  save();
  renderAll();
}

function renderSemTabs() {
  const list = document.getElementById('semList');
  list.innerHTML = semesters.map((sem, i) => {
    const sgpa = calcSGPA(sem.subjects);
    return `
      <div class="sem-tab ${i === currentSem ? 'active' : ''}"
           onclick="switchSem(${i})">
        ${sem.name}
        ${sgpa > 0 ? `<span class="sem-sgpa">${sgpa}</span>` : ''}
        <button class="delete-sem" onclick="event.stopPropagation();deleteSemester(${i})">✕</button>
      </div>`;
  }).join('');
}

function renderStats() {
  const allSubjects = semesters.flatMap(s => s.subjects);
  const cgpa = calcCGPA();
  const sgpa = calcSGPA(semesters[currentSem].subjects);
  const totalCredits = allSubjects.reduce((s, sub) => s + sub.credits, 0);

  document.getElementById('cgpaVal').textContent = cgpa;
  document.getElementById('sgpaVal').textContent = sgpa > 0 ? sgpa : '—';
  document.getElementById('creditsVal').textContent = totalCredits;
  document.getElementById('subjectsVal').textContent = allSubjects.length;

  const badge = document.getElementById('sgpaBadge');
  badge.textContent = sgpa > 0 ? `SGPA: ${sgpa}` : '';
}

function renderSubjectsTable() {
  const wrap = document.getElementById('subjectsWrap');
  const sem = semesters[currentSem];
  document.getElementById('semTitle').textContent = sem.name;

  if (sem.subjects.length === 0) {
    wrap.innerHTML = '<p class="empty-hint">Add subjects to track your grades</p>';
    return;
  }

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Type</th>
          <th>Credits</th>
          <th>Marks</th>
          <th>Grade</th>
          <th>Points</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${sem.subjects.map((sub, i) => {
          const { grade, points, color } = getGrade(sub.marks);
          return `
            <tr>
              <td>${sub.name}</td>
              <td style="color:#606070;">${sub.type}</td>
              <td>${sub.credits}</td>
              <td>${sub.marks}</td>
              <td class="grade-cell" style="color:${color};">${grade}</td>
              <td>${points}</td>
              <td><button class="del-btn" onclick="deleteSubject(${i})">✕</button></td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

let perfChart = null;
let cgpaChart = null;

function renderCharts() {
  const sem = semesters[currentSem];
  const subjects = sem.subjects;

  // Performance chart
  const perfCtx = document.getElementById('perfChart').getContext('2d');
  if (perfChart) perfChart.destroy();

  if (subjects.length > 0) {
    perfChart = new Chart(perfCtx, {
      type: 'bar',
      data: {
        labels: subjects.map(s => s.name.length > 12 ? s.name.slice(0, 12) + '...' : s.name),
        datasets: [{
          label: 'Marks',
          data: subjects.map(s => s.marks),
          backgroundColor: subjects.map(s => getGrade(s.marks).color),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0, max: 100,
            ticks: { color: '#606070', stepSize: 20 },
            grid: { color: '#1e1e3a' }
          },
          x: { ticks: { color: '#606070' }, grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // CGPA trend chart
  const cgpaCtx = document.getElementById('cgpaChart').getContext('2d');
  if (cgpaChart) cgpaChart.destroy();

  const cgpaData = semesters.map((sem, i) => ({
    label: `Sem ${i + 1}`,
    sgpa: parseFloat(calcSGPA(sem.subjects)) || 0
  }));

  cgpaChart = new Chart(cgpaCtx, {
    type: 'line',
    data: {
      labels: cgpaData.map(d => d.label),
      datasets: [{
        label: 'SGPA',
        data: cgpaData.map(d => d.sgpa),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#7c3aed',
        pointRadius: 5,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0, max: 10,
          ticks: { color: '#606070', stepSize: 2 },
          grid: { color: '#1e1e3a' }
        },
        x: { ticks: { color: '#606070' }, grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function exportReport() {
  const sem = semesters[currentSem];
  const sgpa = calcSGPA(sem.subjects);
  const cgpa = calcCGPA();

  let report = `GRADE REPORT — ${sem.name}\n`;
  report += `Generated: ${new Date().toLocaleDateString()}\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `Student: Kishalaya Sarangi\n`;
  report += `Institute: NIT Rourkela\n\n`;
  report += `${'='.repeat(50)}\n`;
  report += `SUBJECT DETAILS\n`;
  report += `${'='.repeat(50)}\n`;
  report += `${'Subject'.padEnd(30)} Credits  Marks  Grade  Points\n`;
  report += `${'-'.repeat(50)}\n`;

  sem.subjects.forEach(sub => {
    const { grade, points } = getGrade(sub.marks);
    report += `${sub.name.padEnd(30)} ${String(sub.credits).padEnd(8)} ${String(sub.marks).padEnd(6)} ${grade.padEnd(6)} ${points}\n`;
  });

  report += `\n${'='.repeat(50)}\n`;
  report += `SGPA (This Semester): ${sgpa}\n`;
  report += `CGPA (All Semesters): ${cgpa}\n`;
  report += `${'='.repeat(50)}\n`;
  report += `\n120 Days of Code · NIT Rourkela · Mechanical Engineering`;

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grade_report_${sem.name.replace(' ', '_')}.txt`;
  a.click();
}

function renderAll() {
  renderSemTabs();
  renderStats();
  renderSubjectsTable();
  renderCharts();
}

document.getElementById('subjectName').addEventListener('keydown', e => {
  if (e.key === 'Enter') addSubject();
});

window.onload = () => renderAll();