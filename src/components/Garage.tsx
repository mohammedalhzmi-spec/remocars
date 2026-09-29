import React, { useRef, useState } from 'react';
import { Car, CarCustomization, Upgrade } from '../types';
import { Wrench, Sparkles, Check, ShoppingBag, Zap, Shield, Gauge } from 'lucide-react';
import { soundManager } from '../audio';
const CarShowroom = React.lazy(() => import('./CarShowroom').then((module) => ({ default: module.CarShowroom })));

interface GarageProps {
  cars: Car[];
  selectedCar: Car;
  coins: number;
  playerLevel: number;
  upgrades: Upgrade[];
  onSelectCar: (car: Car) => void;
  onBuyCar: (car: Car) => void;
  onUpgradeItem: (upgrade: Upgrade) => void;
  onCustomizeCar: (car: Car) => void;
}

export const Garage: React.FC<GarageProps> = ({
  cars,
  selectedCar,
  coins,
  playerLevel,
  upgrades,
  onSelectCar,
  onBuyCar,
  onUpgradeItem,
  onCustomizeCar,
}) => {
  const [activeTab, setActiveTab] = useState<'cars' | 'upgrades'>('cars');
  const [uploadMessage, setUploadMessage] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const customization: CarCustomization = { pattern: 'solid', plateText: 'ريم 2026', ...selectedCar.customization };

  const updateCustomization = (patch: Partial<CarCustomization>, paint?: { color?: string; secondaryColor?: string }) => {
    onCustomizeCar({
      ...selectedCar,
      ...(paint?.color ? { color: paint.color } : {}),
      ...(paint?.secondaryColor ? { secondaryColor: paint.secondaryColor } : {}),
      customization: { ...customization, ...patch },
    });
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadMessage('اختر ملف صورة صالحاً.'); return; }
    if (file.size > 6 * 1024 * 1024) { setUploadMessage('حجم الصورة أكبر من 6 ميغابايت؛ اختر صورة أصغر.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setUploadMessage('تعذّر قراءة الصورة من الجهاز.');
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setUploadMessage('صيغة الصورة غير مدعومة.');
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 192;
        const context = canvas.getContext('2d');
        if (!context) { setUploadMessage('تعذّر تجهيز الصورة.'); return; }
        context.fillStyle = selectedCar.color; context.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(460 / image.width, 150 / image.height);
        const width = image.width * scale; const height = image.height * scale;
        context.drawImage(image, (512 - width) / 2, (192 - height) / 2, width, height);
        updateCustomization({ decalDataUrl: canvas.toDataURL('image/jpeg', 0.76) });
        setUploadMessage('تم حفظ الملصق على السيارة.');
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">مرآب السيارات والتطوير</h2>
          <p className="text-slate-400 text-sm">اختر سيارتك المفضلة أو قم بترقية قطع الغيار لمضاعفة فرص الفوز. مستواك الحالي: {playerLevel}</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('cars');
              soundManager.playBeep(600, 0.05);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'cars'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>السيارات ({cars.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('upgrades');
              soundManager.playBeep(600, 0.05);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'upgrades'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>قطع الترقية</span>
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 mb-8" aria-label="معرض السيارة ثلاثي الأبعاد">
        <React.Suspense fallback={<div className="h-64 md:h-80 grid place-items-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-400">جارٍ تحميل معرض السيارات ثلاثي الأبعاد…</div>}>
          <CarShowroom car={selectedCar} />
        </React.Suspense>
        <div className="flex flex-col justify-center rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          <span className="mb-3 w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">السيارة المختارة · {selectedCar.modelType.toUpperCase()}</span>
          <h3 className="text-2xl md:text-3xl font-black text-white">{selectedCar.name}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">{selectedCar.description}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[['السرعة', selectedCar.speed, 'bg-red-500'], ['التسارع', selectedCar.acceleration, 'bg-amber-400'], ['التحكم', selectedCar.handling, 'bg-emerald-400']].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-center">
                <div className="text-lg font-black text-white">{value}%</div>
                <div className="mt-1 text-[10px] text-slate-400">{label}</div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">اسحب على السيارة لمعاينتها من زوايا مختلفة. ترقياتك تؤثر على أداء السيارة أثناء السباق.</p>
        </div>
      </section>

      {activeTab === 'cars' && selectedCar.unlocked && (
        <section className="mb-8 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 md:p-7 text-right" aria-label="تخصيص السيارة">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><h3 className="text-xl font-black text-white">ورشة التخصيص</h3><p className="mt-1 text-xs text-slate-400">ألوان ونقوش وملصقات ولوحة سيارة عربية — تحفظ تلقائياً على هذا الجهاز.</p></div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">{selectedCar.name}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">لون الهيكل
              <input aria-label="لون هيكل السيارة" type="color" value={selectedCar.color} onChange={(event) => onCustomizeCar({ ...selectedCar, color: event.target.value })} className="mt-3 h-11 w-full cursor-pointer rounded-lg bg-transparent" />
            </label>
            <label className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">لون التفاصيل
              <input aria-label="لون تفاصيل السيارة" type="color" value={selectedCar.secondaryColor} onChange={(event) => onCustomizeCar({ ...selectedCar, secondaryColor: event.target.value })} className="mt-3 h-11 w-full cursor-pointer rounded-lg bg-transparent" />
            </label>
            <label className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">نقش الهيكل
              <select aria-label="نقش السيارة" value={customization.pattern} onChange={(event) => updateCustomization({ pattern: event.target.value as CarCustomization['pattern'] })} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white">
                <option value="solid">سادة</option><option value="stripes">خطوط سباق</option><option value="flames">لهيب</option><option value="geometric">هندسي</option>
              </select>
            </label>
            <label className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">نص لوحة السيارة
              <input aria-label="نص لوحة السيارة" dir="auto" maxLength={12} value={customization.plateText} onChange={(event) => updateCustomization({ plateText: event.target.value })} placeholder="مثال: ريم 2026" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input ref={imageInputRef} type="file" accept="image/*" onChange={(event) => { handleImageUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} className="hidden" aria-label="اختر صورة لملصق السيارة" />
            <button onClick={() => imageInputRef.current?.click()} className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-500/20">رفع صورة من الهاتف كملصق</button>
            {customization.decalDataUrl && <button onClick={() => updateCustomization({ decalDataUrl: undefined })} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700">إزالة الملصق</button>}
            {uploadMessage && <span role="status" className="text-xs text-emerald-300">{uploadMessage}</span>}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">تُضغط الصورة المختارة إلى ملصق صغير لتوفير مساحة التخزين، وتظهر على جانبي السيارة ولوحتها الأمامية والخلفية. لا ترفع صوراً شخصية أو خاصة.</p>
        </section>
      )}

      {activeTab === 'cars' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cars.map((car) => {
            const isSelected = selectedCar.id === car.id;
            const meetsLevel = playerLevel >= (car.requiredLevel ?? 1);
            const canBuy = coins >= car.price && meetsLevel;

            return (
              <div
                key={car.id}
                className={`bg-slate-900/90 border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
                  isSelected
                    ? 'border-red-500 shadow-xl shadow-red-500/20 bg-gradient-to-b from-slate-900 to-red-950/20'
                    : 'border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white p-1 rounded-full shadow-md">
                    <Check className="w-4 h-4" />
                  </div>
                )}

                <div>
                  <div className="text-6xl text-center py-6 group-hover:scale-110 transition-transform duration-300">
                    {car.imageIcon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{car.name}</h3>
                  <p className="text-xs text-slate-400 mb-6 h-10">{car.description}</p>

                  <div className="space-y-3 text-xs mb-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>السرعة</span>
                        <span>{car.speed}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${car.speed}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>التسارع</span>
                        <span>{car.acceleration}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${car.acceleration}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>التحكم</span>
                        <span>{car.handling}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${car.handling}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  {car.unlocked ? (
                    <button
                      onClick={() => {
                        onSelectCar(car);
                        soundManager.playBeep(500, 0.1);
                      }}
                      disabled={isSelected}
                      className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                        isSelected
                          ? 'bg-slate-800 text-slate-400 cursor-default'
                          : 'bg-slate-800 hover:bg-red-600 text-white shadow-md'
                      }`}
                    >
                      {isSelected ? 'السيارة المختارة' : 'اختر السيارة'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canBuy) {
                          onBuyCar(car);
                          soundManager.playCoin();
                        } else {
                          soundManager.playCrash();
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                        canBuy
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{!meetsLevel ? `تُفتح عند المستوى ${car.requiredLevel}` : car.price === 0 ? 'استلام مجاني' : `شراء مقابل ${car.price} عملة`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upgrades.map((upgrade) => {
            const canUpgrade = upgrade.level < upgrade.maxLevel && coins >= upgrade.cost;

            return (
              <div
                key={upgrade.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                      {upgrade.id === 'engine' ? <Gauge className="w-6 h-6" /> : upgrade.id === 'nitro' ? <Zap className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-700">
                      المستوى {upgrade.level} / {upgrade.maxLevel}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{upgrade.name}</h3>
                  <p className="text-xs text-slate-400 mb-6">{upgrade.description}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>مستوى التقدم</span>
                      <span>{Math.round((upgrade.level / upgrade.maxLevel) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all"
                        style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  {upgrade.level < upgrade.maxLevel ? (
                    <button
                      onClick={() => {
                        if (canUpgrade) {
                          onUpgradeItem(upgrade);
                          soundManager.playCoin();
                        } else {
                          soundManager.playCrash();
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                        canUpgrade
                          ? 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-red-600/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>ترقية القطعة ({upgrade.cost} عملة)</span>
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-center text-sm font-bold">
                      تم الوصول للمستوى الأقصى ⭐
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
