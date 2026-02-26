import { constants } from '../config/data';

export const getYearWord = (years) => {
  let count = years % 100;
  if (count >= 5 && count <= 20) return 'лет';
  count = count % 10;
  if (count === 1) return 'год';
  if (count >= 2 && count <= 4) return 'года';
  return 'лет';
};

export const getRemainingBalance = (loanBalance, rate, payment, months) => {
  if (!loanBalance || loanBalance <= 0) return 0;
  let currentBalance = loanBalance;
  const monthlyRate = (rate / 100) / 12;
  for (let i = 0; i < months; i++) {
    const interest = currentBalance * monthlyRate;
    const principal = payment - interest;
    currentBalance -= principal;
    if (currentBalance <= 0) return 0;
  }
  return currentBalance;
};

// Новая умная логика оценки недвижимости
export const getRealEstateAudit = (yearsOwned, cagr, realTotalYield, roe, isUnderConstruction, isRented) => {
  const isHighGrowth = cagr >= 10; // Целевой прирост 10% в год

  // 1. Если объект в стройке
  if (isUnderConstruction) {
    if (isHighGrowth) {
      return {
        level: 'green',
        status: 'Ликвидный объект (в стройке)',
        comment: 'Объект отлично прибавляет в цене (более 10% в год). Ждем сдачу дома, чтобы зафиксировать прибыль или запустить арендный поток.'
      };
    } else {
      return {
        level: 'orange',
        status: 'Низкий темп роста',
        comment: 'Прирост цены меньше 10% в год. Для новостройки это тревожный сигнал. Рекомендуется рассмотреть продажу по переуступке и вложить в более ликвидный объект.'
      };
    }
  }

  // 2. Сдан, срок владения 5 лет и более
  if (yearsOwned >= 5) {
    if (!isHighGrowth) {
      return {
        level: 'red',
        status: 'Срочно к продаже',
        comment: 'Срок владения более 5 лет, а прирост цены меньше 10%. Началась амортизация здания. Срочно перевложить в новый выгодный старт продаж!'
      };
    } else {
      return {
        level: 'orange',
        status: 'Пора перевложить',
        comment: 'Объект оценивается как ликвидный, но чаще всего пик цены приходится на срок владения 5 лет. Дальше начинается амортизация. Рекомендуется перевложить капитал.'
      };
    }
  }

  // 3. Сдан, срок владения 4 года (готовимся к продаже)
  if (yearsOwned === 4) {
    return {
      level: 'orange',
      status: 'Пора перевложить',
      comment: 'Приближается 5-й год владения — чаще всего именно на этот период приходится пик цены. Пора готовить объект к продаже для перевложения.'
    };
  }

  // 4. Сдан, срок до 4 лет, НИЗКИЙ рост
  if (!isHighGrowth) {
    return {
      level: 'orange',
      status: 'Рекомендовано перевложить',
      comment: `Прирост цены меньше 10% в год. Рекомендуется вложить капитал в более ликвидный объект.${!isRented ? ' К тому же, квартира простаивает и не приносит арендный доход.' : ''}`
    };
  }

  // 5. Сдан, срок до 4 лет, ХОРОШИЙ рост, НО не сдается
  if (!isRented) {
    return {
      level: 'orange',
      status: 'Теряете арендный доход',
      comment: 'Объект оценивается как ликвидный (рост >10%), но он сдан и не приносит дохода. Нужно сдать в аренду или перевложить средства.'
    };
  }

  // 6. Сдан, хороший рост, сдается в аренду (Идеальный актив)
  return {
    level: 'green',
    status: 'Ликвидный объект',
    comment: 'Объект стабильно растет в цене и генерирует арендный доход. Чаще всего пик цены приходится на 5 лет владения, держим.'
  };
};

export const getDepositAudit = (realYield) => {
  if (realYield < 0) return { level: 'red', status: 'Капитал сгорает', comment: 'Инфляция съедает ваши деньги быстрее, чем начисляются проценты.' };
  if (realYield < 4) return { level: 'orange', status: 'Низкая эффективность', comment: 'Депозит едва покрывает инфляцию. Это инструмент сохранения, а не приумножения.' };
  return { level: 'green', status: 'Временная парковка', comment: 'Хорошая ставка. Отличный инструмент для хранения денег перед покупкой недвижимости.' };
};

export const getStockAudit = (realYield) => {
  if (realYield < 0) return { level: 'red', status: 'Убыточный портфель', comment: 'Доходность портфеля не покрывает инфляцию.' };
  if (realYield < 5) return { level: 'orange', status: 'Низкая доходность', comment: 'Слишком консервативный портфель. Стоит пересмотреть стратегию или переложить в бетон.' };
  return { level: 'green', status: 'Эффективный портфель', comment: 'Хорошая реальная доходность на фондовом рынке.' };
};

export const getCashAudit = (share) => {
  if (share > 20) return { level: 'red', status: 'Критический простой', comment: 'Слишком большая доля наличных. Деньги обесцениваются под воздействием инфляции.' };
  if (share > 10) return { level: 'orange', status: 'Завышенная подушка', comment: 'Наличные стоит сократить до 5-10% в качестве резерва, остальное реинвестировать.' };
  return { level: 'green', status: 'Здоровая пропорция', comment: 'Доля наличных в норме (подушка безопасности).' };
};

export const getAlertStyles = (level) => {
  switch(level) {
    case 'red': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600', cardBg: 'bg-white', cardBorder: 'border-red-200' };
    case 'orange': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-500', cardBg: 'bg-white', cardBorder: 'border-[#e5e5e5]' };
    case 'green': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600', cardBg: 'bg-white', cardBorder: 'border-[#e5e5e5]' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-500', cardBg: 'bg-white', cardBorder: 'border-[#e5e5e5]' };
  }
};