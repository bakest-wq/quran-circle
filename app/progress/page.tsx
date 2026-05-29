'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

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

type Completion = {
  participant_id: number;
};

export default function ProgressPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeCycle, setActiveCycle] = useState<HatmCycle | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const { data: cycles } = await supabase
        .from('hatm_cycles')
        .select('id, cycle_number, start_date, end_date')
        .eq('active', true)
        .limit(1);

      if (!cycles || cycles.length === 0) {
        setLoading(false);
        return;
      }

      const cycle = cycles[0];
      setActiveCycle(cycle);

      const { data: users } = await supabase
        .from('participants')
        .select('id, name, position, start_juz')
        .eq('active', true)
        .order('position');

      setParticipants(users || []);

      const { data: completions } = await supabase
        .from('completions')
        .select('participant_id')
        .eq('cycle_id', cycle.id);

      const ids = new Set(
        ((completions || []) as Completion[]).map((item) => item.participant_id)
      );

      setCompletedIds(ids);
    } finally {
      setLoading(false);
    }
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

  function getAssignedJuz(startJuz: number, cycleNumber: number) {
    return ((startJuz + cycleNumber - 3) % 30) + 1;
  }

  const completedCount = completedIds.size;
  const totalCount = participants.length || 30;
  const percentage = Math.round((completedCount / totalCount) * 100);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Жүктелуде...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">
            📊 Хатым Прогресі
          </h1>

          {activeCycle && (
            <p className="text-green-500 text-sm font-semibold">
              {formatDateRange(activeCycle)}
            </p>
          )}
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-6 text-center">
          <p className="text-gray-400 mb-2">Оқылған</p>

          <h2 className="text-4xl font-bold text-green-500">
            {completedCount} / {totalCount}
          </h2>

          <p className="text-gray-400 mt-2">
            {percentage}%
          </p>

          <div className="w-full bg-black rounded-full h-3 mt-5 overflow-hidden">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {participants.map((user) => {
            const isCompleted = completedIds.has(user.id);
            const juz = activeCycle
              ? getAssignedJuz(user.start_juz, activeCycle.cycle_number)
              : user.start_juz;

            return (
              <div
                key={user.id}
                className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
                  isCompleted ? 'bg-green-700' : 'bg-zinc-900'
                }`}
              >
                <span className="text-gray-400 text-sm w-6 shrink-0 text-right">
                  {user.position}
                </span>

                <span className="font-semibold flex-1 truncate">
                  {user.name}
                </span>

                <span className="text-sm text-gray-300 shrink-0">
                  {juz}-пара
                </span>

                <span className="text-lg shrink-0">
                  {isCompleted ? '✅' : '⏳'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8 mb-4">
          <a
            href="/"
            className="block text-green-500 underline"
          >
            🏠 Басты бет
          </a>

          <a
            href="/admin"
            className="block mt-3 text-gray-500 underline"
          >
            ⚙️ Admin
          </a>
        </div>
      </div>
    </main>
  );
}