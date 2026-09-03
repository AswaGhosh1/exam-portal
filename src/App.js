import React, { useState, useEffect, useRef } from "react";
import {
  Users, ClipboardList, CalendarCheck, Link2, PlusCircle, Trash2, Clock,
  CheckCircle2, Upload, Send, GraduationCap, LayoutDashboard, ChevronLeft,
  ChevronRight, Award, BookOpen, Copy, Bell, AlertTriangle, Check, X,
  Timer, Shield, LogOut, Lock, KeyRound, RefreshCw, Settings as SettingsIcon,
  Download
} from "lucide-react";

/* ---------------------------------- helpers ---------------------------------- */

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const genPin = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const STORAGE_KEYS = {
  students: "exam_portal_students",
  notes: "exam_portal_notes",
  exams: "exam_portal_exams",
  attendance: "exam_portal_attendance",
  results: "exam_portal_results",
  notifications: "exam_portal_notifications",
  adminCreds: "exam_portal_admin",
  facultyAccounts: "exam_portal_faculty",
  settings: "exam_portal_settings",
};

const DEFAULT_ADMIN = { username: "admin", password: "admin123" };
const DEFAULT_SETTINGS = { title: " Exam Place"};

async function loadKey(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error("Error loading", key, e);
    return fallback;
  }
}

async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Error saving", key, e);
    return false;
  }
}

function exportAllData() {
  const allData = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const data = localStorage.getItem(key);
    if (data) {
      allData[key] = JSON.parse(data);
    }
  }
  return allData;
}

function importAllData(data) {
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function downloadBackup() {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `exam_portal_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function uploadBackup(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      importAllData(data);
      callback(null, data);
    } catch (error) {
      callback(error, null);
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  return new Date(d).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function pad(n) { return n.toString().padStart(2, "0"); }
const LETTERS = ["A", "B", "C", "D"];

/* ---------------------------------- shared styles ---------------------------------- */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    .portal-root {
      --bg: #EDEFE7; --paper: #F8F8F2; --surface: #FFFFFF; --ink: #1E2A22; --ink-soft: #4B564C;
      --muted: #7C8577; --line: #D8D9CC; --primary: #203D34; --primary-soft: #2E5346;
      --accent: #C7963C; --accent-soft: #E9D6A8; --danger: #B23A48; --success: #3F7A5D;
      font-family: 'Inter', sans-serif; color: var(--ink); background: var(--bg); min-height: 100vh;
      background-image: linear-gradient(var(--line) 1px, transparent 1px); background-size: 100% 28px;
    }
    .portal-root * { box-sizing: border-box; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; }

    .shell { display: flex; min-height: 100vh; }
    .sidebar { width: 226px; flex-shrink: 0; background: var(--primary); color: #EDEFE7; display: flex; flex-direction: column; padding: 22px 0; position: sticky; top: 0; height: 100vh; }
    .brand { padding: 0 20px 18px 20px; border-bottom: 1px solid rgba(237,239,231,0.15); margin-bottom: 10px; }
    .brand-title { font-size: 18px; font-weight: 700; line-height: 1.15; }
    .brand-sub { font-size: 11px; color: var(--accent-soft); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }

    .navtab { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13.5px; font-weight: 500; color: #D9DED3; cursor: pointer; border-left: 3px solid transparent; }
    .navtab:hover { background: rgba(237,239,231,0.06); }
    .navtab.active { background: var(--paper); color: var(--primary); border-left: 3px solid var(--accent); border-radius: 0 4px 4px 0; margin-right: 10px; font-weight: 600; }

    .user-box { margin: 14px 20px 0 20px; padding: 12px; background: rgba(0,0,0,0.18); border-radius: 8px; }
    .user-name { font-size: 13px; font-weight: 700; }
    .user-role { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-soft); margin-top: 2px; }
    .logout-btn { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #D9DED3; margin-top: 10px; cursor: pointer; }
    .logout-btn:hover { color: #fff; }

    .main { flex: 1; padding: 30px 38px 60px 38px; max-width: 1180px; }
    .page-title { font-size: 26px; font-weight: 600; margin-bottom: 3px; }
    .page-sub { color: var(--ink-soft); font-size: 13.5px; margin-bottom: 22px; }

    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px; position: relative; overflow: hidden; }
    .card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); }
    .card-plain { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px; }

    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 26px; }
    .stat-card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; }
    .stat-num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 600; color: var(--primary); }
    .stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 15px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-soft); }
    .btn-accent { background: var(--accent); color: #2A1F0A; }
    .btn-accent:hover { filter: brightness(1.05); }
    .btn-outline { background: transparent; border-color: var(--line); color: var(--ink); }
    .btn-outline:hover { border-color: var(--muted); }
    .btn-danger { background: transparent; color: var(--danger); border-color: rgba(178,58,72,0.3); }
    .btn-danger:hover { background: rgba(178,58,72,0.08); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-sm { padding: 6px 10px; font-size: 12px; }

    input, select, textarea { font-family: 'Inter', sans-serif; font-size: 13.5px; padding: 9px 11px; border-radius: 7px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); width: 100%; }
    input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
    label.field-label { font-size: 12px; font-weight: 600; color: var(--ink-soft); margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.03em; }

    table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); padding: 8px 10px; border-bottom: 2px solid var(--line); }
    td { padding: 10px; border-bottom: 1px solid var(--line); }
    tr:last-child td { border-bottom: none; }

    .pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .pill-green { background: rgba(63,122,93,0.12); color: var(--success); }
    .pill-red { background: rgba(178,58,72,0.1); color: var(--danger); }
    .pill-gold { background: var(--accent-soft); color: #6B4E17; }
    .pill-gray { background: #EEEDE4; color: var(--muted); }

    .admit-card { background: var(--paper); border: 2px dashed var(--accent); border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; position: relative; }
    .admit-seal { width: 46px; height: 46px; border-radius: 50%; background: var(--primary); color: var(--accent-soft); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 15px; flex-shrink: 0; border: 2px solid var(--accent); }
    .admit-code { font-family: 'IBM Plex Mono', monospace; font-size: 19px; font-weight: 600; letter-spacing: 0.12em; color: var(--primary); }

    .toast { position: fixed; bottom: 24px; right: 24px; background: var(--primary); color: #fff; padding: 12px 18px; border-radius: 8px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 50; max-width: 360px; }
    .toast.err { background: var(--danger); }

    .empty { text-align: center; padding: 40px 20px; color: var(--muted); }
    .empty svg { margin: 0 auto 10px auto; opacity: 0.5; }
    .divider { height: 1px; background: var(--line); margin: 18px 0; }

    .q-progress { display: flex; gap: 4px; margin-bottom: 18px; flex-wrap: wrap; }
    .q-dot { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border: 1px solid var(--line); color: var(--muted); cursor: pointer; }
    .q-dot.current { border-color: var(--primary); background: var(--primary); color: #fff; }
    .q-dot.answered { background: var(--accent-soft); border-color: var(--accent); color: #6B4E17; }

    .option-row { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
    .option-row:hover { border-color: var(--accent); background: rgba(199,150,60,0.05); }
    .option-row.selected { border-color: var(--primary); background: rgba(46,83,70,0.06); }
    .option-letter { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--line); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--muted); }
    .option-row.selected .option-letter { background: var(--primary); color: #fff; border-color: var(--primary); }

    .timer-badge { font-family: 'IBM Plex Mono', monospace; background: var(--primary); color: var(--accent-soft); padding: 8px 14px; border-radius: 8px; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 7px; }
    .timer-badge.low { background: var(--danger); color: #fff; }

    .notice { display: flex; gap: 10px; padding: 12px 14px; border-radius: 8px; background: #FBF4E4; border: 1px solid var(--accent-soft); font-size: 12.5px; color: #6B4E17; line-height: 1.5; }

    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .login-card { width: 100%; max-width: 420px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 30px 30px 26px 30px; position: relative; overflow: hidden; }
    .login-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent); }
    .role-pills { display: flex; gap: 6px; background: var(--paper); border: 1px solid var(--line); border-radius: 9px; padding: 4px; margin-bottom: 22px; }
    .role-pill { flex: 1; text-align: center; padding: 8px 4px; font-size: 12.5px; font-weight: 600; border-radius: 6px; cursor: pointer; color: var(--ink-soft); display: flex; align-items: center; justify-content: center; gap: 5px; }
    .role-pill.active { background: var(--primary); color: #fff; }

    .ans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .ans-btn { border: 1px solid var(--line); border-radius: 7px; padding: 8px 0; text-align: center; font-weight: 700; font-size: 13px; cursor: pointer; color: var(--ink-soft); }
    .ans-btn.on { background: var(--primary); color: #fff; border-color: var(--primary); }

    .pdf-frame { width: 100%; height: 520px; border: 1px solid var(--line); border-radius: 8px; background: #E9E9E1; }
  `}</style>
);

