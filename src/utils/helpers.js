import { constants } from '../config/data';

export const getYearWord = (number) => {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['год', 'года', 'лет'];
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
};

export const getRemainingBalance = (balance, annualRate, monthlyPayment, months) => {
  if (balance <= 0 || monthlyPayment <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  let currentBalance = balance;
  
  for (let i = 0; i < months; i++) {
    currentBalance = currentBalance * (1 + r) - monthlyPayment;
    if (currentBalance <= 0) return 0;
  }
  return currentBalance;
};

export const getRealEstateAudit = (yearsOwned, cagr, realTotalYield, roe) => {
  if ((yearsOwned > 5 && cagr < 10) || roe < 0) {
    return { 
      level: 'red', 
      status: 'Срочно к продаже', 
      comment: roe < 0 
        ? 'Текущий денежный поток отрицательный. Актив требует постоянных вливаний средств, что снижает эффективность портфеля'
        : 'Премия стадии исчерпана. Актив перешел в фазу амортизации, капитал заморожен в низкоэффективном объекте' 
    };
  }
  if (cagr > 10 && yearsOwned > 4 && yearsOwned <= 5) {
    return { level: 'yellow', status: 'Фаза пика', comment: 'Вероятная стадия ценового пика. Стоит оценить фиксацию прибыли' };
  }
  if (cagr < 10 || realTotalYield < 5 || yearsOwned > 4) {
    return { level: 'orange', status: 'Рекомендуется перевложить', comment: 'Темп роста ниже целевого или капитал замедляется' };
  }
  if (cagr >= 10 && realTotalYield >= 10 && yearsOwned <= 4) {
    return { level: 'green', status: 'Высоколиквидный', comment: 'Рост выше рынка, стадия строительства еще не исчерпана' };
  }
  return { level: 'yellow', status: 'Требует внимания', comment: 'Актив демонстрирует среднюю эффективность. Есть потенциал для оптимизации' };
};

export const getStockAudit = (realYield) => {
  if (realYield < 0) return { level: 'red', status: 'Пересмотреть стратегию', comment: 'Доходность ниже нуля. Капитал обесценивается' };
  if (realYield >= 0 && realYield < 5) return { level: 'orange', status: 'Пересмотреть структуру', comment: 'Капитал работает слабо' };
  if (realYield >= 5 && realYield < 10) return { level: 'yellow', status: 'Ниже потенциала', comment: 'Доходность ниже целевой для фондового рынка' };
  return { level: 'green', status: 'Эффективный', comment: 'Капитал работает максимально эффективно' };
};

export const getDepositAudit = (realYield) => {
  if (realYield < -2) return { level: 'orange', status: 'Обесценивание', comment: 'Депозит не компенсирует инфляцию. Рассмотрите альтернативы' };
  if (realYield >= -2 && realYield < 0) return { level: 'yellow', status: 'Почти нулевая эффективность', comment: 'Капитал частично съедается инфляцией' };
  return { level: 'green', status: 'Защитная позиция', comment: 'Капитал надежно сохраняется' };
};

export const getCashAudit = (sharePercent) => {
  if (sharePercent > 40) return { level: 'orange', status: 'Капитал простаивает', comment: 'Высокая доля неинвестированных средств снижает общую эффективность портфеля' };
  if (sharePercent > 20 && sharePercent <= 40) return { level: 'yellow', status: 'Избыточная ликвидность', comment: 'Часть капитала не работает и подвержена инфляции' };
  return { level: 'green', status: 'Ликвидный резерв', comment: 'Оптимальная доля для обеспечения ликвидности' };
};

export const getAlertStyles = (level) => {
  switch(level) {
    case 'red': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-900', desc: 'text-red-800', icon: 'text-red-600', cardBg: 'bg-red-50/30', cardBorder: 'border-red-200' };
    case 'orange': return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-900', desc: 'text-orange-800', icon: 'text-orange-600', cardBg: 'bg-orange-50/30', cardBorder: 'border-orange-200' };
    case 'yellow': return { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-900', desc: 'text-yellow-800', icon: 'text-yellow-600', cardBg: 'bg-yellow-50/30', cardBorder: 'border-yellow-200' };
    case 'green': return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-900', desc: 'text-green-800', icon: 'text-green-600', cardBg: 'bg-white', cardBorder: 'border-[#e5e5e5]' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-900', desc: 'text-gray-800', icon: 'text-gray-600', cardBg: 'bg-white', cardBorder: 'border-[#e5e5e5]' };
  }
};