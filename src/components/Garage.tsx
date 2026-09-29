import React, { useState } from 'react';
import { Car, Upgrade } from '../types';
import { Wrench, Sparkles, Check, ShoppingBag, Zap, Shield, Gauge } from 'lucide-react';
import { soundManager } from '../audio';

interface GarageProps {
  cars: Car[];
  selectedCar: Car;
  coins: number;
  upgrades: Upgrade[];
  onSelectCar: (car: Car) => void;
  onBuyCar: (car: Car) => void;
  onUpgradeItem: (upgrade: Upgrade) => void;
}

export const Garage: React.FC<GarageProps> = ({
  cars,
  selectedCar,
  coins,
  upgrades,
  onSelectCar,
  onBuyCar,
  onUpgradeItem,
}) => {
  const [activeTab, setActiveTab] = useState<'cars' | 'upgrades'>('cars');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">مرآب السيارات والتطوير</h2>
          <p className="text-slate-400 text-sm">اختر سيارتك المفضلة أو قم بترقية قطع الغيار لمضاعفة فرص الفوز.</p>
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

      {activeTab === 'cars' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cars.map((car) => {
            const isSelected = selectedCar.id === car.id;
            const canBuy = coins >= car.price;

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
                      <span>شراء مقابل {car.price} عملة</span>
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