/* ---------------------------------- root ---------------------------------- */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [exams, setExams] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminCreds, setAdminCreds] = useState(DEFAULT_ADMIN);
  const [facultyAccounts, setFacultyAccounts] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const examPdfUrls = useRef({});
  const [pdfVersion, setPdfVersion] = useState(0);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(msg, kind = "success") {
    setToast({ msg, kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    (async () => {
      const [s, n, e, a, r, no, ac, fa, se] = await Promise.all([
        loadKey(STORAGE_KEYS.students, []),
        loadKey(STORAGE_KEYS.notes, []),
        loadKey(STORAGE_KEYS.exams, []),
        loadKey(STORAGE_KEYS.attendance, {}),
        loadKey(STORAGE_KEYS.results, []),
        loadKey(STORAGE_KEYS.notifications, []),
        loadKey(STORAGE_KEYS.adminCreds, DEFAULT_ADMIN),
        loadKey(STORAGE_KEYS.facultyAccounts, []),
        loadKey(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
      ]);
      setStudents(s); setNotes(n); setExams(e); setAttendance(a); setResults(r);
      setNotifications(no); setAdminCreds(ac); setFacultyAccounts(fa); setSettings(se);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const restorePDFs = async () => {
      const storedExams = await loadKey(STORAGE_KEYS.exams, []);
      for (const exam of storedExams) {
        if (exam.fileData) {
          try {
            const response = await fetch(exam.fileData);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            examPdfUrls.current = { ...examPdfUrls.current, [exam.id]: url };
          } catch (e) {
            console.error("Failed to restore file for exam", exam.id);
          }
        }
      }
      setPdfVersion((v) => v + 1);
    };
    restorePDFs();
  }, []);

  const persistStudents = (v) => { setStudents(v); saveKey(STORAGE_KEYS.students, v); };
  const persistNotes = (v) => { setNotes(v); saveKey(STORAGE_KEYS.notes, v); };
  const persistExams = (v) => { setExams(v); saveKey(STORAGE_KEYS.exams, v); };
  const persistAttendance = (v) => { setAttendance(v); saveKey(STORAGE_KEYS.attendance, v); };
  const persistResults = (v) => { setResults(v); saveKey(STORAGE_KEYS.results, v); };
  const persistNotifications = (v) => { setNotifications(v); saveKey(STORAGE_KEYS.notifications, v); };
  const persistAdminCreds = (v) => { setAdminCreds(v); saveKey(STORAGE_KEYS.adminCreds, v); };
  const persistFacultyAccounts = (v) => { setFacultyAccounts(v); saveKey(STORAGE_KEYS.facultyAccounts, v); };
  const persistSettings = (v) => { setSettings(v); saveKey(STORAGE_KEYS.settings, v); };

  function setExamPdf(examId, url) {
    examPdfUrls.current = { ...examPdfUrls.current, [examId]: url };
    setPdfVersion((v) => v + 1);
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "faculty", "student"] },
    { id: "students", label: "Students", icon: Users, roles: ["faculty"] },
    { id: "notes", label: "Notes", icon: BookOpen, roles: ["admin", "faculty", "student"] },
    { id: "exams", label: "Exams", icon: ClipboardList, roles: ["faculty"] },
    { id: "takeexam", label: "Take Exam", icon: GraduationCap, roles: ["student"] },
    { id: "attendance", label: "Attendance", icon: CalendarCheck, roles: ["admin", "faculty"] },
    { id: "results", label: "Results", icon: Award, roles: ["admin", "faculty", "student"] },
    { id: "admin", label: "Admin panel", icon: Shield, roles: ["admin"] },
  ];

  if (loading) {
    return (
      <div className="portal-root"><GlobalStyles /><div className="empty" style={{ paddingTop: 80 }}>Loading portal…</div></div>
    );
  }

  if (!currentUser) {
    return (
      <div className="portal-root"><GlobalStyles />
        <LoginScreen
          settings={settings} adminCreds={adminCreds} facultyAccounts={facultyAccounts} students={students}
          onLogin={(u) => { setCurrentUser(u); setTab("dashboard"); }} showToast={showToast}
        />
      </div>
    );
  }

  const visibleNav = NAV.filter((n) => n.roles.includes(currentUser.role));

  return (
    <div className="portal-root">
      <GlobalStyles />
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-title font-display">{settings.title}</div>
            <div className="brand-sub">{settings.subtitle}</div>
          </div>
          {visibleNav.map((n) => (
            <div key={n.id} className={`navtab ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
              <n.icon size={16} /> {n.label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div className="user-box">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role">{currentUser.role}</div>
            <div className="logout-btn" onClick={() => setCurrentUser(null)}><LogOut size={13} /> Log out</div>
          </div>
        </aside>

        <main className="main">
          {tab === "dashboard" && (
            <Dashboard students={students} exams={exams} notes={notes} attendance={attendance} results={results} currentUser={currentUser} setTab={setTab} />
          )}
          {tab === "students" && currentUser.role === "faculty" && (
            <StudentsTab students={students} setStudents={persistStudents} showToast={showToast} />
          )}
          {tab === "notes" && (
            <NotesTab notes={notes} setNotes={persistNotes} currentUser={currentUser} showToast={showToast} />
          )}
          {tab === "exams" && currentUser.role === "faculty" && (
            <ExamsTab exams={exams} setExams={persistExams} students={students}
              notifications={notifications} setNotifications={persistNotifications}
              examPdfUrls={examPdfUrls.current} setExamPdf={setExamPdf} showToast={showToast} />
          )}
          {tab === "takeexam" && currentUser.role === "student" && (
            <TakeExamTab exams={exams} results={results} setResults={persistResults}
              examPdfUrls={examPdfUrls.current} currentUser={currentUser} showToast={showToast} />
          )}
          {tab === "attendance" && ["admin", "faculty"].includes(currentUser.role) && (
            <AttendanceTab students={students} attendance={attendance} setAttendance={persistAttendance} showToast={showToast} />
          )}
          {tab === "results" && (
            <ResultsTab exams={exams} results={results} currentUser={currentUser} />
          )}
          {tab === "admin" && currentUser.role === "admin" && (
            <AdminPanel settings={settings} setSettings={persistSettings} adminCreds={adminCreds}
              setAdminCreds={persistAdminCreds} facultyAccounts={facultyAccounts}
              setFacultyAccounts={persistFacultyAccounts} showToast={showToast} />
          )}
        </main>
      </div>

      {toast && (
        <div className={`toast ${toast.kind === "error" ? "err" : ""}`}>
          {toast.kind === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Login ---------------------------------- */

function LoginScreen({ settings, adminCreds, facultyAccounts, students, onLogin, showToast }) {
  const [adminMode, setAdminMode] = useState(() => {
    const secretPath = process.env.REACT_APP_ADMIN_SECRET_PATH || 'admin-secret';
    return typeof window !== "undefined" && window.location.hash === `#${secretPath}`;
  });
  
  const [role, setRole] = useState("student");
  const [idField, setIdField] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcut for desktop
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A' && !adminMode) {
        setAdminMode(true);
        showToast("Admin mode activated", "success");
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [adminMode]);

  function openAdmin() {
    setAdminMode(true);
    setIdField("");
    setPassword("");
    if (typeof window !== "undefined") window.location.hash = "admin-secret";
  }

  function closeAdmin() {
    setAdminMode(false);
    setIdField("");
    setPassword("");
    if (typeof window !== "undefined" && window.location.hash === "#admin-secret") {
      window.location.hash = "";
    }
  }

  function submitRegular() {
    // Trim inputs for better matching
    const trimmedId = idField.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedId || !trimmedPassword) {
      showToast("Please enter your username and password.", "error");
      return;
    }

    setIsLoading(true);

    if (role === "faculty") {
      // Faculty login - case insensitive username
      const acc = facultyAccounts.find(
        (f) => f.username.toLowerCase() === trimmedId.toLowerCase() && f.password === trimmedPassword
      );
      if (acc) {
        onLogin({ role: "faculty", id: acc.id, name: acc.name });
        showToast(`Welcome ${acc.name}!`, "success");
      } else {
        showToast("❌ Incorrect faculty username or password.", "error");
        setPassword('');
      }
    } else {
      // Student login - case insensitive username
      const student = students.find(
        (st) => st.username && st.username.toLowerCase() === trimmedId.toLowerCase()
      );
      
      if (student) {
        if (student.password === trimmedPassword) {
          onLogin({ 
            role: "student", 
            id: student.id, 
            name: student.name, 
            username: student.username 
          });
          showToast(`Welcome ${student.name}!`, "success");
        } else {
          showToast("❌ Incorrect password. Please try again.", "error");
          setPassword('');
        }
      } else {
        showToast("❌ No student found with this username. Please check with your faculty.", "error");
        setPassword('');
      }
    }
    setIsLoading(false);
  }

  function submitAdmin() {
    const trimmedId = idField.trim();
    const trimmedPassword = password.trim();
    
    if (trimmedId === adminCreds.username && trimmedPassword === adminCreds.password) {
      onLogin({ role: "admin", id: "admin", name: "Administrator" });
      showToast("Admin login successful", "success");
    } else {
      showToast("❌ Incorrect admin username or password.", "error");
      setPassword('');
    }
  }

  if (adminMode) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div className="admit-seal" style={{ margin: "0 auto 12px auto" }}>
              <Shield size={18} />
            </div>
            <div className="font-display" style={{ fontSize: 21, fontWeight: 700 }}>
              Admin Sign-In
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
              Restricted area — site administrators only
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="field-label">Username</label>
            <input 
              value={idField} 
              onChange={(e) => setIdField(e.target.value)} 
              placeholder="Enter admin username"
              autoFocus
              style={{ fontSize: "16px", padding: "12px" }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && submitAdmin()} 
              placeholder="Enter admin password"
              style={{ fontSize: "16px", padding: "12px" }}
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "16px" }} 
            onClick={submitAdmin}
          >
            <Lock size={14} /> Log in
          </button>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <span 
              style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }} 
              onClick={closeAdmin}
            >
              ← Back to student / faculty sign-in
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="admit-seal" style={{ margin: "0 auto 12px auto" }}>
            {settings.title.slice(0, 2).toUpperCase()}
          </div>
          <div className="font-display" style={{ fontSize: 21, fontWeight: 700 }}>
            {settings.title}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
            Sign in to continue
          </div>
        </div>

        <div className="role-pills">
          <div 
            className={`role-pill ${role === "student" ? "active" : ""}`} 
            onClick={() => { setRole("student"); setIdField(""); setPassword(""); }}
            style={{ padding: "12px 4px", fontSize: "14px" }}
          >
            <GraduationCap size={16} /> Student
          </div>
          <div 
            className={`role-pill ${role === "faculty" ? "active" : ""}`} 
            onClick={() => { setRole("faculty"); setIdField(""); setPassword(""); }}
            style={{ padding: "12px 4px", fontSize: "14px" }}
          >
            <Users size={16} /> Faculty
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="field-label">{role === "student" ? "Username" : "Username"}</label>
          <input 
            value={idField} 
            onChange={(e) => setIdField(e.target.value)} 
            placeholder={role === "student" ? "Enter your username" : "Enter username"}
            style={{ fontSize: "16px", padding: "12px" }}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="field-label">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && submitRegular()} 
            placeholder="Enter your password"
            style={{ fontSize: "16px", padding: "12px" }}
          />
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "16px" }} 
          onClick={submitRegular}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw size={14} className="spin" /> : <Lock size={14} />} 
          {isLoading ? " Logging in..." : " Log in"}
        </button>

        {role === "faculty" && (
          <div className="notice" style={{ marginTop: 16 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>Faculty accounts are created by an admin — ask your administrator if you don't have one yet.</div>
          </div>
        )}
        {role === "student" && (
          <div className="notice" style={{ marginTop: 16 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>Use the username and password your faculty gave you when you were added to the roster.</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "var(--muted)" }}>
          🔒 Secure login
        </div>

        {/* Hidden admin tap area - tap 7 times on the bottom */}
        <div 
          style={{ 
            position: "absolute", 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: "40px",
            cursor: "pointer",
            zIndex: 10,
            opacity: 0.3,
            backgroundColor: "transparent",
            borderBottomLeftRadius: "14px",
            borderBottomRightRadius: "14px"
          }} 
          onClick={openAdmin}
          onTouchStart={openAdmin}
          title="Tap to access admin"
        />
      </div>
    </div>
  );
}

/* ---------------------------------- Dashboard ---------------------------------- */

function Dashboard({ students, exams, notes, attendance, results, currentUser, setTab }) {
  const upcoming = exams.filter((e) => new Date(e.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const attendanceDates = Object.keys(attendance);
  let avgAttendance = 0;
  if (attendanceDates.length && students.length) {
    let presentCount = 0, total = 0;
    attendanceDates.forEach((d) => students.forEach((s) => { total += 1; if (attendance[d][s.id] === "present") presentCount += 1; }));
    avgAttendance = total ? Math.round((presentCount / total) * 100) : 0;
  }

  const myResults = currentUser.role === "student" ? results.filter((r) => r.studentId === currentUser.id) : results;

  return (
    <div>
      <div className="page-title font-display">Welcome, {currentUser.name.split(" ")[0]}</div>
      <div className="page-sub">Overview of students, exams, notes and attendance.</div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{students.length}</div><div className="stat-label">Registered students</div></div>
        <div className="stat-card"><div className="stat-num">{exams.length}</div><div className="stat-label">Exams created</div></div>
        <div className="stat-card"><div className="stat-num">{notes.length}</div><div className="stat-label">Notes uploaded</div></div>
        <div className="stat-card"><div className="stat-num">{currentUser.role === "student" ? myResults.length : (attendanceDates.length ? `${avgAttendance}%` : "—")}</div>
          <div className="stat-label">{currentUser.role === "student" ? "Exams attempted" : "Avg. attendance"}</div></div>
      </div>

      <div className="card-plain" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Upcoming exams</div>
        {upcoming.length === 0 ? (
          <div className="empty"><ClipboardList size={30} /><div>No exams scheduled yet.</div></div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {upcoming.slice(0, 5).map((e) => (
              <div key={e.id} className="admit-card">
                <div className="admit-seal">{e.subject ? e.subject.slice(0, 2).toUpperCase() : "EX"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{e.subject} · {fmtDateTime(e.scheduledAt)} · {e.durationMins} min</div>
                </div>
                <div className="admit-code">{e.code}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card-plain">
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 15 }}>Recent notes</div>
          {notes.length === 0 ? <div className="empty" style={{ padding: "20px 0" }}>Nothing uploaded yet.</div> : (
            <div style={{ display: "grid", gap: 8 }}>
              {notes.slice(-4).reverse().map((n) => (
                <div key={n.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{n.title}</span><span style={{ color: "var(--muted)" }}>{fmtDate(n.uploadedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-plain">
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 15 }}>{currentUser.role === "student" ? "My recent results" : "Recent results"}</div>
          {myResults.length === 0 ? <div className="empty" style={{ padding: "20px 0" }}>No submissions yet.</div> : (
            <div style={{ display: "grid", gap: 8 }}>
              {myResults.slice(-4).reverse().map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{currentUser.role === "student" ? r.examTitle : r.studentName}</span>
                  <span style={{ fontWeight: 600 }}>{r.score}/{r.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

//* ---------------------------------- Students ---------------------------------- */

function StudentsTab({ students, setStudents, showToast }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(genPin());
  const [search, setSearch] = useState("");

  function addStudent() {
    if (!name.trim() || !username.trim() || !phone.trim() || !password.trim()) {
      showToast("Fill in name, username, phone and a password.", "error"); 
      return; 
    }
    if (students.some((s) => s.username.toLowerCase() === username.trim().toLowerCase())) { 
      showToast("A student with this username already exists.", "error"); 
      return; 
    }
    
const rec = { 
  id: uid(), 
  name: name.trim(), 
  username: username.trim().toLowerCase(), 
  phone: phone.trim(), 
  password: password.trim(), 
  addedAt: new Date().toISOString() 
};
    setStudents([...students, rec]);
    setName(""); 
    setUsername(""); 
    setPhone(""); 
    setPassword(genPin());
    showToast(`${rec.name} added — share their login (username + password) with them.`);
  }
  
  function removeStudent(id) { 
    setStudents(students.filter((s) => s.id !== id)); 
    showToast("Student removed."); 
  }

  const filtered = students.filter((s) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-title font-display">Students</div>
      <div className="page-sub">Add students with a login so they can sign in and take exams.</div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Add a student</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.9fr 0.9fr auto", gap: 12, alignItems: "end" }}>
          <div><label className="field-label">Full name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anjali Nair" /></div>
          <div><label className="field-label">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="anjali123" /></div>
          <div><label className="field-label">Phone number</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
          <div>
            <label className="field-label">Login password</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={() => setPassword(genPin())} title="Generate"><RefreshCw size={13} /></button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={addStudent}><PlusCircle size={15} /> Add student</button>
        </div>
      </div>

      <div className="card-plain">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Roster ({students.length})</div>
          <input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
        </div>
        {filtered.length === 0 ? (
          <div className="empty"><Users size={30} /><div>No students found. Add your first student above.</div></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Phone</th><th>Password</th><th></th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="font-mono">{s.username}</td>
                  <td className="font-mono">{s.phone}</td>
                  <td className="font-mono">{s.password}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeStudent(s.id)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="notice" style={{ marginTop: 14 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>Passwords are shown in plain text here to make sharing easy in this demo. A production rollout should hash passwords and never display them after creation.</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Notes ---------------------------------- */

function NotesTab({ notes, setNotes, currentUser, showToast }) {
  const canEdit = ["admin", "faculty"].includes(currentUser.role);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [fileInfo, setFileInfo] = useState(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFileInfo({ name: f.name, previewUrl: URL.createObjectURL(f) });
  }
  function addNote() {
    if (!title.trim()) { showToast("Give the note a title.", "error"); return; }
    const rec = { id: uid(), title: title.trim(), subject: subject.trim(), description: description.trim(), fileName: fileInfo ? fileInfo.name : null, uploadedAt: new Date().toISOString() };
    setNotes([...notes, rec]);
    setTitle(""); setSubject(""); setDescription(""); setFileInfo(null);
    showToast("Note uploaded.");
  }
  function removeNote(id) { setNotes(notes.filter((n) => n.id !== id)); }

  return (
    <div>
      <div className="page-title font-display">Notes</div>
      <div className="page-sub">Upload study material and reference notes for students.</div>

      {canEdit && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Upload a note</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label className="field-label">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thermodynamics — Chapter 4" /></div>
            <div><label className="field-label">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Physics" /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="field-label">Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's covered in this note…" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
              <Upload size={13} /> Choose PDF
              <input type="file" accept="application/pdf" onChange={handleFile} style={{ display: "none" }} />
            </label>
            {fileInfo && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{fileInfo.name}</span>}
          </div>
          <div className="notice" style={{ marginBottom: 14 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>The title and description are saved for everyone. The PDF itself only previews in this browser session — permanent file storage needs a small backend (e.g. an S3 bucket), which I can help set up.</div>
          </div>
          <button className="btn btn-primary" onClick={addNote}><PlusCircle size={15} /> Save note</button>
        </div>
      )}

      <div className="card-plain">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>All notes ({notes.length})</div>
        {notes.length === 0 ? <div className="empty"><BookOpen size={30} /><div>No notes uploaded yet.</div></div> : (
          <div style={{ display: "grid", gap: 10 }}>
            {notes.slice().reverse().map((n) => (
              <div key={n.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{n.title} {n.subject && <span className="pill pill-gray" style={{ marginLeft: 6 }}>{n.subject}</span>}</div>
                  {n.description && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3 }}>{n.description}</div>}
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{n.fileName ? `${n.fileName} · ` : ""}{fmtDate(n.uploadedAt)}</div>
                </div>
                {canEdit && <button className="btn btn-danger btn-sm" onClick={() => removeNote(n.id)}><Trash2 size={13} /></button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Exams ---------------------------------- */

function ExamsTab({ exams, setExams, students, notifications, setNotifications, examPdfUrls, setExamPdf, showToast }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [answerKey, setAnswerKey] = useState(Array(10).fill(0));
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");

  function changeTotalQuestions(val) {
    const n = Math.max(1, Math.min(200, Number(val) || 1));
    setTotalQuestions(n);
    setAnswerKey((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push(0);
      return next;
    });
  }

  function resetForm() {
    setTitle(""); setSubject(""); setDate(""); setTime(""); setDuration(30);
    setTotalQuestions(10); setAnswerKey(Array(10).fill(0)); setFile(null); setFileType(""); setCreating(false);
  }

  async function saveExam() {
    if (!title.trim() || !date || !time) { 
      showToast("Fill in the title, date and time.", "error"); 
      return; 
    }
    
    if (!file) { 
      showToast("Upload the question paper (PDF or DOC).", "error"); 
      return; 
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedTypes = ['pdf', 'doc', 'docx'];
    if (!allowedTypes.includes(fileExtension)) {
      showToast(`Please upload a PDF or DOC file. You uploaded a .${fileExtension} file.`, "error");
      return;
    }
    
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    const id = uid();
    const fileBase64 = await fileToBase64(file);
    
    const rec = {
      id, 
      code: genCode(), 
      title: title.trim(), 
      subject: subject.trim(), 
      scheduledAt,
      durationMins: Number(duration) || 30, 
      totalQuestions, 
      correctAnswers: answerKey,
      fileName: file.name, 
      fileType: fileExtension,
      notified: false, 
      createdAt: new Date().toISOString(),
      fileData: fileBase64
    };
    
    const blob = new Blob([file], { type: file.type || 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);
    setExamPdf(id, blobUrl);
    
    const updatedExams = [...exams, rec];
    setExams(updatedExams);
    await saveKey(STORAGE_KEYS.exams, updatedExams);
    
    resetForm();
    showToast(`"${rec.title}" scheduled with ${file.name}. Link code: ${rec.code}`);
  }

  function removeExam(id) { 
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    saveKey(STORAGE_KEYS.exams, updated);
    showToast("Exam removed.");
  }

  function notifyStudents(exam) {
    if (students.length === 0) { 
      showToast("Add students first — there's no one to notify yet.", "error"); 
      return; 
    }
    const link = `https://your-school-domain.com/exam/${exam.code}`;
    const entries = students.map((s) => ({ 
      id: uid(), 
      examId: exam.id, 
      examTitle: exam.title, 
      studentName: s.name, 
      email: s.email, 
      phone: s.phone, 
      link, 
      sentAt: new Date().toISOString() 
    }));
    const updated = [...notifications, ...entries];
    setNotifications(updated);
    saveKey(STORAGE_KEYS.notifications, updated);
    const updatedExams = exams.map((e) => (e.id === exam.id ? { ...e, notified: true } : e));
    setExams(updatedExams);
    saveKey(STORAGE_KEYS.exams, updatedExams);
    showToast(`Simulated email + SMS sent to ${students.length} student(s).`);
  }

  function copyLink(exam) {
    const link = `https://your-school-domain.com/exam/${exam.code}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    showToast("Exam link copied.");
  }

  function previewFile(exam) {
    const url = examPdfUrls[exam.id];
    if (!url) { 
      showToast("This file isn't available in the current browser session.", "error"); 
      return; 
    }
    window.open(url, "_blank");
  }

  function getFileIcon(fileType) {
    if (fileType === 'pdf') return '📄';
    if (fileType === 'doc' || fileType === 'docx') return '📝';
    return '📎';
  }

  return (
    <div>
      <div className="page-title font-display">Exams</div>
      <div className="page-sub">Upload a question paper (PDF or DOC) and conduct the mock test.</div>

      {!creating ? (
        <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={() => setCreating(true)}>
          <PlusCircle size={15} /> Schedule new exam
        </button>
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>New exam</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.7fr", gap: 12, marginBottom: 14 }}>
            <div><label className="field-label">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Unit Test 1" /></div>
            <div><label className="field-label">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Chemistry" /></div>
            <div><label className="field-label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="field-label">Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div><label className="field-label">Duration (min)</label><input type="number" min="5" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Question paper (PDF or DOC/DOCX) — required</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                <Upload size={13} /> Upload PDF or DOC/DOCX
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  style={{ display: "none" }} 
                  onChange={(e) => {
                    const selectedFile = e.target.files[0] || null;
                    if (selectedFile) {
                      const ext = selectedFile.name.split('.').pop().toLowerCase();
                      if (['pdf', 'doc', 'docx'].includes(ext)) {
                        setFile(selectedFile);
                        setFileType(ext);
                      } else {
                        showToast("Please upload a PDF or DOC file.", "error");
                        e.target.value = '';
                      }
                    }
                  }} 
                />
              </label>
              {file && (
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {getFileIcon(fileType)} {file.name} ({fileType.toUpperCase()})
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              Supported formats: PDF, DOC, DOCX
            </div>
          </div>

          <div className="divider" />
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 14 }}>
            <div style={{ width: 200 }}>
              <label className="field-label">Number of questions</label>
              <input type="number" min="1" value={totalQuestions} onChange={(e) => changeTotalQuestions(e.target.value)} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {fileType === 'pdf' ? (
                "Students will read questions from the PDF and select answers below."
              ) : (
                "Students will read questions from the document viewer and select answers below."
              )}
            </div>
          </div>

          <div style={{ fontWeight: 600, marginBottom: 8 }}>Answer key</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, maxHeight: 260, overflowY: "auto", marginBottom: 16 }}>
            {answerKey.map((val, i) => (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Question {i + 1}</div>
                <div className="ans-grid">
                  {LETTERS.map((l, oi) => (
                    <div key={oi} className={`ans-btn ${val === oi ? "on" : ""}`} onClick={() => setAnswerKey(answerKey.map((v, idx) => (idx === i ? oi : v)))}>{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="divider" />
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={saveExam}>
              <CheckCircle2 size={15} /> Save &amp; schedule exam
            </button>
            <button className="btn btn-outline" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {exams.length === 0 && <div className="empty"><ClipboardList size={30} /><div>No exams yet — schedule your first mock test above.</div></div>}
        {exams.slice().reverse().map((exam) => {
          const isPast = new Date(exam.scheduledAt).getTime() < Date.now();
          const fileIcon = getFileIcon(exam.fileType || 'pdf');
          const fileTypeLabel = (exam.fileType || 'pdf').toUpperCase();
          
          return (
            <div key={exam.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {exam.title} {exam.subject && <span className="pill pill-gray">{exam.subject}</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
                    {fmtDateTime(exam.scheduledAt)} · {exam.durationMins} min · {exam.totalQuestions} question{exam.totalQuestions !== 1 ? "s" : ""} · 
                    {fileIcon} {exam.fileName} ({fileTypeLabel})
                    {isPast && <span className="pill pill-gray" style={{ marginLeft: 8 }}>Past</span>}
                    {exam.notified && <span className="pill pill-green" style={{ marginLeft: 8 }}><Bell size={10} /> Notified</span>}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeExam(exam.id)}><Trash2 size={13} /></button>
              </div>

              <div className="admit-card" style={{ marginBottom: 12 }}>
                <div className="admit-seal">{exam.subject ? exam.subject.slice(0, 2).toUpperCase() : "EX"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Exam access code</div>
                  <div className="admit-code">{exam.code}</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => copyLink(exam)}><Copy size={13} /> Copy link</button>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-accent btn-sm" onClick={() => notifyStudents(exam)}>
                  <Send size={13} /> {exam.notified ? "Re-notify students" : "Notify students (email + SMS)"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => previewFile(exam)}>
                  <BookOpen size={13} /> Preview {fileTypeLabel} file
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {notifications.length > 0 && (
        <div className="card-plain" style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Notification log</div>
          <div className="notice" style={{ marginBottom: 12 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>These entries simulate what would be sent. Real delivery needs a provider like SendGrid (email) or Twilio (SMS) behind a small backend.</div>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            <table>
              <thead><tr><th>Student</th><th>Exam</th><th>Email</th><th>Phone</th><th>Sent</th></tr></thead>
              <tbody>
                {notifications.slice().reverse().slice(0, 25).map((n) => (
                  <tr key={n.id}><td>{n.studentName}</td><td>{n.examTitle}</td><td>{n.email}</td><td className="font-mono">{n.phone}</td><td style={{ color: "var(--muted)" }}>{fmtDateTime(n.sentAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Take Exam ---------------------------------- */

function TakeExamTab({ exams, results, setResults, examPdfUrls, currentUser, showToast }) {
  const [code, setCode] = useState("");
  const [exam, setExam] = useState(null);
  const [started, setStarted] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(null);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [pdfQuestions, setPdfQuestions] = useState([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [fileType, setFileType] = useState("pdf");
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (!started || finished) return;
    if (secondsLeft <= 0) { submitExam(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, started, finished]);

  function findExam() {
    const found = exams.find((e) => e.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) { showToast("No exam found with that code.", "error"); return; }
    setExam(found);
    setPdfQuestions([]);
    setPdfError(false);
    setShowReview(false);
    if (found.fileType) {
      setFileType(found.fileType);
    } else {
      const ext = found.fileName ? found.fileName.split('.').pop().toLowerCase() : 'pdf';
      setFileType(ext);
    }
  }

  async function beginExam() {
    const already = results.find((r) => r.examId === exam.id && r.studentId === currentUser.id);
    if (already) { 
      setFinished(already); 
      setShowReview(true);
      return; 
    }
    
    setAnswers({}); 
    setQIndex(0); 
    setSecondsLeft(exam.durationMins * 60); 
    setStarted(true);
    setPdfError(false);
    setShowReview(false);
    
    const fileUrl = examPdfUrls[exam.id];
    if (fileUrl) {
      await extractQuestionsFromFile(fileUrl);
    } else {
      setPdfError(true);
      showToast("No file found. Please contact your faculty.", "warning");
    }
  }

  async function extractQuestionsFromFile(fileUrl) {
    setIsLoadingPdf(true);
    setPdfError(false);
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const fileExtension = fileUrl.split('.').pop().toLowerCase();
      const isDoc = fileExtension === 'doc' || fileExtension === 'docx' || 
                     blob.type === 'application/msword' || 
                     blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (isDoc) {
        setFileType('doc');
      } else {
        setFileType('pdf');
      }
      
      let text = '';
      
      if (isDoc) {
        try {
          const mammoth = await import('mammoth');
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
          console.log("DOC text extracted, length:", text.length);
        } catch (e) {
          console.error("Mammoth extraction failed:", e);
          const arrayBuffer = await blob.arrayBuffer();
          text = await extractTextFromBuffer(arrayBuffer);
        }
      } else {
        const arrayBuffer = await blob.arrayBuffer();
        text = await extractTextFromBuffer(arrayBuffer);
      }
      
      if (text && text.trim().length > 10) {
        const questions = parseQuestionsImproved(text, exam.totalQuestions);
        setPdfQuestions(questions);
        if (questions.length > 0) {
          showToast(`✅ Extracted ${questions.length} questions from the file`, "success");
        } else {
          showToast("⚠️ Could not find questions. Please read from the viewer.", "warning");
          setPdfError(true);
        }
      } else {
        showToast("⚠️ Could not extract text. Please read from the viewer.", "warning");
        setPdfError(true);
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      showToast("❌ Could not extract questions. Please read from the viewer.", "error");
      setPdfError(true);
    } finally {
      setIsLoadingPdf(false);
    }
  }

  async function extractTextFromBuffer(buffer) {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      const cleanText = text.replace(/[^\x20-\x7E\n\r]/g, ' ');
      return cleanText;
    } catch (e) {
      console.error("Text extraction failed:", e);
      return '';
    }
  }

  function parseQuestionsImproved(text, totalQuestions) {
    const questions = [];
    
    let cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
    
    const lines = cleanText.split('\n');
    
    let currentQuestion = null;
    let currentOptions = [];
    
    const questionPatterns = [
      /^(\d+)[\.\)]\s*(.+)/,
      /^Q(\d+)[\.\)]\s*(.+)/i,
      /^Question\s*(\d+)[\.\)]\s*(.+)/i,
      /^(\d+)\s+([A-Z][a-z].+)/,
    ];
    
    const optionPatterns = [
      /^([A-D])[\.\)]\s*(.+)/,
      /^([a-d])[\.\)]\s*(.+)/,
      /^\(([A-D])\)\s*(.+)/,
      /^([A-D])\s+([A-Z].+)/,
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let isQuestion = false;
      let questionMatch = null;
      
      for (const pattern of questionPatterns) {
        const match = line.match(pattern);
        if (match) {
          questionMatch = match;
          isQuestion = true;
          break;
        }
      }
      
      if (isQuestion && questionMatch) {
        if (currentQuestion && currentOptions.length > 0) {
          questions.push({
            id: questions.length,
            text: currentQuestion,
            options: currentOptions.slice(0, 4)
          });
        }
        
        currentQuestion = questionMatch[2] || questionMatch[1] || line;
        currentOptions = [];
      } else {
        let isOption = false;
        let optionMatch = null;
        
        for (const pattern of optionPatterns) {
          const match = line.match(pattern);
          if (match) {
            optionMatch = match;
            isOption = true;
            break;
          }
        }
        
        if (isOption && optionMatch && currentQuestion) {
          const optionText = optionMatch[2] || optionMatch[1] || line;
          currentOptions.push(optionText.trim());
        } else if (currentQuestion && currentOptions.length > 0) {
          const lastIndex = currentOptions.length - 1;
          currentOptions[lastIndex] = currentOptions[lastIndex] + ' ' + line;
        } else if (currentQuestion) {
          currentQuestion = currentQuestion + ' ' + line;
        }
      }
    }
    
    if (currentQuestion && currentOptions.length > 0) {
      questions.push({
        id: questions.length,
        text: currentQuestion,
        options: currentOptions.slice(0, 4)
      });
    }
    
    if (questions.length === 0) {
      const blocks = cleanText.split(/\n(?=\d+[\.\)]\s+)/);
      
      for (const block of blocks) {
        const lines2 = block.split('\n');
        let qText = '';
        let opts = [];
        
        for (const line of lines2) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          const optMatch = trimmed.match(/^([A-D])[\.\)]\s*(.+)/);
          if (optMatch) {
            opts.push(optMatch[2].trim());
          } else if (opts.length === 0) {
            qText += trimmed + ' ';
          }
        }
        
        if (qText.trim() && opts.length > 0) {
          questions.push({
            id: questions.length,
            text: qText.trim(),
            options: opts.slice(0, 4)
          });
        }
      }
    }
    
    if (questions.length === 0) {
      for (let i = 0; i < Math.min(totalQuestions, 100); i++) {
        questions.push({
          id: i,
          text: `Question ${i + 1}`,
          options: ['A', 'B', 'C', 'D']
        });
      }
      showToast("⚠️ Could not parse questions from the document. Using placeholders.", "warning");
    }
    
    const result = questions.slice(0, totalQuestions);
    console.log(`Parsed ${result.length} questions from document`);
    return result;
  }

  function selectAnswer(oi) { 
    setAnswers({ ...answers, [qIndex]: oi }); 
  }

  function submitExam() {
  if (finished) return;
  let score = 0;
  const questionResults = [];
  
  for (let i = 0; i < exam.totalQuestions; i++) {
    const isCorrect = answers[i] === exam.correctAnswers[i];
    if (isCorrect) score += 1;
    questionResults.push({
      questionIndex: i,
      userAnswer: answers[i] !== undefined ? answers[i] : null,
      correctAnswer: exam.correctAnswers[i],
      isCorrect: isCorrect
    });
  }
  
  const rec = { 
    id: uid(), 
    examId: exam.id, 
    examTitle: exam.title, 
    studentId: currentUser.id, 
    studentName: currentUser.name, 
    score, 
    total: exam.totalQuestions, 
    submittedAt: new Date().toISOString(),
    questionResults: questionResults // Store individual question results
  };
  const updated = [...results, rec];
  setResults(updated);
  saveKey(STORAGE_KEYS.results, updated);
  setFinished(rec); 
  setStarted(false);
  setShowConfirmFinish(false);
  setShowReview(true);
  setReviewIndex(0);
  showToast(`Submitted! Score: ${score}/${exam.totalQuestions}`);
}

  function finishExam() {
    setShowConfirmFinish(true);
  }

  function resetAll() { 
    setCode(""); 
    setExam(null); 
    setStarted(false); 
    setQIndex(0); 
    setAnswers({}); 
    setSecondsLeft(0); 
    setFinished(null); 
    setShowConfirmFinish(false);
    setPdfQuestions([]);
    setPdfError(false);
    setShowReview(false);
    setReviewIndex(0);
  }

  // Review mode - show correct/wrong answers
  if (showReview && finished) {
    const pct = Math.round((finished.score / finished.total) * 100);
    const questions = pdfQuestions.length > 0 ? pdfQuestions : 
      Array.from({ length: exam.totalQuestions }, (_, i) => ({
        id: i,
        text: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D']
      }));
    
    const totalAnswered = finished.questionResults ? finished.questionResults.filter(r => r.userAnswer !== undefined).length : 0;
    const currentReview = finished.questionResults ? finished.questionResults[reviewIndex] : null;
    const currentQuestion = questions[reviewIndex] || questions[0];

    return (
      <div>
        <div className="page-title font-display">Exam Review</div>
        <div className="page-sub">Review your answers and see correct/incorrect responses.</div>

        {/* Score Summary */}
        <div className="card" style={{ marginBottom: 20, textAlign: "center", background: pct >= 60 ? "rgba(63,122,93,0.08)" : "rgba(178,58,72,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>Your Score</div>
              <div className="font-display" style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)" }}>{finished.score} / {finished.total}</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>Percentage</div>
              <div className={`pill ${pct >= 60 ? "pill-green" : pct >= 40 ? "pill-gold" : "pill-red"}`} style={{ fontSize: 20, padding: "6px 20px" }}>{pct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>Status</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: pct >= 60 ? "var(--success)" : pct >= 40 ? "var(--accent)" : "var(--danger)" }}>
                {pct >= 60 ? "✅ Passed" : pct >= 40 ? "⚠️ Average" : "❌ Failed"}
              </div>
            </div>
          </div>
        </div>

        {/* Review Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Question {reviewIndex + 1} of {finished.total}</span>
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            {Array.from({ length: finished.total }).map((_, i) => {
              const result = finished.questionResults ? finished.questionResults[i] : null;
              const isCorrect = result ? result.isCorrect : false;
              const isAnswered = result ? result.userAnswer !== undefined : false;
              return (
                <div 
                  key={i} 
                  className={`q-dot ${i === reviewIndex ? "current" : ""} ${isAnswered ? (isCorrect ? "answered" : "pill-red") : ""}`}
                  style={{ 
                    cursor: "pointer",
                    ...(isAnswered && !isCorrect ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : {})
                  }}
                  onClick={() => setReviewIndex(i)}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Review Card */}
        <div className="card" style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              Question {reviewIndex + 1}
              {currentReview && currentReview.isCorrect !== undefined && (
                <span style={{ marginLeft: 12, fontSize: 14 }}>
                  {currentReview.isCorrect ? (
                    <span style={{ color: "var(--success)" }}>✅ Correct</span>
                  ) : (
                    <span style={{ color: "var(--danger)" }}>❌ Wrong</span>
                  )}
                </span>
              )}
            </div>
          </div>
          
          <div style={{ 
            marginBottom: 16, 
            padding: 16, 
            background: "var(--paper)", 
            borderRadius: 8,
            fontSize: 17,
            lineHeight: 1.8
          }}>
            {currentQuestion.text || `Question ${reviewIndex + 1}`}
          </div>
          
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: "var(--muted)" }}>Your Answer:</div>
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            currentQuestion.options.map((option, oi) => {
              const letter = LETTERS[oi] || String.fromCharCode(65 + oi);
              const isSelected = currentReview ? currentReview.userAnswer === oi : false;
              const isCorrect = currentReview ? currentReview.correctAnswer === oi : false;
              let bgColor = "transparent";
              let borderColor = "var(--line)";
              
              if (isSelected && isCorrect) {
                bgColor = "rgba(63,122,93,0.15)";
                borderColor = "var(--success)";
              } else if (isSelected && !isCorrect) {
                bgColor = "rgba(178,58,72,0.15)";
                borderColor = "var(--danger)";
              } else if (!isSelected && isCorrect) {
                bgColor = "rgba(63,122,93,0.08)";
                borderColor = "var(--success)";
              }
              
              return (
                <div key={oi} className="option-row" style={{ 
                  background: bgColor,
                  borderColor: borderColor,
                  borderWidth: borderColor !== "var(--line)" ? 2 : 1,
                  cursor: "default"
                }}>
                  <div className="option-letter" style={{ 
                    background: isSelected ? "var(--primary)" : "transparent",
                    color: isSelected ? "#fff" : "var(--muted)",
                    borderColor: borderColor
                  }}>{letter}</div>
                  <div style={{ fontSize: 15, flex: 1 }}>{option}</div>
                  {isSelected && isCorrect && <Check size={18} color="var(--success)" style={{ marginLeft: "auto" }} />}
                  {isSelected && !isCorrect && <X size={18} color="var(--danger)" style={{ marginLeft: "auto" }} />}
                  {!isSelected && isCorrect && <Check size={18} color="var(--success)" style={{ marginLeft: "auto" }} />}
                  {isSelected && <span style={{ marginLeft: 8, fontSize: 12, color: isCorrect ? "var(--success)" : "var(--danger)" }}>
                    {isCorrect ? "(Correct)" : "(Your Answer)"}
                  </span>}
                  {!isSelected && isCorrect && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--success)" }}>(Correct Answer)</span>}
                </div>
              );
            })
          ) : (
            LETTERS.map((l, oi) => (
              <div key={oi} className="option-row" style={{ 
                background: currentReview && currentReview.userAnswer === oi ? "rgba(63,122,93,0.1)" : "transparent"
              }}>
                <div className="option-letter">{l}</div>
                <div style={{ fontSize: 15, flex: 1 }}>Option {l}</div>
              </div>
            ))
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" disabled={reviewIndex === 0} onClick={() => setReviewIndex(reviewIndex - 1)}>
              <ChevronLeft size={15} /> Previous
            </button>
            <button className="btn btn-outline" disabled={reviewIndex === finished.total - 1} onClick={() => setReviewIndex(reviewIndex + 1)}>
              Next <ChevronRight size={15} />
            </button>
          </div>
          <div>
            <button className="btn btn-primary" onClick={resetAll}>
              <CheckCircle2 size={15} /> Take Another Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((finished.score / finished.total) * 100);
    return (
      <div>
        <div className="page-title font-display">Take Exam</div>
        <div className="page-sub">Result summary</div>
        <div className="card" style={{ maxWidth: 460 }}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <Award size={40} color="var(--accent)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 15, color: "var(--muted)" }}>{finished.examTitle}</div>
            <div className="font-display" style={{ fontSize: 40, fontWeight: 700, color: "var(--primary)", margin: "6px 0" }}>{finished.score} / {finished.total}</div>
            <div className="pill pill-gold">{pct}% score</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Submitted {fmtDateTime(finished.submittedAt)}</div>
          </div>
        </div>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={resetAll}>Take another exam</button>
        <button className="btn btn-primary" style={{ marginTop: 16, marginLeft: 10 }} onClick={() => setShowReview(true)}>
          <BookOpen size={15} /> Review Answers
        </button>
      </div>
    );
  }

  if (started && exam) {
    const isLast = qIndex === exam.totalQuestions - 1;
    const mm = Math.floor(secondsLeft / 60), ss = secondsLeft % 60;
    const low = secondsLeft <= 30;
    const totalAnswered = Object.keys(answers).length;
    
    const questions = pdfQuestions.length > 0 ? pdfQuestions : 
      Array.from({ length: exam.totalQuestions }, (_, i) => ({
        id: i,
        text: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D']
      }));

    const currentQuestion = questions[qIndex] || questions[0];
    const isDocFile = fileType === 'doc' || fileType === 'docx';

    return (
      <div>
        {/* Header with timer and progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="page-title font-display" style={{ marginBottom: 0 }}>{exam.title}</div>
            <div className="page-sub" style={{ marginBottom: 0 }}>
              Question {qIndex + 1} of {exam.totalQuestions} 
              <span style={{ marginLeft: 12, color: "var(--muted)" }}>
                • Answered: {totalAnswered}/{exam.totalQuestions}
              </span>
            </div>
          </div>
          <div className={`timer-badge ${low ? "low" : ""}`}><Timer size={16} /> {pad(mm)}:{pad(ss)}</div>
        </div>

        {/* Question progress dots */}
        <div className="q-progress">
          {Array.from({ length: exam.totalQuestions }).map((_, i) => (
            <div key={i} className={`q-dot ${i === qIndex ? "current" : answers[i] !== undefined ? "answered" : ""}`} onClick={() => setQIndex(i)}>{i + 1}</div>
          ))}
        </div>

        {/* Main content - centered question and options */}
        <div className="card" style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* File type indicator */}
          {isDocFile && (
            <div className="notice" style={{ marginBottom: 16, background: "#FFF8E1", borderColor: "#FFC107" }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, color: "#FF6F00" }} />
              <div style={{ fontSize: 13 }}>
                <strong>📝 Document uploaded as DOC file.</strong> Questions have been extracted below.
                {isLoadingPdf && <span style={{ marginLeft: 8 }}>Extracting questions...</span>}
              </div>
            </div>
          )}

          {/* Question number and status */}
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
            Question {qIndex + 1}
            {answers[qIndex] !== undefined && (
              <span style={{ marginLeft: 8, fontSize: 14, color: "var(--success)" }}>
                ✓ Answered
              </span>
            )}
          </div>
          
          {/* Question Text */}
          <div style={{ 
            marginBottom: 20, 
            padding: 16, 
            background: "var(--paper)", 
            borderRadius: 8,
            fontSize: 17,
            lineHeight: 1.8
          }}>
            {currentQuestion.text || `Question ${qIndex + 1}`}
          </div>
          
          {/* Options */}
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: "var(--muted)" }}>Select your answer:</div>
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            currentQuestion.options.map((option, oi) => {
              const letter = LETTERS[oi] || String.fromCharCode(65 + oi);
              return (
                <div key={oi} className={`option-row ${answers[qIndex] === oi ? "selected" : ""}`} onClick={() => selectAnswer(oi)} style={{ padding: "14px 16px" }}>
                  <div className="option-letter" style={{ width: 30, height: 30, fontSize: 14 }}>{letter}</div>
                  <div style={{ fontSize: 15, flex: 1 }}>{option}</div>
                  {answers[qIndex] === oi && <Check size={20} color="var(--success)" style={{ marginLeft: "auto" }} />}
                </div>
              );
            })
          ) : (
            LETTERS.map((l, oi) => (
              <div key={oi} className={`option-row ${answers[qIndex] === oi ? "selected" : ""}`} onClick={() => selectAnswer(oi)} style={{ padding: "14px 16px" }}>
                <div className="option-letter" style={{ width: 30, height: 30, fontSize: 14 }}>{l}</div>
                <div style={{ fontSize: 15, flex: 1 }}>Option {l}</div>
                {answers[qIndex] === oi && <Check size={20} color="var(--success)" style={{ marginLeft: "auto" }} />}
              </div>
            ))
          )}

          {/* Extraction status */}
          {pdfQuestions.length > 0 && !isDocFile && (
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--success)", textAlign: "center" }}>
              ✅ {pdfQuestions.length} questions extracted. Select your answer below.
            </div>
          )}
          {pdfError && (
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--danger)", textAlign: "center" }}>
              ⚠️ Could not extract questions. Please read from your document.
            </div>
          )}
          {isLoadingPdf && (
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              🔄 Extracting questions from document...
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" disabled={qIndex === 0} onClick={() => setQIndex(qIndex - 1)}>
              <ChevronLeft size={15} /> Previous
            </button>
            {!isLast ? (
              <button className="btn btn-primary" onClick={() => setQIndex(qIndex + 1)}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled>
                Last Question <ChevronRight size={15} />
              </button>
            )}
          </div>
          <div>
            <button 
              className="btn btn-danger" 
              onClick={finishExam}
              style={{ background: "var(--danger)", color: "#fff" }}
            >
              <CheckCircle2 size={15} /> Finish Exam
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmFinish && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: 400, margin: "20px" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <AlertTriangle size={40} color="var(--accent)" />
                <h3 style={{ marginTop: 10 }}>Finish Exam?</h3>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  You've answered {totalAnswered} out of {exam.totalQuestions} questions.
                  {totalAnswered < exam.totalQuestions && (
                    <span style={{ color: "var(--danger)", display: "block", marginTop: 8 }}>
                      ⚠️ You have {exam.totalQuestions - totalAnswered} unanswered questions!
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn btn-outline" onClick={() => setShowConfirmFinish(false)}>
                  Continue Exam
                </button>
                <button className="btn btn-danger" onClick={submitExam} style={{ background: "var(--danger)", color: "#fff" }}>
                  <CheckCircle2 size={15} /> Submit & Finish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-title font-display">Take Exam</div>
      <div className="page-sub">Enter the exam code shared with you to begin.</div>
      <div className="card" style={{ maxWidth: 480 }}>
        {!exam ? (
          <>
            <label className="field-label">Exam code</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 7XQ2LK" className="font-mono" />
              <button className="btn btn-primary" onClick={findExam}><Link2 size={15} /> Find exam</button>
            </div>
          </>
        ) : (
          <>
            <div className="admit-card" style={{ marginBottom: 16 }}>
              <div className="admit-seal">{exam.subject ? exam.subject.slice(0, 2).toUpperCase() : "EX"}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{exam.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {exam.subject} · {exam.durationMins} min · {exam.totalQuestions} questions
                  {exam.fileType && <span style={{ marginLeft: 8 }}>· {exam.fileType.toUpperCase()} file</span>}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, marginBottom: 14 }}>Signed in as <b>{currentUser.name}</b> ({currentUser.email})</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={beginExam}><GraduationCap size={15} /> Start exam</button>
              <button className="btn btn-outline" onClick={() => setExam(null)}>Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Attendance ---------------------------------- */

function AttendanceTab({ students, attendance, setAttendance, showToast }) {
  const [date, setDate] = useState(todayStr());
  const dayRecord = attendance[date] || {};

  function setStatus(studentId, status) { 
    const updated = { ...attendance, [date]: { ...dayRecord, [studentId]: status } };
    setAttendance(updated);
    saveKey(STORAGE_KEYS.attendance, updated);
  }
  
  function markAll(status) {
    const rec = {}; students.forEach((s) => { rec[s.id] = status; });
    const updated = { ...attendance, [date]: rec };
    setAttendance(updated);
    saveKey(STORAGE_KEYS.attendance, updated);
    showToast(`All students marked ${status}.`);
  }
  
  const presentCount = Object.values(dayRecord).filter((v) => v === "present").length;
  const pastDates = Object.keys(attendance).sort().reverse().slice(0, 8);

  return (
    <div>
      <div className="page-title font-display">Attendance</div>
      <div className="page-sub">Mark daily attendance for the roster.</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><label className="field-label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => markAll("present")}>Mark all present</button>
            <button className="btn btn-outline btn-sm" onClick={() => markAll("absent")}>Mark all absent</button>
          </div>
        </div>
        {students.length === 0 ? (
          <div className="empty"><Users size={30} /><div>Add students first to take attendance.</div></div>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Email</th><th style={{ width: 200 }}>Status</th></tr></thead>
            <tbody>
              {students.map((s) => {
                const st = dayRecord[s.id];
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td><td>{s.email}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className={`btn btn-sm ${st === "present" ? "btn-primary" : "btn-outline"}`} onClick={() => setStatus(s.id, "present")}><Check size={12} /> Present</button>
                        <button className={`btn btn-sm ${st === "absent" ? "" : "btn-outline"}`} style={st === "absent" ? { background: "var(--danger)", color: "#fff" } : {}} onClick={() => setStatus(s.id, "absent")}><X size={12} /> Absent</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {students.length > 0 && <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>{presentCount} of {students.length} marked present for {fmtDate(date)}.</div>}
      </div>

      {pastDates.length > 0 && (
        <div className="card-plain">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Recent attendance summary</div>
          <table>
            <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>%</th></tr></thead>
            <tbody>
              {pastDates.map((d) => {
                const rec = attendance[d]; const total = students.length || 1;
                const present = Object.values(rec).filter((v) => v === "present").length;
                const absent = Object.values(rec).filter((v) => v === "absent").length;
                return (
                  <tr key={d}><td>{fmtDate(d)}</td><td><span className="pill pill-green">{present}</span></td><td><span className="pill pill-red">{absent}</span></td><td>{Math.round((present / total) * 100)}%</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Results ---------------------------------- */

function ResultsTab({ exams, results, currentUser }) {
  const [examId, setExamId] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const isStudent = currentUser.role === "student";

  const filtered = results
    .filter((r) => (isStudent ? r.studentId === currentUser.id : true))
    .filter((r) => examId === "all" || r.examId === examId)
    .filter((r) => isStudent || r.studentName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  // Get exam details for a result
  const getExamForResult = (result) => {
    return exams.find(e => e.id === result.examId);
  };

  // Get questions for an exam
  const getQuestionsForExam = (exam) => {
    if (!exam) return [];
    return Array.from({ length: exam.totalQuestions || 0 }, (_, i) => ({
      id: i,
      text: `Question ${i + 1}`,
      options: ['A', 'B', 'C', 'D']
    }));
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setShowDetailedView(true);
  };

  const closeDetailedView = () => {
    setShowDetailedView(false);
    setSelectedResult(null);
  };

  // Detailed view of correct answers
  if (showDetailedView && selectedResult) {
    const exam = getExamForResult(selectedResult);
    const questions = getQuestionsForExam(exam);
    const totalQuestions = selectedResult.total || questions.length;
    const correctAnswers = selectedResult.questionResults || [];
    
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="page-title font-display" style={{ fontSize: 22 }}>Answer Review</div>
            <div className="page-sub">{selectedResult.examTitle}</div>
          </div>
          <button className="btn btn-outline" onClick={closeDetailedView}>
            <ChevronLeft size={15} /> Back to Results
          </button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Score</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedResult.score} / {selectedResult.total}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Percentage</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {Math.round((selectedResult.score / selectedResult.total) * 100)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Submitted</div>
              <div style={{ fontSize: 14 }}>{fmtDateTime(selectedResult.submittedAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Status</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: (selectedResult.score / selectedResult.total) >= 0.6 ? "var(--success)" : "var(--danger)" }}>
                {(selectedResult.score / selectedResult.total) >= 0.6 ? "✅ Passed" : "❌ Failed"}
              </div>
            </div>
          </div>
        </div>

        {/* Questions with Correct Answers */}
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const userAnswer = selectedResult.questionResults && selectedResult.questionResults[index] 
              ? selectedResult.questionResults[index].userAnswer 
              : undefined;
            const correctAnswer = selectedResult.questionResults && selectedResult.questionResults[index]
              ? selectedResult.questionResults[index].correctAnswer
              : (exam ? exam.correctAnswers[index] : undefined);
            const isCorrect = selectedResult.questionResults && selectedResult.questionResults[index]
              ? selectedResult.questionResults[index].isCorrect
              : (userAnswer !== undefined && userAnswer === correctAnswer);
            const question = questions[index] || { text: `Question ${index + 1}`, options: ['A', 'B', 'C', 'D'] };
            
            return (
              <div key={index} className="card-plain" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    Question {index + 1}
                    {userAnswer !== undefined ? (
                      isCorrect ? (
                        <span style={{ marginLeft: 10, fontSize: 14, color: "var(--success)" }}>✅ Correct</span>
                      ) : (
                        <span style={{ marginLeft: 10, fontSize: 14, color: "var(--danger)" }}>❌ Wrong</span>
                      )
                    ) : (
                      <span style={{ marginLeft: 10, fontSize: 12, color: "var(--muted)" }}>(Not Answered)</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
                    {userAnswer !== undefined && (
                      <span>
                        Your Answer: <strong style={{ color: isCorrect ? "var(--success)" : "var(--danger)" }}>
                          {LETTERS[userAnswer] || userAnswer}
                        </strong>
                      </span>
                    )}
                    {correctAnswer !== undefined && (
                      <span>
                        Correct Answer: <strong style={{ color: "var(--success)" }}>
                          {LETTERS[correctAnswer] || correctAnswer}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 8 }}>
                  {question.text}
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {question.options && question.options.map((option, oi) => {
                    const letter = LETTERS[oi] || String.fromCharCode(65 + oi);
                    const isUserAnswer = userAnswer === oi;
                    const isCorrectAnswer = correctAnswer === oi;
                    let bgColor = "transparent";
                    let borderColor = "var(--line)";
                    let textColor = "var(--ink)";
                    
                    if (isUserAnswer && isCorrectAnswer) {
                      bgColor = "rgba(63,122,93,0.15)";
                      borderColor = "var(--success)";
                      textColor = "var(--success)";
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      bgColor = "rgba(178,58,72,0.12)";
                      borderColor = "var(--danger)";
                      textColor = "var(--danger)";
                    } else if (isCorrectAnswer) {
                      bgColor = "rgba(63,122,93,0.08)";
                      borderColor = "var(--success)";
                    }
                    
                    return (
                      <div key={oi} style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <span style={{ fontWeight: 600 }}>{letter}.</span>
                        <span>{option}</span>
                        {isUserAnswer && <span style={{ fontSize: 10, marginLeft: "auto" }}>(Your Answer)</span>}
                        {isCorrectAnswer && !isUserAnswer && <span style={{ fontSize: 10, marginLeft: "auto", color: "var(--success)" }}>✓ Correct</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={closeDetailedView}>
          <ChevronLeft size={15} /> Back to Results
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title font-display">Results</div>
      <div className="page-sub">{isStudent ? "Your marks across mock tests." : "Marks scored by students across all mock tests."}</div>

      <div className="card-plain">
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="all">All exams</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          {!isStudent && (
            <input 
              placeholder="Search student…" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ maxWidth: 220 }} 
            />
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><Award size={30} /><div>No results yet — scores will appear here once exams are completed.</div></div>
        ) : (
          <table>
            <thead>
              <tr>
                {!isStudent && <th>Student</th>}
                <th>Exam</th>
                <th>Score</th>
                <th>%</th>
                <th>Submitted</th>
                {isStudent && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const pct = Math.round((r.score / r.total) * 100);
                return (
                  <tr key={r.id}>
                    {!isStudent && <td style={{ fontWeight: 600 }}>{r.studentName}</td>}
                    <td>{r.examTitle}</td>
                    <td>{r.score}/{r.total}</td>
                    <td>
                      <span className={`pill ${pct >= 60 ? "pill-green" : pct >= 40 ? "pill-gold" : "pill-red"}`}>
                        {pct}%
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{fmtDateTime(r.submittedAt)}</td>
                    {isStudent && (
                      <td>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleViewDetails(r)}
                          style={{ 
                            background: "var(--primary)", 
                            color: "#fff", 
                            padding: "4px 12px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          <BookOpen size={13} style={{ marginRight: 4 }} /> Review Answers
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Admin Panel ---------------------------------- */

function AdminPanel({ settings, setSettings, adminCreds, setAdminCreds, facultyAccounts, setFacultyAccounts, showToast }) {
  const [siteTitle, setSiteTitle] = useState(settings.title);
  const [siteSubtitle, setSiteSubtitle] = useState(settings.subtitle);

  const [facName, setFacName] = useState("");
  const [facUsername, setFacUsername] = useState("");
  const [facPassword, setFacPassword] = useState(genPin());

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [backupFile, setBackupFile] = useState(null);

  function saveSettings() {
    if (!siteTitle.trim()) { showToast("Site title can't be empty.", "error"); return; }
    const updated = { title: siteTitle.trim(), subtitle: siteSubtitle.trim() };
    setSettings(updated);
    saveKey(STORAGE_KEYS.settings, updated);
    showToast("Site settings updated.");
  }

  function addFaculty() {
    if (!facName.trim() || !facUsername.trim() || !facPassword.trim()) { showToast("Fill in name, username and password.", "error"); return; }
    if (facultyAccounts.some((f) => f.username.toLowerCase() === facUsername.trim().toLowerCase())) { showToast("That username is already taken.", "error"); return; }
    const rec = { id: uid(), name: facName.trim(), username: facUsername.trim(), password: facPassword.trim(), addedAt: new Date().toISOString() };
    const updated = [...facultyAccounts, rec];
    setFacultyAccounts(updated);
    saveKey(STORAGE_KEYS.facultyAccounts, updated);
    setFacName(""); setFacUsername(""); setFacPassword(genPin());
    showToast(`Faculty account created for ${rec.name}.`);
  }
  
  function removeFaculty(id) { 
    const updated = facultyAccounts.filter((f) => f.id !== id);
    setFacultyAccounts(updated);
    saveKey(STORAGE_KEYS.facultyAccounts, updated);
    showToast("Faculty removed.");
  }

  function changeAdminPassword() {
    if (curPass !== adminCreds.password) { showToast("Current password is incorrect.", "error"); return; }
    if (!newPass.trim() || newPass.length < 4) { showToast("New password should be at least 4 characters.", "error"); return; }
    const updated = { ...adminCreds, password: newPass.trim() };
    setAdminCreds(updated);
    saveKey(STORAGE_KEYS.adminCreds, updated);
    setCurPass(""); setNewPass("");
    showToast("Admin password updated.");
  }

  function handleBackupDownload() {
    downloadBackup();
    showToast("Backup downloaded successfully!");
  }

  function handleBackupUpload() {
    if (!backupFile) { showToast("Please select a backup file first.", "error"); return; }
    uploadBackup(backupFile, (error, data) => {
      if (error) {
        showToast("Invalid backup file. Please check the file format.", "error");
        return;
      }
      showToast("Backup restored successfully! Refreshing page...", "success");
      setTimeout(() => window.location.reload(), 2000);
    });
  }

  function handleClearData() {
    if (window.confirm("⚠️ Are you sure you want to delete ALL data? This cannot be undone!")) {
      clearAllData();
      showToast("All data cleared. Refreshing page...", "warning");
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  function viewBackupData() {
    const data = exportAllData();
    const stats = {
      students: data[STORAGE_KEYS.students]?.length || 0,
      exams: data[STORAGE_KEYS.exams]?.length || 0,
      faculty: data[STORAGE_KEYS.facultyAccounts]?.length || 0,
      results: data[STORAGE_KEYS.results]?.length || 0,
      notes: data[STORAGE_KEYS.notes]?.length || 0,
      attendance: Object.keys(data[STORAGE_KEYS.attendance] || {}).length || 0,
    };
    alert(`
📊 Database Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Students: ${stats.students}
📝 Exams: ${stats.exams}
👨‍🏫 Faculty: ${stats.faculty}
📊 Results: ${stats.results}
📄 Notes: ${stats.notes}
📋 Attendance Days: ${stats.attendance}
━━━━━━━━━━━━━━━━━━━━━━━━━
💾 Total Records: ${Object.values(stats).reduce((a, b) => a + b, 0)}

Data is stored in your browser's localStorage.
    `);
  }

  return (
    <div>
      <div className="page-title font-display">Admin panel</div>
      <div className="page-sub">Full control over site settings, faculty accounts, and data backup.</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><SettingsIcon size={16} /> Site settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><label className="field-label">Site title</label><input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} /></div>
          <div><label className="field-label">Subtitle</label><input value={siteSubtitle} onChange={(e) => setSiteSubtitle(e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}><CheckCircle2 size={15} /> Save settings</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Users size={16} /> Faculty accounts</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end", marginBottom: 16 }}>
          <div><label className="field-label">Name</label><input value={facName} onChange={(e) => setFacName(e.target.value)} placeholder="Dr. Meera Pillai" /></div>
          <div><label className="field-label">Username</label><input value={facUsername} onChange={(e) => setFacUsername(e.target.value)} placeholder="meera.faculty" /></div>
          <div>
            <label className="field-label">Password</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="font-mono" value={facPassword} onChange={(e) => setFacPassword(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={() => setFacPassword(genPin())}><RefreshCw size={13} /></button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={addFaculty}><PlusCircle size={15} /> Add faculty</button>
        </div>
        {facultyAccounts.length === 0 ? (
          <div className="empty"><Users size={26} /><div>No faculty accounts yet.</div></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Password</th><th>Added</th><th></th></tr></thead>
            <tbody>
              {facultyAccounts.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.name}</td><td className="font-mono">{f.username}</td><td className="font-mono">{f.password}</td>
                  <td style={{ color: "var(--muted)" }}>{fmtDate(f.addedAt)}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeFaculty(f.id)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><KeyRound size={16} /> Change admin password</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div><label className="field-label">Current password</label><input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} /></div>
          <div><label className="field-label">New password</label><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={changeAdminPassword}>Update</button>
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={16} /> Data Management & Backup
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>📥 Download Backup</div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              Export all data including students, exams, faculty, and results.
            </p>
            <button className="btn btn-primary" onClick={handleBackupDownload}>
              <Download size={15} /> Download Backup
            </button>
            <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={viewBackupData}>
              View Stats
            </button>
          </div>
          
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>📤 Restore Backup</div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              Upload a previously downloaded backup file to restore data.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <label className="btn btn-outline" style={{ cursor: "pointer" }}>
                <Upload size={13} /> Choose File
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: "none" }} 
                  onChange={(e) => setBackupFile(e.target.files[0])}
                />
              </label>
              {backupFile && <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>{backupFile.name}</span>}
              <button className="btn btn-accent" onClick={handleBackupUpload} disabled={!backupFile}>
                <RefreshCw size={13} /> Restore
              </button>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14, color: "var(--danger)" }}>⚠️ Danger Zone</div>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              This will permanently delete ALL data including students, exams, faculty, and results.
            </p>
          </div>
          <button className="btn btn-danger" onClick={handleClearData}>
            <Trash2 size={15} /> Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
