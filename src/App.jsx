import React, { useState, useEffect } from 'react';
import { 
  Calculator, ArrowRight, Plus, Trash2, Home, Wallet, 
  AlertCircle, CheckCircle2, Settings2, Scale, ExternalLink, Download 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { CURRENT_YEAR, constants } from './config/data';
import { 
  getYearWord, getAlertStyles, getRealEstateAudit, 
  getDepositAudit, getStockAudit, getCashAudit 
} from './utils/helpers';
import { Showcase } from './components/Showcase';
import { ChartSection } from './components/ChartSection';
import { LeadModal } from './components/LeadModal';
import { useCalculator } from './hooks/useCalculator';

const formatNumInput = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatMoney = (val) => {
  if (isNaN(val) || val === null || val === undefined) return "0 ₽";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(val) + " ₽";
};

const NumberInput = ({ value, onChange, className, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  let displayValue = value;
  if (value === '' || value === null || value === undefined) {
    displayValue = '';
  } else if (!isFocused) {
    displayValue = formatNumInput(value);
  }

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw === '' ? '' : Number(raw));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default function App() {
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement.type === 'text' || document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfReadyObj, setPdfReadyObj] = useState(null); // Новый стейт для зеленой кнопки

  const [realEstate, setRealEstate] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [cash, setCash] = useState(null);
  const [cashId, setCashId] = useState(1);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [stocks, setStocks] = useState([]);

  const [startCapital, setStartCapital] = useState('');
  const [isAutoPayment, setIsAutoPayment] = useState(false);
  const [monthlyPaymentLimit, setMonthlyPaymentLimit] = useState('');
  const [isFamilyMortgage, setIsFamilyMortgage] = useState(false);
  const [desiredPassiveIncome, setDesiredPassiveIncome] = useState('');

  const { 
    auditResults, targetCapital, calculationResults, currentStrategyFinalReal, 
    chartData, currentProgress, activeProgress, lostProfit 
  } = useCalculator({
    realEstate, deposits, stocks, cash, 
    startCapital, isAutoPayment, monthlyPaymentLimit, 
    isFamilyMortgage, desiredPassiveIncome
  });

  const { firstCycleUnusedCapital, firstCyclePropertiesCount, optimalFullPayment } = calculationResults;

  useEffect(() => {
    setStartCapital(Math.round(auditResults.totalPotentialCapital));
  }, [auditResults.totalPotentialCapital]);

  const addRE = () => {
    setRealEstate(prev => [{
      id: Date.now(), type: '', city: '', buildYear: '', purchaseYear: CURRENT_YEAR, purchasePrice: '', currentValue: '',
      hasMortgage: false, initialPayment: '', loanBalance: '', mortgagePayment: '', mortgageRate: '',
      isUnderConstruction: false, isRented: false, rentIncome: '', isEditing: true
    }, ...prev]);
  };

  const addDeposit = () => setDeposits(prev => [{ id: Date.now(), amount: '', rate: '', isEditing: true }, ...prev]);
  const addStock = () => setStocks(prev => [{ id: Date.now(), amount: '', yield: '', isEditing: true }, ...prev]);
  const addCash = () => { setCash(''); setIsEditingCash(true); setCashId(Date.now()); };

  const updateRE = (id, field, value) => setRealEstate(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  const toggleEditRE = (id) => setRealEstate(prev => prev.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : item));
  const removeRE = (id) => setRealEstate(prev => prev.filter(item => item.id !== id));

  const updateDeposit = (id, field, value) => setDeposits(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  const toggleEditDeposit = (id) => setDeposits(prev => prev.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : item));
  const removeDeposit = (id) => setDeposits(prev => prev.filter(item => item.id !== id));

  const updateStock = (id, field, value) => setStocks(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  const toggleEditStock = (id) => setStocks(prev => prev.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : item));
  const removeStock = (id) => setStocks(prev => prev.filter(item => item.id !== id));

  const renderAuditBadge = (audit) => {
    const styles = getAlertStyles(audit.level);
    const pulseClass = audit.level === 'red' ? 'animate-urgent-pulse' : '';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles.text} ${styles.border} ${styles.bg} ${pulseClass}`}>
        {audit.status}
      </span>
    );
  };

  const renderAuditAlert = (audit, lostAlternativeIncome = 0) => {
    const styles = getAlertStyles(audit.level);
    const Icon = audit.level === 'green' ? CheckCircle2 : AlertCircle;
    
    return (
      <div className={`mt-4 mb-6 p-4 rounded-md border ${styles.bg} ${styles.border}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium mb-1 ${styles.text}`}>Статус: {audit.status}</p>
            <p className={`text-xs leading-relaxed ${styles.desc}`}>{audit.comment}</p>
            {lostAlternativeIncome > 0 && (
              <div className={`mt-3 pt-3 flex items-center justify-between border-t ${styles.border}`}>
                <span className={`text-xs font-medium ${styles.text}`}>Потерянная альтернативная доходность</span>
                <span className="text-sm font-bold text-red-600">-{formatMoney(Math.round(lostAlternativeIncome))} / год</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const combinedAssets = [
    ...realEstate.map(item => ({ ...item, assetCategory: 'realEstate' })),
    ...deposits.map(item => ({ ...item, assetCategory: 'deposit' })),
    ...stocks.map(item => ({ ...item, assetCategory: 'stock' }))
  ];

  if (cash !== null) {
    combinedAssets.push({ id: cashId, assetCategory: 'cash', amount: cash, isEditing: isEditingCash });
  }

  combinedAssets.sort((a, b) => b.id - a.id);

  // --- ШАГ 1: Асинхронная подготовка PDF (Без вызова скачивания, чтобы не злить айфон) ---
  const handlePreparePDF = async () => {
    setIsDownloading(true);
    setPdfReadyObj(null);
    const element = document.getElementById('pdf-wrap');

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 1.5, // Уменьшил с 2 до 1.5, чтобы мобилки не "выплевывали" ошибку памяти
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fafafa',
        windowWidth: 1200,
        onclone: (documentClone) => {
          // Прячем всё, что не нужно в отчете
          const noPrintElements = documentClone.querySelectorAll('.no-print');
          noPrintElements.forEach(el => el.style.display = 'none');
          
          // Показываем секретный блок с контактами, который мы добавим в PDF
          const contactsBlock = documentClone.getElementById('pdf-contacts');
          if (contactsBlock) {
            contactsBlock.style.display = 'block';
            contactsBlock.classList.remove('hidden');
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Создаем файл и сохраняем его в память
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const file = new File([pdfBlob], 'Инвестиционный_калькулятор.pdf', { type: 'application/pdf' });

      setPdfReadyObj({ url: pdfUrl, file });

    } catch (error) {
      console.error("Ошибка при создании PDF:", error);
      alert("Не удалось собрать данные. Пожалуйста, перезагрузите страницу.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- ШАГ 2: Синхронное скачивание/шеринг по клику человека ---
  const handleSavePDF = async () => {
    if (!pdfReadyObj) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.canShare) {
      try {
        if (navigator.canShare({ files: [pdfReadyObj.file] })) {
          await navigator.share({
            files: [pdfReadyObj.file],
            title: 'Инвестиционный расчет',
          });
        } else {
          throw new Error("Share not supported");
        }
      } catch (error) {
        // Если клиент отменил шеринг или айфон заблокировал, просто скачиваем
        const link = document.createElement('a');
        link.href = pdfReadyObj.url;
        link.download = 'Инвестиционный_калькулятор.pdf';
        link.click();
      }
    } else {
      // Компьютер: мгновенное скачивание файла
      const link = document.createElement('a');
      link.href = pdfReadyObj.url;
      link.download = 'Инвестиционный_калькулятор.pdf';
      link.click();
    }
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Tenor+Sans&display=swap'); 
        .font-tenor { font-family: 'Tenor Sans', sans-serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes urgentPulse { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); } 50% { box-shadow: 0 0 12px 6px rgba(220, 38, 38, 0.2); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
        .animate-urgent-pulse { animation: urgentPulse 1.5s infinite; }
      `}</style>

      <div className="min-h-screen bg-[#fafafa] text-[#222222] font-montserrat p-4 md:p-10 pb-20 overflow-x-hidden">
        
        {/* === БЛОК ДЛЯ PDF (теперь в него попадает только самое важное) === */}
        <div className="max-w-6xl mx-auto space-y-16 bg-[#fafafa] relative" id="pdf-wrap">
          <header className="text-center space-y-4 pt-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-tenor tracking-tight">Инвестиционный калькулятор</h1>
            <p className="text-lg text-[#666666] font-light max-w-2xl mx-auto px-4">Диагностика ваших активов и план максимизации роста капитала</p>
          </header>

          <div className="max-w-4xl mx-auto bg-white border border-[#e5e5e5] p-6 md:p-8 text-sm text-[#666666] font-light leading-relaxed">
            <p className="font-medium text-[#222222] mb-4 text-base">Этот калькулятор показывает базовую модель масштабирования капитала через недвижимость</p>
            <p className="mb-4">Стратегия основана на четырёх ключевых принципах:</p>
            <div className="space-y-4">
              <div className="flex items-start"><CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" /><p>рост стоимости ликвидных объектов, особенно при входе в projects на старте продаж</p></div>
              <div className="flex items-start"><CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" /><p>использование кредитного плеча – покупка с ипотекой при первоначальном взносе от 20%</p></div>
              <div className="flex items-start"><CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" /><p>продажа объекта на пике роста цены, как правило через 4–5 лет владения</p></div>
              <div className="flex items-start"><CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" /><p>эффект сложного процента за счёт последовательного реинвестирования капитала</p></div>
            </div>
          </div>

          <section className="space-y-8">
            <div className="bg-white p-6 md:p-8 border border-[#e5e5e5] space-y-4">
              <h2 className="text-2xl font-tenor tracking-tight">1 шаг. Оценка финансовой точки А</h2>
              <p className="text-[#666666] font-light leading-relaxed text-sm">Введите свои активы, чтобы оценить их доходность и потенциал, а также выявить средства, которые стоит перераспределить для максимального роста капитала</p>
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#e5e5e5] no-print">
                <button onClick={addRE} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center"><Plus className="w-4 h-4 mr-1.5" /> Недвижимость</button>
                <button onClick={addDeposit} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center"><Plus className="w-4 h-4 mr-1.5" /> Депозит</button>
                <button onClick={addStock} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center"><Plus className="w-4 h-4 mr-1.5" /> Акции</button>
                {cash === null && <button onClick={addCash} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center"><Plus className="w-4 h-4 mr-1.5" /> Наличные</button>}
              </div>
            </div>

            <div className="space-y-6">
              {combinedAssets.length === 0 && <p className="text-sm text-[#666666] font-light p-6 bg-white border border-[#e5e5e5] text-center">Вы пока не добавили ни одного актива</p>}

              {combinedAssets.map(asset => {
                if (asset.assetCategory === 'realEstate') {
                  const item = asset;
                  const yearsOwned = Math.max(1, CURRENT_YEAR - (Number(item.purchaseYear) || CURRENT_YEAR));
                  const cValue = Number(item.currentValue) || 0;
                  const pPrice = Number(item.purchasePrice) || 0;
                  const commission = cValue * constants.commissionPercent;
                  let tax = 0;
                  if (yearsOwned < constants.taxFreeYears && cValue > pPrice) tax = (cValue - pPrice) * constants.taxRate;

                  const activeLoanBalance = item.hasMortgage ? (Number(item.loanBalance) || 0) : 0;
                  const equity = cValue - activeLoanBalance - commission - tax;
                  
                  const mPayment = Number(item.mortgagePayment) || 0;
                  const rIncome = Number(item.rentIncome) || 0;
                  const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? rIncome : 0) - (item.hasMortgage ? mPayment : 0);
                  const roe = equity > 0 ? ((netMonthlyRent * 12) / equity) * 100 : 0;
                  
                  let cagr = 0;
                  if (pPrice > 0 && cValue > 0) cagr = (Math.pow(cValue / pPrice, 1 / yearsOwned) - 1) * 100;
                  const totalGrowthPercent = pPrice > 0 ? (((cValue - pPrice) / pPrice) * 100).toFixed(1) : 0;
                  
                  const totalNominalYield = cagr + roe;
                  const realTotalYield = totalNominalYield - constants.inflation;
                  const audit = getRealEstateAudit(yearsOwned, cagr, realTotalYield, roe, item.isUnderConstruction, item.isRented);
                  const lostYieldPercent = constants.alternativeYieldPercent - totalNominalYield;
                  const lostAlternativeIncome = lostYieldPercent > 0 ? (Math.max(0, equity) * (lostYieldPercent / 100)) : 0;
                  const cStyles = getAlertStyles(audit.level);

                  if (item.isEditing) {
                    return (
                      <div key={`re-${item.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Home className="w-5 h-5 mr-2 text-[#987362]" /> Параметры недвижимости</h4>
                          <button onClick={() => removeRE(item.id)} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Тип объекта</label>
                            <input type="text" value={item.type} onChange={(e) => updateRE(item.id, 'type', e.target.value)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors placeholder:text-gray-300 focus:placeholder-transparent" placeholder="Двушка в ЖК Familia или комната в коммуналке" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Город (необязательно)</label>
                            <input type="text" value={item.city} onChange={(e) => updateRE(item.id, 'city', e.target.value)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" placeholder="Москва" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Год постройки дома</label>
                            <input type="number" value={item.buildYear === '' ? '' : item.buildYear} onChange={(e) => updateRE(item.id, 'buildYear', e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" placeholder="Например, 2015" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Год приобретения</label>
                            <input type="number" value={item.purchaseYear === '' ? '' : item.purchaseYear} onChange={(e) => updateRE(item.id, 'purchaseYear', e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Текущая рыночная цена (₽)</label>
                            <NumberInput value={item.currentValue} onChange={(val) => updateRE(item.id, 'currentValue', val)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                            <button onClick={() => setIsModalOpen(true)} className="text-[10px] text-[#987362] hover:underline mt-1 flex items-center"><ExternalLink className="w-3 h-3 mr-1" /> Запросить точную оценку</button>
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Цена покупки (₽)</label>
                            <NumberInput value={item.purchasePrice} onChange={(val) => updateRE(item.id, 'purchasePrice', val)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                            <p className="text-[10px] text-[#a0a0a0] mt-1 leading-tight">Если досталась бесплатно (наследство/подарок), оставьте 0</p>
                          </div>
                          <div className="sm:col-span-2 space-y-4 bg-white p-4 border border-[#e5e5e5]">
                            <div className="flex items-center space-x-3 text-sm">
                              <input type="checkbox" id={`construction-${item.id}`} checked={item.isUnderConstruction || false} onChange={(e) => { updateRE(item.id, 'isUnderConstruction', e.target.checked); if (e.target.checked) { updateRE(item.id, 'isRented', false); updateRE(item.id, 'rentIncome', ''); } }} className="w-4 h-4 accent-[#987362] cursor-pointer" />
                              <label htmlFor={`construction-${item.id}`} className="font-medium cursor-pointer select-none">Объект находится в стройке</label>
                            </div>
                          </div>
                          <div className="sm:col-span-2 space-y-4 bg-white p-4 border border-[#e5e5e5]">
                            <div className="flex items-center space-x-3 text-sm">
                              <input type="checkbox" id={`mortgage-${item.id}`} checked={item.hasMortgage} onChange={(e) => updateRE(item.id, 'hasMortgage', e.target.checked)} className="w-4 h-4 accent-[#987362] cursor-pointer" />
                              <label htmlFor={`mortgage-${item.id}`} className="font-medium cursor-pointer select-none">Объект в ипотеке</label>
                            </div>
                            {item.hasMortgage && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-7 border-l-2 border-[#e5e5e5] mt-4">
                                <div><label className="text-xs text-[#666666] mb-1 block">Первый взнос (₽)</label><NumberInput value={item.initialPayment} onChange={(val) => updateRE(item.id, 'initialPayment', val)} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                                <div><label className="text-xs text-[#666666] mb-1 block">Остаток долга (₽)</label><NumberInput value={item.loanBalance} onChange={(val) => updateRE(item.id, 'loanBalance', val)} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                                <div><label className="text-xs text-[#666666] mb-1 block">Платеж в месяц (₽)</label><NumberInput value={item.mortgagePayment} onChange={(val) => updateRE(item.id, 'mortgagePayment', val)} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                                <div><label className="text-xs text-[#666666] mb-1 block">Ставка (%)</label><input type="number" value={item.mortgageRate === '' ? '' : item.mortgageRate} onChange={(e) => updateRE(item.id, 'mortgageRate', e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                              </div>
                            )}
                          </div>
                          {!item.isUnderConstruction && (
                            <div className="sm:col-span-2 space-y-4 bg-white p-4 border border-[#e5e5e5]">
                              <div className="flex items-center space-x-3 text-sm">
                                <input type="checkbox" id={`rent-${item.id}`} checked={item.isRented} onChange={(e) => updateRE(item.id, 'isRented', e.target.checked)} className="w-4 h-4 accent-[#987362] cursor-pointer" />
                                <label htmlFor={`rent-${item.id}`} className="font-medium cursor-pointer select-none">Актив сдается в аренду</label>
                              </div>
                              {item.isRented && (
                                <div className="pl-7 border-l-2 border-[#e5e5e5] mt-4"><label className="text-xs text-[#666666] mb-1 block">Доход от аренды в месяц (₽)</label><NumberInput value={item.rentIncome} onChange={(val) => updateRE(item.id, 'rentIncome', val)} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => toggleEditRE(item.id)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">Сохранить актив</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`re-${item.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} shadow-sm hover:shadow-md transition-shadow duration-300 relative group p-6 md:p-8`}>
                      <button onClick={() => removeRE(item.id)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <div>
                          <h4 className="font-tenor text-2xl mb-1 flex items-center"><Home className="w-5 h-5 mr-2 text-[#987362]" />{(item.type || "Объект") + (item.city ? " в г. " + item.city : "")}{item.isUnderConstruction && <span className="ml-3 px-2 py-0.5 bg-[#f5e6e0] text-[#987362] text-xs rounded border border-[#e5e5e5] font-montserrat">В стройке</span>}</h4>
                          <p className="text-sm text-[#666666] font-light">{"Куплено в " + item.purchaseYear + " году"}</p>
                        </div>
                        <div>{renderAuditBadge(audit)}</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Текущая стоимость</p><p className="font-medium text-xl">{formatMoney(item.currentValue)}</p></div>
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Чистый капитал</p><p className="font-medium text-xl text-[#987362]">{formatMoney(Math.max(0, equity))}</p></div>
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Срок владения</p><p className="font-medium text-xl">{yearsOwned + " " + getYearWord(yearsOwned)}</p></div>
                        
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Общий прирост</p><p className={`font-medium text-xl ${pPrice > 0 ? (totalGrowthPercent > 0 ? "text-green-600" : (totalGrowthPercent < 0 ? "text-red-600" : "")) : "text-[#a0a0a0]"}`}>{pPrice > 0 ? (totalGrowthPercent > 0 ? "+" : "") + totalGrowthPercent + "%" : "—"}</p></div>
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Рост стоимости (CAGR)</p><p className={`font-medium text-xl ${pPrice > 0 ? (cagr > 0 ? "text-green-600" : "text-red-600") : "text-[#a0a0a0]"}`}>{pPrice > 0 ? cagr.toFixed(1) + "%" : "—"} {pPrice > 0 && <span className="text-xs text-[#a0a0a0] font-light">в год</span>}</p></div>
                        
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Чистая арендная доходность</p><p className={`font-medium text-xl ${item.isUnderConstruction ? "text-[#a0a0a0]" : (roe > 0 ? "text-green-600" : "text-red-600")}`}>{item.isUnderConstruction ? "В стройке" : roe.toFixed(1) + "%"} {!item.isUnderConstruction && <span className="text-xs text-[#a0a0a0] font-light">в год</span>}</p></div>
                        <div className="col-span-2 bg-[#fafafa] p-3 border border-[#e5e5e5] rounded flex flex-col justify-center"><p className="text-xs text-[#666666] mb-1 font-light">Реальная полная доходность</p><p className={`font-medium text-2xl ${realTotalYield > 4 ? "text-green-600" : (realTotalYield < 0 ? "text-red-600" : "text-yellow-600")}`}>{realTotalYield > 0 ? "+" : ""}{realTotalYield.toFixed(1) + "%"} <span className="text-xs text-[#a0a0a0] font-light">в год</span></p></div>
                      </div>
                      {renderAuditAlert(audit, lostAlternativeIncome)}
                      <button onClick={() => toggleEditRE(item.id)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print"><Settings2 className="w-4 h-4 mr-2" /> Изменить параметры</button>
                    </div>
                  );
                }

                if (asset.assetCategory === 'deposit') {
                  const dep = asset;
                  const rate = Number(dep.rate) || 0;
                  const realYield = rate - constants.inflation;
                  const audit = getDepositAudit(realYield);
                  const lostYieldPercent = constants.alternativeYieldPercent - rate;
                  const lostAlternativeIncome = lostYieldPercent > 0 ? ((Number(dep.amount) || 0) * (lostYieldPercent / 100)) : 0;
                  const cStyles = getAlertStyles(audit.level);

                  if (dep.isEditing) {
                    return (
                      <div key={`dep-${dep.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Параметры депозита</h4>
                          <button onClick={() => removeDeposit(dep.id)} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><label className="text-xs text-[#666666] mb-1 block">Сумма на счету (₽)</label><NumberInput value={dep.amount} onChange={(val) => updateDeposit(dep.id, 'amount', val)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                          <div><label className="text-xs text-[#666666] mb-1 block">Годовая ставка (%)</label><input type="number" value={dep.rate === '' ? '' : dep.rate} onChange={(e) => updateDeposit(dep.id, 'rate', e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => toggleEditDeposit(dep.id)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">Сохранить депозит</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`dep-${dep.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative group`}>
                      <button onClick={() => removeDeposit(dep.id)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <h4 className="font-tenor text-2xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Банковский депозит</h4>
                        {renderAuditBadge(audit)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Текущий объем</p><p className="font-medium text-xl">{formatMoney(dep.amount)}</p></div>
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Доходность (ном.)</p><p className={`font-medium text-xl ${rate >= constants.inflation ? "text-green-600" : "text-red-600"}`}>{rate.toFixed(1) + "%"}</p></div>
                      </div>
                      {renderAuditAlert(audit, lostAlternativeIncome)}
                      <button onClick={() => toggleEditDeposit(dep.id)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print"><Settings2 className="w-4 h-4 mr-2" /> Изменить параметры</button>
                    </div>
                  );
                }

                if (asset.assetCategory === 'stock') {
                  const stock = asset;
                  const yieldPct = Number(stock.yield) || 0;
                  const realYield = yieldPct - constants.inflation;
                  const audit = getStockAudit(realYield);
                  const lostYieldPercent = constants.alternativeYieldPercent - yieldPct;
                  const lostAlternativeIncome = lostYieldPercent > 0 ? ((Number(stock.amount) || 0) * (lostYieldPercent / 100)) : 0;
                  const cStyles = getAlertStyles(audit.level);

                  if (stock.isEditing) {
                    return (
                      <div key={`stock-${stock.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Параметры инвестиций в акции</h4>
                          <button onClick={() => removeStock(stock.id)} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><label className="text-xs text-[#666666] mb-1 block">Оценка портфеля (₽)</label><NumberInput value={stock.amount} onChange={(val) => updateStock(stock.id, 'amount', val)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                          <div><label className="text-xs text-[#666666] mb-1 block">Средняя доходность (%)</label><input type="number" value={stock.yield === '' ? '' : stock.yield} onChange={(e) => updateStock(stock.id, 'yield', e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" /></div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => toggleEditStock(stock.id)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">Сохранить портфель</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`stock-${stock.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative group`}>
                      <button onClick={() => removeStock(stock.id)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <h4 className="font-tenor text-2xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Фондовый рынок</h4>
                        {renderAuditBadge(audit)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Текущий объем</p><p className="font-medium text-xl">{formatMoney(stock.amount)}</p></div>
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Доходность (ном.)</p><p className={`font-medium text-xl ${yieldPct >= constants.inflation ? "text-green-600" : "text-red-600"}`}>{yieldPct.toFixed(1) + "%"}</p></div>
                      </div>
                      {renderAuditAlert(audit, lostAlternativeIncome)}
                      <button onClick={() => toggleEditStock(stock.id)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print"><Settings2 className="w-4 h-4 mr-2" /> Изменить параметры</button>
                    </div>
                  );
                }

                if (asset.assetCategory === 'cash') {
                  const share = auditResults.totalPotentialCapital > 0 ? (Number(asset.amount) / auditResults.totalPotentialCapital) * 100 : 0;
                  const audit = getCashAudit(share);
                  const lostAlternativeIncome = (Number(asset.amount) || 0) * (constants.alternativeYieldPercent / 100);
                  const cStyles = getAlertStyles(audit.level);

                  if (asset.isEditing) {
                    return (
                      <div key={`cash-${asset.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Настройка наличных</h4>
                          <button onClick={() => { setCash(null); setIsEditingCash(false); }} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div>
                          <label className="text-xs text-[#666666] mb-1 block">Наличные (₽)</label>
                          <NumberInput value={asset.amount} onChange={(val) => setCash(val)} className="w-full md:w-1/2 p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => setIsEditingCash(false)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">Сохранить актив</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`cash-${asset.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative group`}>
                      <button onClick={() => setCash(null)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив"><Trash2 className="w-5 h-5" /></button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <h4 className="font-tenor text-2xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Наличные средства</h4>
                        {renderAuditBadge(audit)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Текущий объем</p><p className="font-medium text-xl">{formatMoney(asset.amount)}</p></div>
                        <div><p className="text-xs text-[#666666] mb-1 font-light">Доля в портфеле</p><p className="font-medium text-xl">{share.toFixed(1)}%</p></div>
                      </div>
                      {renderAuditAlert(audit, lostAlternativeIncome)}
                      <button onClick={() => setIsEditingCash(true)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print"><Settings2 className="w-4 h-4 mr-2" /> Изменить сумму</button>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="bg-[#987362] p-8 md:p-10 shadow-sm relative overflow-hidden mt-10">
              <Scale className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5 pointer-events-none" />
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <p className="text-sm text-white/80 mb-2 font-light">Ваш капитал сегодня</p>
                    <p className="text-4xl md:text-5xl font-tenor tracking-tight text-white">{formatMoney(auditResults.totalPotentialCapital)}</p>
                    <p className="text-xs text-white/70 mt-3 font-light leading-relaxed">Это сумма, которую вы получите при продаже всех активов с учетом:<br/>– налога 13% (если срок владения менее 5 лет)<br/>– комиссии при продаже (в среднем 3.5%)<br/>– погашения остатка по ипотеке</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/80 mb-2 font-light">Капитал, который можно усилить</p>
                    <p className="text-4xl md:text-5xl font-tenor tracking-tight text-[#f5e6e0]">{formatMoney(auditResults.inefficientCapital)}</p>
                    <p className="text-xs text-white/70 mt-3 font-light leading-relaxed">Часть средств, которые сейчас работают ниже целевой доходности 13% и могут быть направлены в более эффективные инструменты.</p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                       <p className="text-xs text-white/80 mb-1 font-light">Потенциал роста за 15 лет</p>
                       <p className="text-xl font-medium text-white">{formatMoney(auditResults.inefficientFutureReal)}</p>
                       <p className="text-xs text-white/60 mt-1 font-light">Если направить этот капитал в стратегию реинвестирования недвижимости (Сценарий Б)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8 pt-8">
            <div className="space-y-4 border-b border-[#e5e5e5] pb-4">
              <div className="flex items-center space-x-3">
                <Calculator className="w-6 h-6 text-[#987362]" />
                <h2 className="text-2xl font-tenor tracking-tight">Шаг 2. Проектирование финансовой точки Б</h2>
              </div>
              <p className="text-[#666666] font-light leading-relaxed text-sm max-w-4xl">Определите сумму для реинвестирования: вы можете задействовать весь капитал или переложить только неэффективные активы. Укажите комфортный ежемесячный платеж, тип ипотеки и желаемую сумму пассивного дохода, чтобы алгоритм построил пошаговый план на 15 лет</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8 bg-white p-6 md:p-8 border border-[#e5e5e5] no-print">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666]">Стартовый капитал (₽)</label>
                    <NumberInput value={startCapital} onChange={(val) => setStartCapital(val)} className="w-full text-xl font-medium p-3 bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                    <p className="text-xs text-[#a0a0a0]">Извлеченный собственный капитал</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e5e5] gap-4">
                    <span className="text-sm font-medium leading-snug">Рассчитать платеж автоматически</span>
                    <button onClick={() => setIsAutoPayment(!isAutoPayment)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center transition-colors border ${isAutoPayment ? "bg-[#987362] border-[#987362]" : "bg-[#e5e5e5] border-[#e5e5e5]"}`}><span className={`inline-block h-4 w-4 transform bg-white transition-transform ${isAutoPayment ? "translate-x-6" : "translate-x-1"}`}></span></button>
                  </div>

                  {!isAutoPayment && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#666666]">Комфортный платеж в месяц (₽)</label>
                      <NumberInput value={monthlyPaymentLimit} onChange={(val) => setMonthlyPaymentLimit(val)} className="w-full text-xl font-medium p-3 bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" placeholder="150 000" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666] block mb-2">Право на семейную ипотеку (6%)</label>
                    <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e5e5] gap-4">
                      <span className="text-sm font-medium leading-snug">Семейная ипотека</span>
                      <button onClick={() => setIsFamilyMortgage(!isFamilyMortgage)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center transition-colors border ${isFamilyMortgage ? "bg-[#987362] border-[#987362]" : "bg-[#e5e5e5] border-[#e5e5e5]"}`}><span className={`inline-block h-4 w-4 transform bg-white transition-transform ${isFamilyMortgage ? "translate-x-6" : "translate-x-1"}`}></span></button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-6 border-t border-[#e5e5e5]">
                    <label className="text-sm font-medium text-[#666666]">Желаемый пассивный доход в месяц (₽)</label>
                    <NumberInput value={desiredPassiveIncome} onChange={(val) => setDesiredPassiveIncome(val)} className="w-full text-xl font-medium p-3 bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" placeholder="300 000" />
                    <p className="text-xs text-[#a0a0a0]">Цель через 15 лет</p>
                  </div>
                </div>

                {firstCycleUnusedCapital > 0 && !isAutoPayment && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 mb-1">Часть капитала лежит без дела</p>
                      <p className="text-xs text-orange-800 leading-relaxed">
                        Из-за ограничения по ежемесячному платежу {formatMoney(firstCycleUnusedCapital)} не пошли в дело и просто сгорают от инфляции. Попробуйте включить авторасчет (потребуется платеж ~{formatMoney(optimalFullPayment)}/мес), чтобы вложить все 100% денег под 20% взноса. Вы увидите, как график улетит в космос!
                      </p>
                    </div>
                  </div>
                )}

                {isFamilyMortgage && firstCyclePropertiesCount > 1 && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900 mb-1">Умная разбивка капитала</p>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Так как у вас есть право на семейную ипотеку, алгоритм купил 2 квартиры: первую по льготной ставке (исчерпав лимит кредита 12 млн), а на остаток средств — вторую по стандартной ставке.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <ChartSection
                calculationResults={calculationResults} targetCapital={targetCapital} formatMoney={formatMoney}
                chartData={chartData} currentProgress={currentProgress} activeProgress={activeProgress} lostProfit={lostProfit}
              />
            </div>

            {/* === НОВЫЙ БЛОК КОНТАКТОВ, КОТОРЫЙ ПОЯВИТСЯ ТОЛЬКО В PDF === */}
            <div id="pdf-contacts" className="hidden mt-20 pt-10 border-t-2 border-[#987362] text-[#222222]">
              <h3 className="font-tenor text-3xl mb-8">Агентство недвижимости «Надо брать»</h3>
              <div className="space-y-4 text-base font-light">
                <p><span className="font-medium">Сайт:</span> soboleva-nedvizhmost.ru</p>
                <p><span className="font-medium">Телефон:</span> +7 (991) 775-20-76</p>
                <p><span className="font-medium">Телеграм-канал:</span> @mne_vse_nado</p>
                <p><span className="font-medium">Instagram:</span> @soboleva_vik</p>
              </div>
            </div>

            {/* УМНАЯ ДВУХШАГОВАЯ КНОПКА СКАЧИВАНИЯ */}
            <div className="mt-10 pt-10 border-t border-[#e5e5e5] flex justify-center no-print">
              {pdfReadyObj ? (
                <button 
                  onClick={handleSavePDF} 
                  className="bg-[#28a745] hover:bg-[#218838] text-white px-8 py-4 text-sm font-medium transition-all flex items-center space-x-2 shadow-lg shadow-green-500/30"
                >
                  <Download className="w-5 h-5" />
                  <span>Документ готов! Сохранить</span>
                </button>
              ) : (
                <button 
                  onClick={handlePreparePDF} 
                  disabled={isDownloading}
                  className="bg-white hover:bg-[#fafafa] text-[#222222] border border-[#e5e5e5] hover:border-[#987362] px-8 py-4 text-sm font-medium transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-[#987362]" />
                  <span>{isDownloading ? 'Формирование отчета...' : 'Скачать расчет в PDF'}</span>
                </button>
              )}
            </div>
          </section>

        </div>
        {/* === КОНЕЦ БЛОКА ДЛЯ PDF === */}
        
        <div className="bg-[#1c1c1c] p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full max-w-6xl mx-auto mt-16 no-print">
          <div className="space-y-2">
            <p className="text-xl md:text-3xl font-tenor text-white tracking-tight leading-snug">Калькулятор показывает потенциал</p>
            <p className="text-[#a0a0a0] text-sm md:text-xl font-light">Консультация превращает его в стратегию</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto justify-center bg-[#987362] hover:bg-[#826152] text-white px-6 py-4 text-sm md:text-base font-medium transition-colors flex items-center space-x-2"><span className="text-center">Записаться на разбор</span><ArrowRight className="w-5 h-5 flex-shrink-0" /></button>
        </div>

        <div className="max-w-6xl mx-auto no-print">
          <Showcase formatMoney={formatMoney} />
        </div>

        <footer className="pt-16 pb-8 border-t border-[#e5e5e5] mt-16 text-center md:text-left max-w-6xl mx-auto no-print">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[#666666]">
             <div className="space-y-2 flex flex-col items-center md:items-start">
               <p className="font-medium text-[#222222]">ИП Соболева Виктория Викторовна</p>
               <p className="text-xs">ОГРНИП: 321508100582522</p>
             </div>
             <div className="space-y-2">
                <p className="font-medium text-[#222222]">Документы</p>
                <a href="https://soboleva-nedvizhmost.ru/policy" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[#987362] transition-colors block mb-1">Политика конфиденциальности</a>
                <a href="https://soboleva-nedvizhmost.ru/person" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[#987362] transition-colors block mb-1">Обработка персональных данных</a>
                <a href="https://soboleva-nedvizhmost.ru/reklama" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[#987362] transition-colors block">Согласие на получение рекламы</a>
             </div>
             <div className="space-y-2">
                <p className="font-medium text-[#222222]">Контакты</p>
                <div className="flex justify-center md:justify-start space-x-4">
                   <a href="https://t.me/Soboleva_estate_bot" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[#987362] transition-colors">Telegram</a>
                   <a href="https://www.instagram.com/soboleva_vik" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[#987362] transition-colors">Instagram</a>
                </div>
             </div>
          </div>
        </footer>

      </div>
      
      <LeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        auditData={{ 
          startCapital: auditResults.totalPotentialCapital, 
          inefficientCapital: auditResults.inefficientCapital, 
          desiredIncome: desiredPassiveIncome, 
          progressA: currentProgress, 
          progressB: activeProgress, 
          lostProfit: lostProfit 
        }} 
        rawAssets={{ realEstate, deposits, stocks, cash }}
        rawSettings={{ isAutoPayment, monthlyPaymentLimit, isFamilyMortgage }}
      />
    </div>
  );
}