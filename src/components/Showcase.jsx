import React from 'react';
import { MapPin, TrendingUp, ArrowRight, Building2 } from 'lucide-react';

export const Showcase = () => {
  const lots = [
    {
      id: 1,
      tag: "БИЗНЕС-КЛАСС",
      city: "Калининград, историческая часть",
      title: "Студия, 25 кв.м",
      price: "8 981 807 ₽",
      dp: "450 000 ₽",
      schedule: "187 120 ₽ в мес. на 24 мес. На 25 мес. остаток или переход на ипотеку",
      growth: "+50%",
      profit: "~4 500 000 ₽",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 2,
      tag: "ПРЕМИУМ",
      city: "Москва, перспективный район ЗАО",
      title: "Евро-2, 42 кв.м",
      price: "14 500 000 ₽",
      dp: "2 175 000 ₽",
      schedule: "Транш 15% сейчас, 85% перед сдачей дома в 2027 г. (без удорожания стоимости)",
      growth: "+49%",
      profit: "~7 100 000 ₽",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 3,
      tag: "ДЛЯ ИНВЕСТИЦИЙ",
      city: "Краснодар, новый деловой центр",
      title: "Студия, 28 кв.м",
      price: "6 400 000 ₽",
      dp: "1 280 000 ₽",
      schedule: "Доступна семейная ипотека 6%, комфортный платеж составит всего 30 700 ₽/мес",
      growth: "+55%",
      profit: "~3 520 000 ₽",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <section className="pt-16 pb-8 print-break-inside-avoid">
      <div className="space-y-4 mb-10 text-center md:text-left border-b border-[#e5e5e5] pb-4">
        <div className="flex items-center justify-center md:justify-start space-x-3">
          <Building2 className="w-6 h-6 text-[#987362]" />
          <h2 className="text-2xl font-tenor tracking-tight text-[#222222]">Витрина инвестиционных лотов</h2>
        </div>
        <p className="text-[#666666] font-light text-sm max-w-2xl">
          Примеры реальных объектов, которые сейчас доступны для покупки с минимальным первым взносом и высоким потенциалом роста стоимости.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lots.map(lot => (
          <div key={lot.id} className="bg-white border border-[#e5e5e5] hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="relative h-48 md:h-56 bg-[#f5f5f5]">
              <img src={lot.image} alt={lot.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium text-[#222222]">
                {lot.tag}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center text-[#a0a0a0] text-xs mb-2">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{lot.city}</span>
              </div>
              <h3 className="font-tenor text-xl text-[#222222] mb-6">{lot.title}</h3>
              
              <div className="mb-6">
                <p className="text-[10px] text-[#a0a0a0] uppercase tracking-widest mb-1">Стоимость</p>
                <p className="text-2xl text-[#987362] font-medium">{lot.price}</p>
              </div>
              
              <div className="bg-[#fafafa] border border-[#e5e5e5] p-4 mb-6 flex-1">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e5e5e5]">
                  <span className="text-xs text-[#a0a0a0]">Первый взнос</span>
                  <span className="text-sm font-medium text-[#222222]">{lot.dp}</span>
                </div>
                <div>
                  <p className="text-[10px] text-[#a0a0a0] uppercase tracking-widest mb-2">График платежей</p>
                  <p className="text-xs text-[#222222] leading-relaxed">{lot.schedule}</p>
                </div>
              </div>
              
              <div className="bg-[#fcf7f5] p-4 flex justify-between items-end border border-[#f5e6e0]">
                <div>
                  <p className="text-[10px] text-[#a0a0a0] uppercase tracking-widest flex items-center mb-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Рост за 5 лет
                  </p>
                  <p className="text-3xl text-[#222222] font-tenor">{lot.growth}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#a0a0a0] uppercase tracking-widest mb-1">Прибыль</p>
                  <p className="text-sm font-medium text-[#987362]">{lot.profit}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- НОВЫЙ БЛОК ПРИЗЫВА В ТЕЛЕГРАМ --- */}
      <div className="mt-12 bg-white border border-[#987362]/30 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#fcf7f5] rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <h4 className="font-tenor text-2xl md:text-3xl text-[#222222]">Больше инвестиционных предложений</h4>
          <p className="text-[#666666] text-sm md:text-base font-light max-w-2xl">
            Мы регулярно находим и разбираем старты продаж, закрытые пулы и самые ликвидные лоты на рынке. Подписывайтесь на Telegram-канал агентства «Надо брать», чтобы первыми получать лучшие предложения.
          </p>
        </div>
        <a 
          href="https://t.me/mne_vse_nado" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="relative z-10 w-full md:w-auto inline-flex items-center justify-center bg-[#987362] hover:bg-[#826152] text-white px-8 py-4 text-sm font-medium transition-colors whitespace-nowrap"
        >
          <span>Перейти в Telegram</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </a>
      </div>
      {/* -------------------------------------- */}
      
    </section>
  );
};