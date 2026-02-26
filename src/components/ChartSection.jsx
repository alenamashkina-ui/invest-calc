import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { constants } from '../config/data';

export const ChartSection = ({
  calculationResults,
  targetCapital,
  formatMoney,
  chartData,
  currentProgress,
  activeProgress,
  lostProfit
}) => {
  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-[#e5e5e5] flex flex-col justify-center">
          <span className="text-sm font-medium text-[#666666] mb-1">Прогноз капитала через 15 лет</span>
          <span className="text-3xl font-medium tracking-tight">{formatMoney(calculationResults.finalReal)}</span>
          <span className="text-xs text-[#666666] mt-1 font-light">В пересчёте на сегодняшнюю покупательную способность</span>
        </div>
        <div className="bg-white p-6 border border-[#e5e5e5] flex flex-col justify-center">
          <span className="text-sm font-medium text-[#666666] mb-1">Во сколько раз вырастет капитал</span>
          <span className="text-3xl font-medium tracking-tight text-[#987362]">{"Примерно в " + Math.round(calculationResults.growthMultiplier) + " раз"}</span>
        </div>
        <div className="bg-white p-6 border border-[#e5e5e5] flex flex-col justify-center">
          <span className="text-sm font-medium text-[#666666] mb-1">Чистая доходность</span>
          <span className="text-3xl font-medium tracking-tight">{calculationResults.cagr + "%"}</span>
          <span className="text-xs text-[#666666] mt-1 font-light">Среднегодовой рост сверх инфляции</span>
        </div>
      </div>

      <div className="bg-[#1c1c1c] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-sm text-[#a0a0a0] mb-2 font-light">Капитал, необходимый для пассивного дохода</p>
          <p className="text-4xl md:text-5xl font-tenor tracking-tight text-[#987362]">{formatMoney(targetCapital)}</p>
          <p className="text-xs text-[#666666] mt-2 font-light">{"Расчет основан на безопасной доходности " + (constants.conservativeYield * 100) + "% годовых – это уровень, при котором капитал сохраняется и приносит стабильный доход"}</p>
        </div>
        <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-[#333333] pt-4 md:pt-0 md:pl-6 min-w-[200px]">
          <p className="text-sm text-[#a0a0a0] mb-1 font-light">Результат по выбранной стратегии</p>
          <p className="text-2xl font-medium">{formatMoney(calculationResults.finalReal)}</p>
          <div className="mt-2 flex items-center space-x-1.5 justify-start md:justify-end">
            {calculationResults.finalReal >= targetCapital ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Цель достижима с запасом</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-500 font-medium">Цель не достигается при текущих параметрах</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 border border-[#e5e5e5]">
        <div className="flex items-center space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#a0a0a0]"></div>
            <span className="text-xs text-[#666666] font-medium">Сценарий А (оставить как есть)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#987362]"></div>
            <span className="text-xs text-[#666666] font-medium">Сценарий Б (реинвестирование)</span>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#987362" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#987362" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRealA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a0a0a0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a0a0a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5ea" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12, fontFamily: 'Montserrat' }} tickFormatter={(val) => val + " год"} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12, fontFamily: 'Montserrat' }} tickFormatter={(val) => (val * 0.000001).toFixed(0) + " млн ₽"} />
              <Tooltip contentStyle={{ borderRadius: '0px', border: '1px solid #e5e5e5', boxShadow: 'none', fontFamily: 'Montserrat' }} formatter={(value, name) => [formatMoney(value), name === 'realCapital' ? 'Сценарий Б' : 'Сценарий А']} labelFormatter={(label) => "Год " + label} />
              <ReferenceLine y={targetCapital} stroke="#987362" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Целевой капитал', fill: '#987362', fontSize: 12, fontFamily: 'Montserrat' }} />
              <Area type="monotone" dataKey="realCapitalA" stroke="#a0a0a0" strokeWidth={2} fillOpacity={1} fill="url(#colorRealA)" activeDot={{ r: 4, fill: '#a0a0a0', stroke: '#fff', strokeWidth: 2 }} name="realCapitalA" />
              <Area type="monotone" dataKey="realCapital" stroke="#987362" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" activeDot={{ r: 5, fill: '#987362', stroke: '#fff', strokeWidth: 2 }} name="realCapital" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-[#e5e5e5] space-y-6">
        <h4 className="font-tenor text-xl">Сравнение двух сценариев</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-[#666666] mb-2 font-light">Сценарий А: Оставить активы без изменений</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-medium">{currentProgress + "%"}</span>
              <span className="text-sm text-[#a0a0a0]">от цели</span>
            </div>
            <div className="w-full bg-[#f5f5f5] h-2 mt-3 overflow-hidden">
              <div className="bg-[#a0a0a0] h-full transition-all duration-1000" style={{ width: currentProgress + "%" }}></div>
            </div>
            <p className="text-xs text-[#a0a0a0] mt-3 font-light">Текущая недвижимость дорожает медленно, а инфляция незаметно съедает ваши деньги.</p>
          </div>
          <div>
            <p className="text-sm text-[#666666] mb-2 font-light">Сценарий Б: Перераспределение капитала</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-medium text-[#987362]">{activeProgress + "%"}</span>
              <span className="text-sm text-[#a0a0a0]">от цели</span>
            </div>
            <div className="w-full bg-[#f5f5f5] h-2 mt-3 overflow-hidden">
              <div className="bg-[#987362] h-full transition-all duration-1000" style={{ width: activeProgress + "%" }}></div>
            </div>
            <p className="text-xs text-[#a0a0a0] mt-3 font-light">{"Вы достигаете " + activeProgress + "% цели. Мы перекладываем средства в перспективные лоты с помощью ипотеки, чтобы вы получали прибыль не только на свои, но и на заемные деньги банка."}</p>
          </div>
        </div>

        <div className="bg-red-50 p-5 border border-red-100 flex items-start space-x-3 mt-4 print-break-inside-avoid">
          <TrendingUp className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" style={{ transform: 'scaleY(-1)' }} />
          <div>
            <p className="font-medium text-red-900 text-sm mb-1">Разница между сценариями</p>
            <p className="text-2xl font-medium text-red-700 mb-1">{formatMoney(lostProfit)}</p>
            <p className="text-xs text-red-800 font-light leading-relaxed">
               Это разница между двумя сценариями. Именно столько вы недополучите через 15 лет, если оставите деньги в стареющей недвижимости вместо того, чтобы реинвестировать их в новые объекты.
            </p>
          </div>
        </div>

        <div className="bg-[#fafafa] p-5 border border-[#e5e5e5] flex items-start space-x-3 mt-4 print-break-inside-avoid">
          <TrendingUp className="w-5 h-5 text-[#987362] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#222222] text-sm mb-1">Итог расчета</p>
            <p className="text-sm text-[#666666] font-light leading-relaxed">
              {"Если переложить застрявшие деньги в высоколиквидную недвижимость, вы придете к желаемому пассивному доходу в " + (currentProgress > 0 ? (100 / currentProgress).toFixed(1) : "2") + " раз быстрее."}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 border border-[#e5e5e5] mt-6 print-break-inside-avoid">
          <p className="font-medium text-[#222222] text-sm mb-1">Представленный расчёт – это базовый сценарий</p>
          <p className="text-sm text-[#666666] font-light mb-4">На практике результат усиливается за счёт комплексного подхода:</p>
          <div className="text-sm text-[#666666] font-light space-y-3">
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
              <p>реинвестирования арендного дохода</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
              <p>масштабирования портфеля (1 → 2 → 3 объекта в цикле)</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
              <p>перехода в более высокий класс недвижимости</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
              <p>входа в проекты с повышенным потенциалом роста</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
              <p>использования специальных условий покупки от застройщиков</p>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
              <p>гибкой адаптации к рыночным циклам</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-[#a0a0a0] pt-4 text-center">
          * все расчеты в калькуляторе являются ориентировочными и не гарантируют будущую доходность
        </p>

      </div>
    </div>
  );
};