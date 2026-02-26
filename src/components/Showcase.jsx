import React from 'react';
import { TrendingUp } from 'lucide-react';
import { showcaseLots } from '../config/data';

export const Showcase = ({ formatMoney }) => {
  return (
    <section className="space-y-8 pt-8 border-t border-[#e5e5e5] mt-10 print-break-inside-avoid">
      <div className="flex items-center space-x-3 pb-4">
        <TrendingUp className="w-6 h-6 text-[#987362]" />
        <h2 className="text-2xl font-tenor tracking-tight">Витрина перспективных лотов</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {showcaseLots.map(lot => (
          <div key={lot.id} className="bg-white border border-[#e5e5e5] flex flex-col group hover:border-[#987362] transition-colors duration-300 print-break-inside-avoid">
            <div className="h-48 bg-[#f5f5f5] flex items-center justify-center p-4 text-center text-[#a0a0a0] text-sm font-light border-b border-[#e5e5e5]">
              {lot.image}
            </div>
            <div className="p-6 flex flex-col flex-grow space-y-4">
              <div>
                <span className="text-xs font-medium text-[#987362] mb-1 block uppercase tracking-wider">{lot.city + ", " + lot.district}</span>
                <h3 className="font-medium text-lg leading-snug">{lot.title}</h3>
                <p className="text-sm text-[#666666] mt-1">{lot.area + " м²"}</p>
              </div>
              <div className="space-y-2 pt-4 border-t border-[#e5e5e5] mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Стоимость</span>
                  <span className="font-medium">{formatMoney(lot.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Первый взнос</span>
                  <span className="font-medium">{formatMoney(lot.price * 0.2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Платеж в мес</span>
                  <span className="font-medium">{"от " + formatMoney(lot.minPayment)}</span>
                </div>
              </div>
              <div className="bg-[#fafafa] p-4 mt-4 border border-[#e5e5e5]">
                <p className="text-xs text-[#666666] mb-1">Прогноз роста за 5 лет</p>
                <p className="font-medium text-lg text-[#987362] mb-3">
                  {"+" + lot.growth5y + "%"} <span className="text-sm text-[#222222]">{"(" + formatMoney(lot.futurePrice) + ")"}</span>
                </p>
                <button className="w-full bg-white hover:bg-[#fafafa] text-[#222222] border border-[#e5e5e5] hover:border-[#987362] py-2 text-sm font-medium transition-all no-print">
                  Узнать подробнее
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};