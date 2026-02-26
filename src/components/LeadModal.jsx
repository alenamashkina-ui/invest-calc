import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export const LeadModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

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
    
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
      } else {
        setErrorMessage('Ошибка сервера. Проверьте папку api/lead.js');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setErrorMessage('Не удалось связаться с сервером.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ВАЖНО: изменили центрирование на items-start и добавили отступ сверху pt-[10vh], плюс скролл overflow-y-auto
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start pt-[10vh] pb-10 overflow-y-auto px-4 bg-[#1c1c1c]/60 backdrop-blur-sm no-print">
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
                  <input 
                    type="checkbox" 
                    checked={agreePrivacy} 
                    onChange={(e) => setAgreePrivacy(e.target.checked)} 
                    className="mt-0.5 w-4 h-4 accent-[#987362] cursor-pointer" 
                  />
                  <span className="text-xs text-[#666666]">
                    Согласен с <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#987362] hover:underline underline-offset-2">политикой конфиденциальности</a>
                  </span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreeData} 
                    onChange={(e) => setAgreeData(e.target.checked)} 
                    className="mt-0.5 w-4 h-4 accent-[#987362] cursor-pointer" 
                  />
                  <span className="text-xs text-[#666666]">
                    Даю согласие на <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#987362] hover:underline underline-offset-2">обработку персональных данных</a>
                  </span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreeMarketing} 
                    onChange={(e) => setAgreeMarketing(e.target.checked)} 
                    className="mt-0.5 w-4 h-4 accent-[#987362] cursor-pointer" 
                  />
                  <span className="text-xs text-[#666666]">Согласен на отправку маркетинговых сообщений</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#987362] hover:bg-[#826152] text-white py-3.5 text-sm font-medium transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Отправка...' : 'Записаться'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};