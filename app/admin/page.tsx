'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

type Cycle = {
  id: number;
  cycle_number: number;
  start_date: string;
  end_date: string;
};

type Participant = {
  id: number;
  name: string;
  position: number;
};

export default function AdminPage() {
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [selectedParticipantId, setSelectedParticipantId] = useState<number | ''>('');
  const [replaceName, setReplaceName] = useState('');

  useEffect(() => {
    if (isAdmin) loadAdminData();
  }, [isAdmin]);

  function formatDateRange(cycle: Cycle) {
    const start = new Date(cycle.start_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    const end = new Date(cycle.end_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    return `${start} - ${end}`;
  }

  function login() {
    if (password === '4444') {
      setIsAdmin(true);
      setLoginError('');
    } else {
      setLoginError('Құпия сөз қате');
    }
  }

  async function loadAdminData() {
    const { data: cycles } = await supabase
      .from('hatm_cycles')
      .select('id, cycle_number, start_date, end_date')
      .eq('active', true)
      .limit(1);

    if (!cycles || cycles.length === 0) return;

    const activeCycle = cycles[0];
    setCycle(activeCycle);

    const { data: participants } = await supabase
      .from('participants')
      .select('id, name, position')
      .eq('active', true)
      .order('position');

    setAllParticipants(participants || []);

    const { data: completions } = await supabase
      .from('completions')
      .select('participant_id')
      .eq('cycle_id', activeCycle.id);

    const completedIds = new Set((completions || []).map((item) => item.participant_id));

    const pending = (participants || []).filter(
      (participant) => !completedIds.has(participant.id)
    );

    setCompletedCount(completions?.length || 0);
    setPendingParticipants(pending);
  }

  async function replaceParticipant() {
    if (!selectedParticipantId) {
      setMessage('Орынды таңдаңыз');
      return;
    }
    if (!replaceName.trim()) {
      setMessage('Жаңа қатысушының атын жазыңыз');
      return;
    }

    const { error } = await supabase
      .from('participants')
      .update({ name: replaceName.trim() })
      .eq('id', selectedParticipantId);

    if (error) {
      setMessage('Қате: ' + error.message);
      return;
    }

    setMessage('Қатысушы ауыстырылды ✅');
    setSelectedParticipantId('');
    setReplaceName('');
    loadAdminData();
  }

  function getWhatsAppText() {
    if (!cycle) return '';

    const dateRange = formatDateRange(cycle);

    if (pendingParticipants.length === 0) {
      return `Ассаляму алейкум уа рахматуллаһи уа баракатуһ 🌙

${dateRange} хатымы бойынша бәрі оқып болды.

Аллаһ қабыл етсін 🤲`;
    }

    const list = pendingParticipants.map((user, index) => `${index + 1}. ${user.name}`).join('\n');

    return `Ассаляму алейкум уа рахматуллаһи уа баракатуһ 🌙

${dateRange} хатымы бойынша әлі белгілемегендер:

${list}

Мүмкіндік болса, бүгін оқып белгілеңіздер.

Аллаһ жеңілдік берсін, қабыл етсін 🤲`;
  }

  async function copyWhatsAppText() {
    try {
      await navigator.clipboard.writeText(getWhatsAppText());
      setMessage('WhatsApp мәтіні көшірілді ✅');
    } catch {
      setMessage('Көшіру мүмкін болмады. Мәтінді қолмен көшіріңіз.');
    }
  }

  async function startNewCycle() {
    if (!cycle) return;

    const confirmStart = confirm(
      `Қазіргі ${formatDateRange(cycle)} хатымын жауып, жаңа хатымды бастаймыз ба?`
    );

    if (!confirmStart) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 6);

    await supabase
      .from('hatm_cycles')
      .update({ active: false })
      .eq('active', true);

    const { error } = await supabase.from('hatm_cycles').insert([
      {
        cycle_number: cycle.cycle_number + 1,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
        active: true,
      },
    ]);

    if (error) {
      setMessage('Қате: ' + error.message);
      return;
    }

    setMessage('Жаңа хатым басталды ✅');
    loadAdminData();
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="max-w-sm w-full bg-zinc-900 rounded-3xl p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">🔐 Admin</h1>
          <p className="text-gray-400 mb-6">Құпия сөзді енгізіңіз</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') login();
            }}
            placeholder="Құпия сөз"
            className="w-full p-4 rounded-2xl bg-black border border-zinc-700 mb-4 text-center outline-none"
          />

          {loginError && <p className="text-red-400 mb-4 font-semibold">{loginError}</p>}

          <button
            onClick={login}
            className="w-full bg-green-600 hover:bg-green-700 transition rounded-2xl p-4 font-bold"
          >
            Кіру
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">⚙️ Admin</h1>
        <p className="text-gray-400 mb-8">Хатым басқару</p>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
          <p className="text-gray-400 mb-2">Қазіргі хатым</p>
          <h2 className="text-3xl font-bold text-green-500">
            {cycle ? formatDateRange(cycle) : 'Жоқ'}
          </h2>

          <div className="mt-6 border-t border-zinc-700 pt-6">
            <p className="text-gray-400 mb-2">Оқылған</p>
            <p className="text-2xl font-bold">{completedCount} / 30</p>
          </div>

          <div className="mt-4 border-t border-zinc-700 pt-4">
            <p className="text-gray-400 mb-2">Қалған</p>
            <p className="text-2xl font-bold text-yellow-400">
              {pendingParticipants.length} / 30
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-6 text-left">
          <h2 className="text-xl font-bold mb-4 text-center">🔁 Қатысушы ауыстыру</h2>

          <label className="block text-gray-400 text-sm mb-1">Орынды таңдаңыз</label>
          <select
            value={selectedParticipantId}
            onChange={(e) =>
              setSelectedParticipantId(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="w-full p-3 rounded-2xl bg-black border border-zinc-700 mb-4 text-white appearance-none"
          >
            <option value="">— Орын таңдаңыз —</option>
            {allParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.position}. {p.name}
              </option>
            ))}
          </select>

          <label className="block text-gray-400 text-sm mb-1">Жаңа қатысушы аты</label>
          <input
            type="text"
            placeholder='Мысалы: Ерлан немесе "Қатысушы жоқ"'
            value={replaceName}
            onChange={(e) => setReplaceName(e.target.value)}
            className="w-full p-3 rounded-2xl bg-black border border-zinc-700 mb-4 text-white placeholder-gray-600"
          />

          <button
            onClick={replaceParticipant}
            className="w-full bg-green-600 hover:bg-green-700 transition rounded-2xl p-4 font-bold text-center"
          >
            🔁 Ауыстыру
          </button>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">⏳ Оқымағандар</h2>
            <span className="text-green-500 font-bold">{pendingParticipants.length}</span>
          </div>

          {pendingParticipants.length === 0 ? (
            <p className="text-green-400 font-semibold text-center">Барлығы оқып болды ✅</p>
          ) : (
            <div className="space-y-2">
              {pendingParticipants.map((user, index) => (
                <div
                  key={user.id}
                  className="bg-black rounded-2xl p-3 flex items-center gap-3"
                >
                  <span className="text-gray-500 w-6">{index + 1}</span>
                  <span className="font-semibold">{user.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && <p className="mb-4 text-green-400 font-semibold">{message}</p>}

        <button
          onClick={copyWhatsAppText}
          className="w-full bg-zinc-800 hover:bg-zinc-700 transition rounded-2xl p-5 text-lg font-bold mb-4"
        >
          📋 WhatsApp мәтінін көшіру
        </button>

        <button
          onClick={startNewCycle}
          className="w-full bg-green-600 hover:bg-green-700 transition rounded-2xl p-5 text-xl font-bold"
        >
          🔄 Жаңа хатым бастау
        </button>

        <button
          onClick={() => setIsAdmin(false)}
          className="mt-6 text-sm text-gray-500 underline"
        >
          Шығу
        </button>

        <a href="/progress" className="block mt-6 text-green-500 underline">
          📊 Прогрессті көру
        </a>

        <a href="/" className="block mt-3 text-gray-500 underline">
          🏠 Басты бет
        </a>
      </div>
    </main>
  );
}