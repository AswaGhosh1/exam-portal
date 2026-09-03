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
const DEFAULT_SETTINGS = { title: " Exam Place", subtitle: "Mock Tests & Attendance" };

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
      
      let studentsData = s;
      if (studentsData.length === 0) {
        studentsData = [
          { 
            id: uid(), 
            name: "Demo Student 1", 
            username: "demo1", 
            phone: "+91 98765 43210", 
            password: "demo123", 
            addedAt: new Date().toISOString() 
          },
          { 
            id: uid(), 
            name: "Demo Student 2", 
            username: "demo2", 
            phone: "+91 98765 43211", 
            password: "demo123", 
            addedAt: new Date().toISOString() 
          }
        ];
        await saveKey(STORAGE_KEYS.students, studentsData);
      }
      
      setStudents(studentsData); 
      setNotes(n); 
      setExams(e); 
      setAttendance(a); 
      setResults(r);
      setNotifications(no); 
      setAdminCreds(ac); 
      setFacultyAccounts(fa); 
      setSettings(se);
      setLoading(false);
    })();
  }, []);

  // Restore PDFs from stored data
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
  const [loginError, setLoginError] = useState("");

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
    setLoginError("");
    if (typeof window !== "undefined") window.location.hash = "admin-secret";
  }

  function closeAdmin() {
    setAdminMode(false);
    setIdField("");
    setPassword("");
    setLoginError("");
    if (typeof window !== "undefined" && window.location.hash === "#admin-secret") {
      window.location.hash = "";
    }
  }

  function submitRegular() {
    const trimmedId = idField.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedId || !trimmedPassword) {
      setLoginError("Please enter your username and password.");
      showToast("Please enter your username and password.", "error");
      return;
    }

    setIsLoading(true);
    setLoginError("");

    if (role === "faculty") {
      const acc = facultyAccounts.find(
        (f) => f.username.toLowerCase() === trimmedId.toLowerCase() && f.password === trimmedPassword
      );
      if (acc) {
        onLogin({ role: "faculty", id: acc.id, name: acc.name });
        showToast(`Welcome ${acc.name}!`, "success");
        setIsLoading(false);
        return;
      } else {
        setLoginError("Incorrect faculty username or password.");
        showToast("❌ Incorrect faculty username or password.", "error");
        setPassword('');
        setIsLoading(false);
        return;
      }
    }

    // STUDENT LOGIN
    let student = students.find(
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
        setIsLoading(false);
        return;
      } else {
        setLoginError("Incorrect password. Please try again.");
        showToast("❌ Incorrect password. Please try again.", "error");
        setPassword('');
        setIsLoading(false);
        return;
      }
    } else {
      setLoginError(`No student found with username "${trimmedId}".`);
      showToast(`❌ No student found with username "${trimmedId}".`, "error");
      setPassword('');
      setIsLoading(false);
      return;
    }
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
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, opacity: 0.7 }}>
            {students.length} students registered
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, opacity: 0.5 }}>
            Demo: demo1/demo123 or demo2/demo123
          </div>
        </div>

        <div className="role-pills">
          <div 
            className={`role-pill ${role === "student" ? "active" : ""}`} 
            onClick={() => { setRole("student"); setIdField(""); setPassword(""); setLoginError(""); }}
            style={{ padding: "12px 4px", fontSize: "14px" }}
          >
            <GraduationCap size={16} /> Student
          </div>
          <div 
            className={`role-pill ${role === "faculty" ? "active" : ""}`} 
            onClick={() => { setRole("faculty"); setIdField(""); setPassword(""); setLoginError(""); }}
            style={{ padding: "12px 4px", fontSize: "14px" }}
          >
            <Users size={16} /> Faculty
          </div>
        </div>

        {loginError && (
          <div style={{ 
            background: "rgba(178,58,72,0.1)", 
            border: "1px solid var(--danger)", 
            borderRadius: "8px", 
            padding: "10px 14px", 
            marginBottom: 12,
            color: "var(--danger)",
            fontSize: "13px"
          }}>
            {loginError}
          </div>
        )}

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
            <div>Faculty accounts are created by an admin. Contact your administrator if you don't have one.</div>
          </div>
        )}
        {role === "student" && (
          <div className="notice" style={{ marginTop: 16 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Login with your username</strong>
              {students.length > 0 && (
                <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                  Demo: <strong>demo1</strong> / <strong>demo123</strong> or <strong>demo2</strong> / <strong>demo123</strong>
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "var(--muted)" }}>
          🔒 Secure login • {students.length} students • {facultyAccounts.length} faculty
        </div>

        {/* Hidden admin tap area */}
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
// ... (keep your existing Dashboard, StudentsTab, NotesTab, ExamsTab, TakeExamTab, AttendanceTab, ResultsTab, AdminPanel components)
// The rest of your code remains exactly the same as before
