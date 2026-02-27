import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2 } from 'lucide-react';

// Хелпер для красивого форматирования денег в выписке
const formatMoney = (val) => {
  if (isNaN(val) || val === null || val === undefined) return "0 ₽";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(val) + " ₽";
};

export const LeadModal = ({ isOpen, onClose, auditData, rawAssets, rawSettings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Генератор полного досье клиента
  const generateDetailsText = () => {
    let text = "=== ДЕТАЛИЗАЦИЯ АКТИВОВ ===\n\n";

    if (rawAssets?.realEstate?.length > 0) {
      text += "НЕДВИЖИМОСТЬ:\n";
      rawAssets.realEstate.forEach((item, i) => {
        text += `${i + 1}. ${item.type || 'Объект'} ${item.city ? `(${item.city})` : ''}\n`;
        text += `   Куплено: ${item.purchaseYear} г. за ${formatMoney(item.purchasePrice)}\n`;
        text += `   Текущая цена: ${formatMoney(item.currentValue)}\n`;
        if (item.isUnderConstruction) text += `   Статус: В стройке\n`;
        if (item.hasMortgage) {
          text += `   Ипотека: долг ${formatMoney(item.loanBalance)}, платеж ${formatMoney(item.mortgagePayment)}/мес, ставка ${item.mortgageRate}%\n`;
        }
        if (item.isRented) {
          text += `   Аренда: приносит ${formatMoney(item.rentIncome)}/мес\n`;
        }
        text += "\n";
      });
    }

    if (rawAssets?.deposits?.length > 0) {
      text += "ДЕПОЗИТЫ:\n";
      rawAssets.deposits.forEach((item, i) => {
        text += `${i + 1}. Сумма: ${formatMoney(item.amount)}, Ставка: ${item.rate}%\n`;
      });
      text += "\n";
    }

    if (rawAssets?.stocks?.length > 0) {
      text += "АКЦИИ/ФОНДА:\n";
      rawAssets.stocks.forEach((item, i) => {
        text += `${i + 1}. Оценка: ${formatMoney(item.amount)}, Доходность: ${item.yield}%\n`;
      });
      text += "\n";
    }

    if (rawAssets?.cash > 0) {
      text += `НАЛИЧНЫЕ: ${formatMoney(rawAssets.cash)}\n\n`;
    }

    text += "=== ПАРАМЕТРЫ СТРАТЕГИИ (ТОЧКА Б) ===\n";
    text += `Семейная ипотека (6%): ${rawSettings?.isFamilyMortgage ? 'ЕСТЬ' : 'НЕТ'}\n`;
    if (rawSettings?.isAutoPayment) {
      text += `Комфортный платеж: АВТОРАСЧЕТ (инвест на все деньги)\n`;
    } else {
      text += `Комфортный платеж: ${formatMoney(rawSettings?.monthlyPaymentLimit)} в месяц\n`;
    }

    return text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !phone) {
      setErrorMessage('Пожалуйста, введите имя и телефон');
      return;
    }
    if (!agreePrivacy || !agreeData || !agreeMarketing) {
      setErrorMessage('Для записи необходимо поставить все три галочки согласия');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    const leadData = {
      type: 'CALCULATOR_LEAD',
      name: name,
      phone: phone,
      capital: Math.round(auditData.startCapital || 0),
      inefficient: Math.round(auditData.inefficientCapital || 0),
      income: Math.round(auditData.desiredIncome || 0),
      lostprofit: Math.round(auditData.lostProfit || 0),
      // Добавляем наше огромное сгенерированное досье
      details: generateDetailsText()
    };

    try {
      window.parent.postMessage(leadData, '*');

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setName('');
        setPhone('');
        setAgreePrivacy(false);
        setAgreeData(false);
        setAgreeMarketing(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Ошибка моста передачи:', error);
      setErrorMessage('Не удалось передать заявку.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-start pt-[10vh] pb-10 overflow-y-auto px-4 bg-[#1c1c1c]/60 backdrop-blur-sm no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}>
      <div className="bg-white w-full max-w-md p-6 md:p-8 relative shadow-2xl shrink-0 my-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#a0a0a0] hover:text-[#222222] transition-colors">
          <X className="w-6 h-6" />
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-tenor mb-2 text-[#222222]">Заявка отправлена</h3>
            <p className="text-sm text-[#666666] font-light">
              Спасибо! Мы свяжемся с вами в ближайшее время для обсуждения стратегии.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-tenor mb-2 text-[#222222]">Запись на разбор</h3>
            <p className="text-sm text-[#666666] font-light mb-6 pr-4">
              Оставьте контакты, и мы свяжемся с вами, чтобы превратить расчет в реальную стратегию
            </p>
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#666666] mb-1">Имя</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors"
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">Телефон</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors"
                  placeholder="+7 (999) 000-00-00"
                />
              </div>

              <div className="space-y-3 mt-4 border-t border-[#e5e5e5] pt-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#987362] cursor-pointer" />
                  <span className="text-xs text-[#666666]">Согласен с <a href="#" target="_blank" className="text-[#987362] hover:underline">политикой конфиденциальности</a></span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={agreeData} onChange={(e) => setAgreeData(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#987362] cursor-pointer" />
                  <span className="text-xs text-[#666666]">Даю согласие на <a href="#" target="_blank" className="text-[#987362] hover:underline">обработку данных</a></span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#987362] cursor-pointer" />
                  <span className="text-xs text-[#666666]">Согласен на отправку маркетинговых сообщений</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#987362] hover:bg-[#826152] text-white py-3.5 text-sm font-medium transition-colors mt-6 disabled:opacity-50"
              >
                {isLoading ? 'Отправка...' : 'Записаться'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};