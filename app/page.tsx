'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';

type Participant = {
  id: number;
  name: string;
  position: number;
  start_juz: number;
};

type HatmCycle = {
  id: number;
  cycle_number: number;
  start_date: string;
  end_date: string;
};

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [activeCycle, setActiveCycle] = useState<HatmCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    initApp();

    window.addEventListener('pageshow', initApp);

    return () => {
      window.removeEventListener('pageshow', initApp);
    };
  }, []);

  async function initApp() {
    try {
      const savedUser = localStorage.getItem('quran_circle_user');

      const { data: users } = await supabase
        .from('participants')
        .select('id, name, position, start_juz')
        .eq('active', true)
        .order('position');

      const freshList = users || [];
      setParticipants(freshList);

      // Refresh selectedUser from DB so start_juz is always current
      if (savedUser) {
        const parsed: Participant = JSON.parse(savedUser);
        const fresh = freshList.find((u) => u.id === parsed.id);
        if (fresh) {
          setSelectedUser(fresh);
          localStorage.setItem('quran_circle_user', JSON.stringify(fresh));
        }
      }

      const { data: cycles } = await supabase
        .from('hatm_cycles')
        .select('id, cycle_number, start_date, end_date')
        .eq('active', true)
        .limit(1);

      if (cycles && cycles.length > 0) {
        setActiveCycle(cycles[0]);
      }
    } catch (error) {
      console.error('Init error:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAssignedJuz(startJuz: number, cycleNumber: number) {
    return ((startJuz + cycleNumber - 3) % 30) + 1;
  }

  function formatDateRange(cycle: HatmCycle) {
    const start = new Date(cycle.start_date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });

    const end = new Date(cycle.end_date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });

    return `${start} - ${end}`;
  }

  function selectUser(user: Participant) {
    localStorage.setItem('quran_circle_user', JSON.stringify(user));
    setSelectedUser(user);
    setCompleted(false);
    setMessage('');
  }

  function changeUser() {
    localStorage.removeItem('quran_circle_user');
    setSelectedUser(null);
    setCompleted(false);
    setMessage('');
  }

  async function markAsCompleted() {
    if (!selectedUser) {
      setMessage('Қатысушы таңдалмаған');
      return;
    }

    if (!activeCycle) {
      setMessage('Белсенді хатым табылмады');
      return;
    }

    const { data: existing } = await supabase
      .from('completions')
      .select('id')
      .eq('participant_id', selectedUser.id)
      .eq('cycle_id', activeCycle.id)
      .limit(1);

    if (existing && existing.length > 0) {
      setCompleted(true);
      setMessage('Бұл хатым бойынша бұрын белгіленген ✅');
      return;
    }

    const { error } = await supabase.from('completions').insert([
      {
        participant_id: selectedUser.id,
        cycle_id: activeCycle.id,
        completed: true,
      },
    ]);

    if (error) {
      setMessage('Сақталмады: ' + error.message);
      return;
    }

    setCompleted(true);
    setMessage('Сақталды ✅');
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Жүктелуде...
      </main>
    );
  }

  if (!selectedUser) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">
            📖 Qur&apos;an Circle
          </h1>

          {activeCycle && (
            <p className="text-center text-green-500 font-semibold mb-3">
              {formatDateRange(activeCycle)}
            </p>
          )}

          <p className="text-center text-gray-400 mb-8">
            Атыңызды таңдаңыз
          </p>

          <div className="space-y-3">
            {participants.map((user) => (
              <button
                key={user.id}
                onClick={() => selectUser(user)}
                className="w-full bg-zinc-900 hover:bg-green-600 transition rounded-2xl p-4 text-left font-semibold"
              >
                {user.position}. {user.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const currentJuz = activeCycle
    ? getAssignedJuz(selectedUser.start_juz, activeCycle.cycle_number)
    : selectedUser.start_juz;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">
          📖 Qur&apos;an Circle
        </h1>

        <p className="text-gray-400">
          Ассаляму алейкум
        </p>

        {activeCycle && (
          <p className="text-green-500 font-semibold mb-8">
            {formatDateRange(activeCycle)}
          </p>
        )}

        <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
          <p className="text-gray-400 mb-2">Қатысушы</p>

          <h2 className="text-2xl font-bold">
            {selectedUser.name}
          </h2>

          <div className="mt-6 border-t border-zinc-700 pt-6">
            <p className="text-gray-400 mb-2">
              Осы аптадағы параңыз
            </p>

            <h3 className="text-4xl font-bold text-green-500">
              {currentJuz}-пара
            </h3>
          </div>
        </div>

        {message && (
          <p className="mb-4 text-green-400 font-semibold">{message}</p>
        )}

        <button
          onClick={markAsCompleted}
          disabled={completed}
          className={`w-full rounded-2xl p-5 text-xl font-bold transition ${
            completed
              ? 'bg-zinc-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {completed ? '✅ Белгіленді' : '✅ Оқыдым'}
        </button>

        <button
          onClick={changeUser}
          className="mt-6 text-sm text-gray-500 underline"
        >
          Атымды өзгерту
        </button>

        <a
  href="/progress"
  className="block mt-4 text-green-500 underline"
>
  📊 Прогрессті көру
</a>

<a
  href="/admin"
  className="block mt-3 text-gray-500 underline"
>
  ⚙️ Admin
</a>

<a
  href="/install"
  className="block mt-3 text-blue-500 underline"
>
  📱 Телефонға орнату
</a>
      </div>
    </main>
  );
}