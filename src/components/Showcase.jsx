import React from 'react';
import { TrendingUp, MapPin } from 'lucide-react';

export const Showcase = ({ formatMoney }) => {
  const lots = [
    {
      id: 1,
      image: 'https://optim.tildacdn.com/tild3766-3436-4362-b365-363963643036/-/format/webp/IMG_3601.PNG.webp',
      type: 'Студия',
      location: 'Санкт-Петербург, Васильевский остров',
      class: 'Бизнес-класс',
      price: 13649310,
      initialPayment: 2743512,
      paymentText: '1 928 ₽ до фев 2027, затем 28 243 ₽ до фев 2028. Далее переход на станд. ставку, рефинансируемся',
      cagr: 16,
      profit5Years: 15000000,
      totalGrowth: 110
    },
    {
      id: 2,
      image: 'https://optim.tildacdn.com/tild6662-3261-4464-a139-303133346563/-/format/webp/IMG_3602.PNG.webp',
      type: '1-комн. квартира, 40 кв.м',
      location: 'Москва, Северо-запад',
      class: 'Бизнес-класс',
      price: 26553100,
      initialPayment: 7992483,
      paymentText: '123 484 ₽ на 7 лет. Далее переход на станд. ставку, рефинансируемся',
      cagr: 14,
      profit5Years: 24500000,
      totalGrowth: 93
    },
    {
      id: 3,
      image: 'https://optim.tildacdn.com/tild3131-6363-4430-a262-343464326638/-/format/webp/IMG_3603.PNG.webp',
      type: 'Студия',
      location: 'Калининград, историческая часть',
      class: 'Бизнес-класс',
      price: 8981807,
      initialPayment: 450000,
      paymentText: '187 120 ₽ в мес. на 24 мес. На 25 мес. остаток или переход на ипотеку',
      cagr: 15,
      profit5Years: 9000000,
      totalGrowth: 101
    }
  ];

  return (
    <section className="mt-20 pt-16 border-t border-[#e5e5e5] print-break-inside-avoid">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-tenor tracking-tight mb-2 text-[#222222]">Витрина ликвидных лотов</h2>
          <p className="text-[#666666] font-light text-sm max-w-3xl leading-relaxed">
            Примеры реальных объектов недвижимости, которые подходят под стратегию масштабирования капитала за счет правильного ипотечного плеча (рассрочки) и потенциала локации.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lots.map((lot) => (
          <div key={lot.id} className="bg-white border border-[#e5e5e5] flex flex-col group hover:shadow-lg transition-all duration-500">
            <div className="relative overflow-hidden aspect-[4/3] bg-[#fafafa]">
              <img 
                src={lot.image} 
                alt={lot.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-medium tracking-wider uppercase text-[#222222]">
                {lot.class}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start text-xs text-[#a0a0a0] mb-2 font-light">
                <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0 mt-0.5" />
                <span>{lot.location}</span>
              </div>
              <h3 className="font-medium text-lg leading-snug text-[#222222] mb-5">
                {lot.type}
              </h3>
              
              <div className="space-y-4 mb-6 flex-1">
                <div>
                  <p className="text-[10px] text-[#a0a0a0] uppercase tracking-wider mb-0.5">Стоимость</p>
                  <p className="text-2xl font-tenor text-[#987362]">{formatMoney(lot.price)}</p>
                </div>
                
                <div className="bg-[#fafafa] border border-[#e5e5e5] p-4 space-y-3">
                  <div className="flex justify-between items-baseline border-b border-[#e5e5e5] pb-3">
                    <span className="text-xs text-[#666666] font-light">Первый взнос</span>
                    <span className="font-medium text-sm text-[#222222]">{formatMoney(lot.initialPayment)}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider block mb-1.5">График платежей</span>
                    <span className="text-xs font-medium leading-relaxed block text-[#222222]">{lot.paymentText}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f5e6e0] p-4 border border-[#e5d5ce]">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#987362]" />
                  <span className="text-[10px] font-medium text-[#987362] uppercase tracking-wider">Прогноз роста за 5 лет</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-tenor text-[#222222]">+{lot.totalGrowth}%</span>
                  <span className="text-xs text-[#666666] font-light">≈ {lot.cagr}% в год</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#e5d5ce]/50 flex justify-between items-center">
                  <span className="text-xs text-[#987362] font-medium">Потенциал прибыли:</span>
                  <span className="text-sm font-bold text-[#987362]">~{formatMoney(lot.profit5Years)}</span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
};