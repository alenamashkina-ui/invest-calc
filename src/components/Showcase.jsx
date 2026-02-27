import React from 'react';
import { MapPin, TrendingUp, ArrowRight, Building2 } from 'lucide-react';

export const Showcase = () => {
  const lots = [
    {
      id: 1,
      tag: "БИЗНЕС-КЛАСС",
      city: "Санкт-Петербург, Васильевский остров",
      title: "Студия, 20 кв.м",
      price: "13 649 310 ₽",
      dp: "2 743 512 ₽",
      schedule: "1 928 ₽/мес до фев 2027, 28 243 ₽/мес до фев 2028. Далее переход на станд. ставку, рефинансируемся",
      growth: "+55%",
      profit: "~7 500 000 ₽",
      image: "https://optim.tildacdn.com/tild3766-3436-4362-b365-363963643036/-/format/webp/IMG_3601.PNG.webp"
    },
    {
      id: 2,
      tag: "БИЗНЕС-КЛАСС",
      city: "Москва, СЗАО",
      title: "1-комн. квартира, 40 кв.м",
      price: "26 553 100 ₽",
      dp: "7 992 483 ₽",
      schedule: "Платеж 123 484 ₽/мес на 7 лет. Далее переход на станд. ставку, рефинансируемся",
      growth: "+49%",
      profit: "~13 000 000 ₽",
      image: "https://optim.tildacdn.com/tild6662-3261-4464-a139-303133346563/-/format/webp/IMG_3602.PNG.webp"
    },
    {
      id: 3,
      tag: "БИЗНЕС-КЛАСС",
      city: "Калининград, историческая часть",
      title: "Студия, 25 кв.м",
      price: "8 981 807 ₽",
      dp: "450 000 ₽",
      schedule: "187 120 ₽ в мес. на 24 мес. На 25 мес. остаток или переход на ипотеку",
      growth: "+50%",
      profit: "~4 500 000 ₽",
      image: "https://optim.tildacdn.com/tild3131-6363-4430-a262-343464326638/-/format/webp/IMG_3603.PNG.webp"
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
            
            {/* Группа анимации теперь висит ТОЛЬКО на блоке с фотографией */}
            <div className="relative h-48 md:h-56 bg-[#f5f5f5] overflow-hidden group/photo cursor-pointer">
              <img 
                src={lot.image} 
                alt={lot.title} 
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover/photo:scale-110" 
              />
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

      <div className="mt-12 bg-white border border-[#987362]/30 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group/cta">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#fcf7f5] rounded-full blur-3xl opacity-50 pointer-events-none transition-transform duration-700 group-hover/cta:scale-150"></div>
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
          <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover/cta:translate-x-1" />
        </a>
      </div>
      
    </section>
  );
};