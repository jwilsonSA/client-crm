import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { Users, Calendar as CalendarIcon, CheckSquare, LogOut, Plus, Check, Wifi, WifiOff, Briefcase, Lock, Trash2, Edit, AlertTriangle, ShieldCheck, X, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== 'measurementId' && !value)
  .map(([key]) => key);

if (!demoMode && missingFirebaseConfig.length > 0) {
  throw new Error(`Missing Firebase configuration: ${missingFirebaseConfig.join(', ')}`);
}

const app = demoMode ? null : initializeApp(firebaseConfig);
const auth = app ? getAuth(app) : null;
const db = app ? initializeFirestore(app, { localCache: persistentLocalCache() }) : null;

const getTierBadgeClass = (tier) => {
  switch (tier) {
    case 'Tier 1': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Tier 2': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'Tier 3': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    default: return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

const addDays = (dateStr, days) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const isOverdue = (dueDateStr, completed) => {
  if (!dueDateStr || completed) return false;
  const today = new Date().toISOString().split('T')[0];
  return dueDateStr < today;
};

function DemoPage() {
  const demoClients = [
    { name: 'Acme North', tier: 'Tier 1', next: 'Annual Presentation', date: '2026-10-15' },
    { name: 'Bluebird Labs', tier: 'Tier 2', next: 'Mid-year Meeting', date: '2026-11-03' },
    { name: 'Cedar & Co.', tier: 'Tier 3', next: 'Quarterly Review', date: '2026-10-22' }
  ];
  const demoActions = [
    { title: 'Prepare agenda for annual presentation', client: 'Acme North', due: '2026-10-01' },
    { title: 'Confirm meeting attendees', client: 'Bluebird Labs', due: '2026-10-20' },
    { title: 'Draft quarterly review notes', client: 'Cedar & Co.', due: '2026-10-18' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-indigo-400" />
          <h1 className="font-bold text-lg">Team Workplace</h1>
          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
            PUBLIC DEMO
          </span>
        </div>
        <span className="text-xs text-slate-400">Fictional sample data</span>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 text-sm text-indigo-100">
          This public preview uses fictional data only. Firebase is disabled in demo mode, so no private credentials or customer records are loaded.
        </div>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Clients ({demoClients.length})</h2>
            <span className="text-xs text-slate-500">Read-only preview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoClients.map(client => (
              <article key={client.name} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg">{client.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${getTierBadgeClass(client.tier)}`}>{client.tier}</span>
                </div>
                <p className="text-xs text-slate-400 uppercase font-semibold mt-5 mb-1">Next deliverable</p>
                <p className="text-sm text-slate-200">{client.next}</p>
                <p className="text-xs text-slate-500 mt-1">{client.date}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Upcoming action items</h2>
          <div className="space-y-2">
            {demoActions.map(action => (
              <div key={action.title} className="flex items-center justify-between gap-4 bg-slate-950/60 rounded p-3">
                <div>
                  <p className="text-sm">{action.title}</p>
                  <p className="text-xs text-slate-500">{action.client}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{action.due}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'deliverables' | 'calendar' | 'actions' | 'team'
  const [scheduleView, setScheduleView] = useState('timeline'); // 'table' | 'timeline'

  const [clients, setClients] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Session warning banner
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isAdmin] = useState(true);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Calendar Controls
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Client Modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientNameInput, setClientNameInput] = useState('');
  const [clientTierInput, setClientTierInput] = useState('Tier 1');

  // Action Item Modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionClient, setNewActionClient] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');

  // Deliverable Modal
  const [deliverableModalClient, setDeliverableModalClient] = useState(null);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [newDelivTitle, setNewDelivTitle] = useState('');
  const [newDelivType, setNewDelivType] = useState('Meeting');
  const [newDelivDate, setNewDelivDate] = useState('');

  // Team Member Modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');

  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (demoMode) return undefined;
    return onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  useEffect(() => {
    if (demoMode || !user) return undefined;

    // Fetch and sort Clients Alphabetically
    const unsubClients = onSnapshot(query(collection(db, 'clients')), snap => {
      const fetchedClients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedClients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setClients(fetchedClients);
    });

    const unsubDeliverables = onSnapshot(query(collection(db, 'deliverables'), orderBy('targetDate', 'asc')), snap => {
      setDeliverables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubActions = onSnapshot(query(collection(db, 'actionItems'), orderBy('dueDate', 'asc')), snap => {
      setActionItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTeam = onSnapshot(query(collection(db, 'teamMembers'), orderBy('name', 'asc')), snap => {
      setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubClients();
      unsubDeliverables();
      unsubActions();
      unsubTeam();
    };
  }, [user]);

  if (demoMode) {
    return <DemoPage />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setAuthError('Invalid email or password.');
    }
  };

  const createMeetingReminders = async (clientName, meetingTitle, meetingDate) => {
    if (!meetingDate) return;

    const reminders = [
      { title: `Prepare Agenda: ${meetingTitle}`, dueDate: addDays(meetingDate, -14) },
      { title: `Send Agenda to Client: ${meetingTitle}`, dueDate: addDays(meetingDate, -7) },
      { title: `Draft Minutes: ${meetingTitle}`, dueDate: addDays(meetingDate, 5) },
      { title: `Send Minutes to Client: ${meetingTitle}`, dueDate: addDays(meetingDate, 10) }
    ];

    for (const rem of reminders) {
      await addDoc(collection(db, 'actionItems'), {
        title: rem.title,
        clientName: clientName,
        dueDate: rem.dueDate,
        completed: false,
        assignedTo: user.email,
        createdAt: serverTimestamp()
      });
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!memberName || !memberEmail) return;

    await addDoc(collection(db, 'teamMembers'), {
      name: memberName,
      email: memberEmail.toLowerCase().trim(),
      role: memberRole,
      createdAt: serverTimestamp()
    });

    setMemberName('');
    setMemberEmail('');
    setMemberRole('Member');
    setShowTeamModal(false);
  };

  const handleDeleteTeamMember = async (id) => {
    await deleteDoc(doc(db, 'teamMembers', id));
  };

  const openAddClientModal = () => {
    setEditingClient(null);
    setClientNameInput('');
    setClientTierInput('Tier 1');
    setShowClientModal(true);
  };

  const openEditClientModal = (client) => {
    setEditingClient(client);
    setClientNameInput(client.name);
    setClientTierInput(client.tier);
    setShowClientModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!clientNameInput) return;

    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), {
          name: clientNameInput,
          tier: clientTierInput
        });
      } else {
        const docRef = await addDoc(collection(db, 'clients'), {
          name: clientNameInput,
          tier: clientTierInput,
          createdAt: serverTimestamp()
        });

        const tierDeliverables = {
          'Tier 1': [
            { title: 'Annual Meeting', type: 'Meeting' },
            { title: 'Annual Presentation', type: 'Presentation' }
          ],
          'Tier 2': [
            { title: 'Mid-year Meeting', type: 'Meeting' },
            { title: 'Annual Meeting', type: 'Meeting' },
            { title: 'Member Presentation', type: 'Presentation' },
            { title: 'Staff Induction', type: 'Induction' }
          ],
          'Tier 3': [
            { title: 'Quarterly Review 1', type: 'Meeting' },
            { title: 'Quarterly Review 2', type: 'Meeting' },
            { title: 'Quarterly Review 3', type: 'Meeting' },
            { title: 'Quarterly Review 4', type: 'Meeting' },
            { title: 'Executive Presentation', type: 'Presentation' },
            { title: 'Full Induction Series', type: 'Induction' }
          ]
        };

        const defaults = tierDeliverables[clientTierInput] || [];
        for (const item of defaults) {
          const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await addDoc(collection(db, 'deliverables'), {
            clientId: docRef.id,
            clientName: clientNameInput,
            title: item.title,
            type: item.type,
            status: 'Pending',
            targetDate: targetDate
          });

          if (item.type === 'Meeting') {
            await createMeetingReminders(clientNameInput, item.title, targetDate);
          }
        }
      }

      setShowClientModal(false);
    } catch (err) {
      console.error("Error saving client:", err);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm("Are you sure you want to remove this client and all associated deliverables?")) return;
    await deleteDoc(doc(db, 'clients', clientId));
    const delivSnap = await getDocs(query(collection(db, 'deliverables'), where('clientId', '==', clientId)));
    delivSnap.forEach(async (d) => await deleteDoc(doc(db, 'deliverables', d.id)));
  };

  const openAddDeliverableModal = (client) => {
    setEditingDeliverable(null);
    setDeliverableModalClient(client);
    setNewDelivTitle('');
    setNewDelivType('Meeting');
    setNewDelivDate(new Date().toISOString().split('T')[0]);
  };

  const openEditDeliverableModal = (client, deliv) => {
    setDeliverableModalClient(client);
    setEditingDeliverable(deliv);
    setNewDelivTitle(deliv.title);
    setNewDelivType(deliv.type);
    setNewDelivDate(deliv.targetDate || '');
  };

  const handleSaveDeliverable = async (e) => {
    e.preventDefault();
    if (!newDelivTitle || !deliverableModalClient) return;
    const targetDate = newDelivDate || new Date().toISOString().split('T')[0];

    if (editingDeliverable) {
      await updateDoc(doc(db, 'deliverables', editingDeliverable.id), {
        title: newDelivTitle,
        type: newDelivType,
        targetDate: targetDate
      });
    } else {
      await addDoc(collection(db, 'deliverables'), {
        clientId: deliverableModalClient.id,
        clientName: deliverableModalClient.name,
        title: newDelivTitle,
        type: newDelivType,
        status: 'Pending',
        targetDate: targetDate
      });

      if (newDelivType === 'Meeting') {
        await createMeetingReminders(deliverableModalClient.name, newDelivTitle, targetDate);
      }
    }

    setNewDelivTitle('');
    setNewDelivDate('');
    setDeliverableModalClient(null);
    setEditingDeliverable(null);
  };

  const handleDeleteDeliverable = async (id) => {
    await deleteDoc(doc(db, 'deliverables', id));
  };

  const handleAddActionItem = async (e) => {
    e.preventDefault();
    if (!newActionTitle || !newActionClient) return;

    await addDoc(collection(db, 'actionItems'), {
      title: newActionTitle,
      clientName: newActionClient,
      dueDate: newActionDueDate,
      completed: false,
      assignedTo: newActionAssignee || user.email,
      createdAt: serverTimestamp()
    });
    setNewActionTitle('');
    setNewActionDueDate('');
    setNewActionAssignee('');
    setShowActionModal(false);
  };

  const toggleAction = async (id, currentStatus) => {
    await updateDoc(doc(db, 'actionItems', id), { completed: !currentStatus });
  };

  const handleDeleteAction = async (id) => {
    await deleteDoc(doc(db, 'actionItems', id));
  };

  const overdueItems = actionItems.filter(item => isOverdue(item.dueDate, item.completed));

  // Calendar Helper Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentCalendarDate(new Date(year, month + 1, 1));

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 select-none">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md text-slate-100 shadow-2xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Lock className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Secure Team CRM</h1>
          </div>
          {authError && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4">{authError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase font-semibold mb-1">Email</label>
              <input type="email" required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-semibold mb-1">Password</label>
              <input type="password" required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2 rounded text-white">Log In</button>
          </form>
          <p className="text-xs text-slate-500 text-center mt-6">• Gugu's Team Workplace •</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden select-none">
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center opacity-[0.03] rotate-[-30deg] text-xs md:text-sm font-mono whitespace-nowrap text-white">
        {user.email} • CONFIDENTIAL INTERNAL DATA • DO NOT DISTRIBUTE
      </div>

      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <Briefcase className="w-6 h-6 text-indigo-400" />
          <h1 className="font-bold text-lg hidden sm:block">Team Workplace</h1>
          {isAdmin && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded flex items-center gap-1"><ShieldCheck size={12} /> Admin</span>}
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveTab('team')} className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 border ${activeTab === 'team' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}>
            <UserPlus size={14} /> Team ({teamMembers.length})
          </button>
          <div className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full ${online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{online ? 'Live' : 'Offline'}</span>
          </div>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white p-1" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* DISMISSIBLE IN-APP RED WARNING BANNER */}
      {!bannerDismissed && overdueItems.length > 0 && (
        <div className="bg-rose-900 border-b border-rose-700 text-rose-100 px-4 py-3 flex items-center justify-between shadow-lg z-30 transition-all">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-sm">
                Attention Required: You have {overdueItems.length} overdue task{overdueItems.length > 1 ? 's' : ''}!
              </p>
              <p className="text-xs text-rose-300">
                Please review and complete them to clear this alert.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={() => setActiveTab('actions')} className="bg-rose-800 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded font-semibold border border-rose-600 transition">
              View Items
            </button>
            <button onClick={() => setBannerDismissed(true)} className="text-rose-300 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 max-w-6xl w-full mx-auto pb-20 z-10">

        {/* ALPHABETICALLY SORTED CLIENTS TAB */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Clients ({clients.length})</h2>
              <button onClick={openAddClientModal} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {clients.map(client => (
                <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-white">{client.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${getTierBadgeClass(client.tier)}`}>
                          {client.tier}
                        </span>
                        <button onClick={() => openEditClientModal(client)} className="text-slate-400 hover:text-white p-1" title="Edit Client"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteClient(client.id)} className="text-rose-400 hover:text-rose-300 p-1" title="Delete Client"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-800 pt-3">
                      <p className="text-xs text-slate-400 font-semibold mb-2 uppercase">Scheduled Deliverables</p>
                      <div className="space-y-1 mb-3">
                        {deliverables.filter(d => d.clientId === client.id).map(deliv => (
                          <div key={deliv.id} className="text-xs flex justify-between items-center text-slate-300 bg-slate-950/40 p-1.5 rounded">
                            <span>• {deliv.title} ({deliv.type})</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500">{deliv.targetDate}</span>
                              <button onClick={() => openEditDeliverableModal(client, deliv)} className="text-slate-400 hover:text-white p-0.5" title="Edit Deliverable"><Edit size={12} /></button>
                              <button onClick={() => handleDeleteDeliverable(deliv.id)} className="text-rose-400 hover:text-rose-300 p-0.5" title="Delete Deliverable"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => openAddDeliverableModal(client)} className="w-full text-center text-xs py-2 border border-dashed border-slate-700 hover:border-slate-500 rounded text-slate-400 flex items-center justify-center gap-1 mt-4">
                    <Plus size={12} /> Add Deliverable
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DELIVERABLES & HORIZONTAL TIMELINE VIEW */}
        {activeTab === 'deliverables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Deliverables & Schedule</h2>
              <div className="flex bg-slate-900 border border-slate-800 rounded p-1 text-xs">
                <button onClick={() => setScheduleView('timeline')} className={`px-3 py-1 rounded ${scheduleView === 'timeline' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Horizontal Timeline</button>
                <button onClick={() => setScheduleView('table')} className={`px-3 py-1 rounded ${scheduleView === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Table View</button>
              </div>
            </div>

            {scheduleView === 'timeline' ? (
              /* HORIZONTAL TIMELINE VIEW */
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4 overflow-hidden">
                <p className="text-xs text-slate-400 uppercase font-semibold">Chronological Target Milestones (Horizontal Scroll)</p>
                <div className="overflow-x-auto pb-6 pt-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-slate-800">
                  <div className="flex items-start space-x-8 min-w-max relative before:absolute before:top-[17px] before:left-0 before:right-0 before:h-0.5 before:bg-indigo-500/40">
                    {deliverables.map(deliv => (
                      <div key={deliv.id} className="relative flex flex-col items-center w-64 group">
                        {/* Timeline Node Pin */}
                        <div className="w-8 h-8 rounded-full bg-indigo-600 border-4 border-slate-900 text-white flex items-center justify-center z-10 text-xs font-bold mb-3 shadow-lg group-hover:scale-110 transition-transform">
                          •
                        </div>

                        {/* Event Card */}
                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 w-full shadow-md hover:border-indigo-500/50 transition-colors">
                          <div className="flex justify-between items-center text-xs text-indigo-400 font-mono mb-1">
                            <span>{deliv.targetDate}</span>
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{deliv.type}</span>
                          </div>
                          <p className="font-bold text-white text-sm line-clamp-1">{deliv.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{deliv.clientName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="p-3">Client</th>
                      <th className="p-3">Deliverable</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Target Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {deliverables.map(deliv => {
                      const client = clients.find(c => c.id === deliv.clientId);
                      return (
                        <tr key={deliv.id} className="hover:bg-slate-800/50">
                          <td className="p-3 font-medium text-white flex items-center space-x-2">
                            <span>{deliv.clientName}</span>
                            {client && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getTierBadgeClass(client.tier)}`}>
                                {client.tier}
                              </span>
                            )}
                          </td>
                          <td className="p-3">{deliv.title}</td>
                          <td className="p-3"><span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded">{deliv.type}</span></td>
                          <td className="p-3 text-slate-400">{deliv.targetDate}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => openEditDeliverableModal(client, deliv)} className="text-slate-400 hover:text-white mr-2"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteDeliverable(deliv.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MONTHLY CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarIcon className="text-indigo-400" />
                <span>{currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={prevMonth} className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentCalendarDate(new Date())} className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded text-xs font-semibold">Today</button>
                <button onClick={nextMonth} className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-slate-800/80 border-b border-slate-800 text-center py-2 text-xs font-semibold text-slate-400 uppercase">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 bg-slate-950/40">
                {/* Blank days before first day of month */}
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="min-h-[100px] p-1 bg-slate-950/20" />
                ))}

                {/* Calendar Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                  const dayDeliverables = deliverables.filter(d => d.targetDate === dateString);
                  const dayActions = actionItems.filter(a => a.dueDate === dateString);

                  return (
                    <div key={`day-${dayNum}`} className="min-h-[110px] p-1.5 flex flex-col justify-between hover:bg-slate-900/50 transition">
                      <div className="text-right text-xs font-bold text-slate-400 mb-1">{dayNum}</div>
                      <div className="space-y-1 overflow-y-auto max-h-[80px]">
                        {dayDeliverables.map(deliv => (
                          <div key={deliv.id} className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 p-1 rounded text-[10px] leading-tight" title={`Deliverable: ${deliv.title}`}>
                            🎯 {deliv.title}
                          </div>
                        ))}
                        {dayActions.map(action => (
                          <div key={action.id} className={`p-1 rounded text-[10px] leading-tight border ${action.completed ? 'bg-slate-800/50 border-slate-700 text-slate-500 line-through' : 'bg-amber-950/80 border-amber-500/30 text-amber-200'}`} title={`Action: ${action.title}`}>
                            📋 {action.title} {action.assignedTo && `(${action.assignedTo.split('@')[0]})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACTION ITEMS TAB */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Action Items & Reminders</h2>
                <button onClick={() => setShowCompletedTasks(!showCompletedTasks)} className="text-xs text-indigo-400 underline">
                  {showCompletedTasks ? "Hide Completed" : "Show Completed"}
                </button>
              </div>
              <button onClick={() => setShowActionModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>New Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {actionItems.filter(item => showCompletedTasks || !item.completed).map(item => {
                const overdue = isOverdue(item.dueDate, item.completed);
                return (
                  <div key={item.id} className={`bg-slate-900 border p-3 rounded-lg flex items-center justify-between ${overdue ? 'border-rose-500/60 bg-rose-950/10' : 'border-slate-800'} ${item.completed ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => toggleAction(item.id, item.completed)} className={`w-5 h-5 rounded flex items-center justify-center border ${item.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600'}`}>
                        {item.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>{item.title}</p>
                          {overdue && <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">Overdue</span>}
                        </div>
                        <p className="text-xs text-slate-400">{item.clientName} {item.assignedTo && <span className="text-indigo-400">• Assigned to: {item.assignedTo}</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {item.dueDate && <span className={`text-xs font-mono ${overdue ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>Due: {item.dueDate}</span>}
                      <button onClick={() => handleDeleteAction(item.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEAM & USER MANAGEMENT TAB */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Team & User Accounts</h2>
                <p className="text-xs text-slate-400">Assign team usernames and associate them with email credentials.</p>
              </div>
              <button onClick={() => setShowTeamModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded flex items-center space-x-1">
                <UserPlus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-3">Assigned Username</th>
                    <th className="p-3">Connected Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {teamMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{member.name}</td>
                      <td className="p-3 text-indigo-300 font-mono text-xs">{member.email}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${member.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteTeamMember(member.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {teamMembers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-500 text-xs">No team members added yet. Click "Add Team Member" above to create username-email connections.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* NAVIGATION BAR WITH CALENDAR TAB */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2 px-4 z-20">
        <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center text-xs ${activeTab === 'clients' ? 'text-indigo-400' : 'text-slate-400'}`}><Users className="w-5 h-5" /><span>Clients</span></button>
        <button onClick={() => setActiveTab('deliverables')} className={`flex flex-col items-center text-xs ${activeTab === 'deliverables' ? 'text-indigo-400' : 'text-slate-400'}`}><Briefcase className="w-5 h-5" /><span>Schedule</span></button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center text-xs ${activeTab === 'calendar' ? 'text-indigo-400' : 'text-slate-400'}`}><CalendarIcon className="w-5 h-5" /><span>Calendar</span></button>
        <button onClick={() => setActiveTab('actions')} className={`flex flex-col items-center text-xs ${activeTab === 'actions' ? 'text-indigo-400' : 'text-slate-400'}`}><CheckSquare className="w-5 h-5" /><span>Actions</span></button>
      </nav>

      {/* CLIENT ADD/EDIT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-sm text-slate-100">
            <h3 className="font-bold text-lg mb-4">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Client Name</label>
                <input type="text" required placeholder="Client Name" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={clientNameInput} onChange={(e) => setClientNameInput(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Client Tier</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={clientTierInput} onChange={(e) => setClientTierInput(e.target.value)}>
                  <option value="Tier 1">Tier 1 (Basic Service)</option>
                  <option value="Tier 2">Tier 2 (Standard Service)</option>
                  <option value="Tier 3">Tier 3 (Premium Service)</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setShowClientModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded text-sm">Cancel</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white py-2 rounded text-sm font-semibold">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERABLE MODAL */}
      {deliverableModalClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-sm text-slate-100">
            <h3 className="font-bold text-lg mb-4">{editingDeliverable ? 'Edit Deliverable' : 'Add Custom Deliverable'}</h3>
            <form onSubmit={handleSaveDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deliverable Title</label>
                <input type="text" required placeholder="Title" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newDelivTitle} onChange={(e) => setNewDelivTitle(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Type / Category</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newDelivType} onChange={(e) => setNewDelivType(e.target.value)}>
                  <optgroup label="General">
                    <option value="Meeting">Meeting</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Report">Report</option>
                    <option value="Induction">Induction</option>
                  </optgroup>
                  <optgroup label="Compliance & Operations">
                    <option value="Medical Underwriting">Medical Underwriting</option>
                    <option value="Rule Amendments">Rule Amendments</option>
                    <option value="Section 14 Transfers">Section 14 Transfers</option>
                    <option value="Claims">Claims</option>
                  </optgroup>
                  <optgroup label="Member Engagement">
                    <option value="Member Engagement: Presentation">Presentation</option>
                    <option value="Member Engagement: Induction">Induction</option>
                  </optgroup>
                  <optgroup label="Written Communication">
                    <option value="Written Communication: Letters">Letters</option>
                    <option value="Written Communication: SMSs">SMSs</option>
                    <option value="Written Communication: Benefits Statement">Benefits Statement</option>
                    <option value="Written Communication: Projection Statements">Projection Statements</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Date</label>
                <input type="date" required className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newDelivDate} onChange={(e) => setNewDelivDate(e.target.value)} />
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setDeliverableModalClient(null)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded text-sm">Cancel</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white py-2 rounded text-sm font-semibold">{editingDeliverable ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBER MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-sm text-slate-100">
            <h3 className="font-bold text-lg mb-4">Add Team Member</h3>
            <form onSubmit={handleAddTeamMember} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Display Username / Name</label>
                <input type="text" required placeholder="e.g. Jane Doe" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Connected Email Address</label>
                <input type="email" required placeholder="team@company.com" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Role</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="Member">Team Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setShowTeamModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded text-sm">Cancel</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white py-2 rounded text-sm font-semibold">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTION ITEM MODAL WITH ASSIGNEE DROPDOWN */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-sm text-slate-100">
            <h3 className="font-bold text-lg mb-4">New Action Item</h3>
            <form onSubmit={handleAddActionItem} className="space-y-4">
              <input type="text" required placeholder="Action Title" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newActionTitle} onChange={(e) => setNewActionTitle(e.target.value)} />
              <select required className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newActionClient} onChange={(e) => setNewActionClient(e.target.value)}>
                <option value="">Select Client...</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Assign To Team Member</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newActionAssignee} onChange={(e) => setNewActionAssignee(e.target.value)}>
                  <option value={user.email}>Self ({user.email})</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.email}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={newActionDueDate} onChange={(e) => setNewActionDueDate(e.target.value)} />
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setShowActionModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded text-sm">Cancel</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white py-2 rounded text-sm font-semibold">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}