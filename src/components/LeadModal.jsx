import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2 } from 'lucide-react';

export const LeadModal = ({ isOpen, onClose, auditData }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Замораживаем фон (scroll), когда окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
        body: JSON.stringify({ name, phone, ...auditData }),
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
        setErrorMessage('Ошибка сервера. Попробуйте позже.');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setErrorMessage('Не удалось связаться с сервером.');
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

  // Используем Portal для выноса модального окна в корень документа
  return createPortal(modalContent, document.body);
};