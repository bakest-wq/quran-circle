export default function InstallPage() {
  const steps = {
    iphone: [
      'Сілтемені Safari арқылы ашыңыз.',
      'Төмендегі "Бөлісу" батырмасын басыңыз.',
      '"Басты экранға қосу" таңдаңыз.',
      '"Қосу" батырмасын басыңыз.',
    ],
    android: [
      'Сілтемені Chrome арқылы ашыңыз.',
      'Жоғарғы оң жақтағы ⋮ батырмасын басыңыз.',
      '"Add to Home Screen" немесе "Орнату" таңдаңыз.',
      'Растап, басты экранға қосыңыз.',
    ],
  };

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">📱 Қосымшаны телефонға орнату</h1>
          <p className="text-gray-400 text-sm mt-2">
            Qur&apos;an Circle-ді басты экранға қосыңыз
          </p>
        </div>

        {/* iPhone */}
        <div className="bg-zinc-900 rounded-3xl p-5 mb-5">
          <h2 className="text-lg font-bold mb-4">📱 iPhone / Safari</h2>
          <ol className="space-y-3">
            {steps.iphone.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-200 text-sm leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Android */}
<div className="bg-zinc-900 rounded-3xl p-5 mb-8">
  <h2 className="text-lg font-bold mb-4">🤖 Android / Chrome</h2>

  <ol className="space-y-3">
    {steps.android.map((step, i) => (
      <li key={i} className="flex items-start gap-3">
        ...
      </li>
    ))}
  </ol>
</div>

{/* Result */}
<div className="bg-green-900/30 border border-green-700 rounded-3xl p-5 mb-8">
  <h3 className="font-bold text-green-400 mb-2">
    ✅ Нәтиже
  </h3>

  <p className="text-sm text-gray-200 leading-relaxed">
    Орнатылғаннан кейін Qur&apos;an Circle телефонның басты
    экранында кәдімгі қосымша сияқты көрінеді және бір басумен ашылады.
  </p>
</div>

{/* Links */}
<div className="text-center space-y-3">
  <a href="/" className="block text-green-500 underline">
    🏠 Басты бет
  </a>

  <a href="/progress" className="block text-gray-400 underline">
    📊 Прогресс
  </a>
</div>

      </div>
    </main>
  );
}
