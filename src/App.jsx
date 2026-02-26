import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, ArrowRight, Plus, Trash2, Home, Wallet, 
  AlertCircle, CheckCircle2, Settings2, Scale, ExternalLink, Download 
} from 'lucide-react';

import { CURRENT_YEAR, constants } from './config/data';
import { 
  getYearWord, getRemainingBalance, getRealEstateAudit, 
  getStockAudit, getDepositAudit, getCashAudit, getAlertStyles 
} from './utils/helpers';
import { Showcase } from './components/Showcase';
import { ChartSection } from './components/ChartSection';
import { LeadModal } from './components/LeadModal';

const formatNumInput = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export default function App() {
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [realEstate, setRealEstate] = useState([
    {
      id: 1,
      type: 'Квартира',
      city: 'Москва',
      purchaseYear: 2021,
      purchasePrice: 4199998,
      currentValue: 5800000,
      hasMortgage: true,
      initialPayment: 420000,
      loanBalance: 3500000,
      mortgagePayment: 32000,
      mortgageRate: 10,
      isUnderConstruction: false,
      isRented: true,
      rentIncome: 30000,
      isEditing: false
    },
    {
      id: 2,
      type: 'Двушка',
      city: 'Краснодар',
      purchaseYear: 2022,
      purchasePrice: 5500000,
      currentValue: 6800000,
      hasMortgage: true,
      initialPayment: 550000,
      loanBalance: 4800000,
      mortgagePayment: 38000,
      mortgageRate: 10,
      isUnderConstruction: false,
      isRented: false,
      rentIncome: 0,
      isEditing: false
    }
  ]);

  const [deposits, setDeposits] = useState([{ id: 1, amount: 1500000, rate: 14, isEditing: false }]);
  const [cash, setCash] = useState(500000);
  const [cashId, setCashId] = useState(3);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [stocks, setStocks] = useState([{ id: 1, amount: 800000, yield: 12, isEditing: false }]);

  const [startCapital, setStartCapital] = useState('');
  const [isAutoPayment, setIsAutoPayment] = useState(false);
  const [monthlyPaymentLimit, setMonthlyPaymentLimit] = useState(100000);
  const [isFamilyMortgage, setIsFamilyMortgage] = useState(false);
  const [desiredPassiveIncome, setDesiredPassiveIncome] = useState(200000);

  const auditResults = useMemo(() => {
    let totalPotentialCapital = 0;
    let inefficientCapital = 0;
    let totalCurrentRealIncome = 0;
    let totalLostIncome = 0;
    
    const reData = [];

    realEstate.forEach(item => {
      const yearsOwned = Math.max(1, CURRENT_YEAR - item.purchaseYear);
      const commission = item.currentValue * constants.commissionPercent;
      let tax = 0;
      if (yearsOwned < constants.taxFreeYears && item.currentValue > item.purchasePrice) {
        tax = (item.currentValue - item.purchasePrice) * constants.taxRate;
      }
      const activeLoanBalance = item.hasMortgage ? (item.loanBalance || 0) : 0;
      const equity = Math.max(0, item.currentValue - activeLoanBalance - commission - tax);
      
      totalPotentialCapital += equity;
      reData.push({ item, yearsOwned, equity });
    });

    deposits.forEach(item => { totalPotentialCapital += item.amount; });
    stocks.forEach(item => { totalPotentialCapital += item.amount; });
    const cashNum = Number(cash) || 0;
    totalPotentialCapital += cashNum;

    reData.forEach(({ item, yearsOwned, equity }) => {
      const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? (item.rentIncome || 0) : 0) - (item.hasMortgage ? (item.mortgagePayment || 0) : 0);
      const roe = equity > 0 ? ((netMonthlyRent * 12) / equity) * 100 : 0;
      
      let cagr = 0;
      if (item.purchasePrice > 0 && item.currentValue > 0) {
        cagr = (Math.pow(item.currentValue / item.purchasePrice, 1 / yearsOwned) - 1) * 100;
      }
      
      const totalNominalYield = cagr + roe;
      const realTotalYield = totalNominalYield - constants.inflation;
      const audit = getRealEstateAudit(yearsOwned, cagr, realTotalYield, roe, item.isUnderConstruction, item.isRented);

      if (audit.level === 'red' || audit.level === 'orange') {
        inefficientCapital += equity;
      }
      
      totalCurrentRealIncome += equity * (realTotalYield / 100);
      const lostYield = constants.alternativeYieldPercent - totalNominalYield;
      if (lostYield > 0) totalLostIncome += equity * (lostYield / 100);
    });

    deposits.forEach(item => {
      const realYield = item.rate - constants.inflation;
      const audit = getDepositAudit(realYield);
      
      if (audit.level === 'red' || audit.level === 'orange' || realYield < 0) {
        inefficientCapital += item.amount;
      }
      
      totalCurrentRealIncome += item.amount * (realYield / 100);
      const lostYield = constants.alternativeYieldPercent - item.rate;
      if (lostYield > 0) totalLostIncome += item.amount * (lostYield / 100);
    });

    stocks.forEach(item => {
      const realYield = item.yield - constants.inflation;
      const audit = getStockAudit(realYield);
      
      if (audit.level === 'red' || audit.level === 'orange') {
        inefficientCapital += item.amount;
      }
      
      totalCurrentRealIncome += item.amount * (realYield / 100);
      const lostYield = constants.alternativeYieldPercent - item.yield;
      if (lostYield > 0) totalLostIncome += item.amount * (lostYield / 100);
    });

    if (cashNum > 0) {
      const share = totalPotentialCapital > 0 ? (cashNum / totalPotentialCapital) * 100 : 0;
      
      if (share > 20) {
         const safeCashLimit = totalPotentialCapital * 0.20;
         inefficientCapital += (cashNum - safeCashLimit);
      }
      
      const realYield = -constants.inflation;
      totalCurrentRealIncome += cashNum * (realYield / 100);
      const lostYield = constants.alternativeYieldPercent - 0; 
      totalLostIncome += cashNum * (lostYield / 100);
    }

    const averageRealYield = totalPotentialCapital > 0 ? (totalCurrentRealIncome / totalPotentialCapital) * 100 : 0;
    const potentialIncome10 = totalPotentialCapital * (constants.alternativeYieldPercent / 100);
    
    const strategyMultiplier = 15; 
    const inefficientFutureReal = inefficientCapital * strategyMultiplier;

    return { 
      totalPotentialCapital,
      inefficientCapital,
      averageRealYield,
      potentialIncome10,
      inefficientFutureReal,
      totalLostIncome
    };
  }, [realEstate, deposits, stocks, cash]);

  useEffect(() => {
    setStartCapital(Math.round(auditResults.totalPotentialCapital).toString());
  }, [auditResults.totalPotentialCapital]);

  const targetCapital = useMemo(() => {
    const income = Number(desiredPassiveIncome) || 0;
    return (income * 12) / constants.conservativeYield;
  }, [desiredPassiveIncome]);

  const calculationResults = useMemo(() => {
    const numStartCapital = Number(startCapital);
    const numPaymentLimit = Number(monthlyPaymentLimit);
    const safeStartCapital = numStartCapital > 0 ? numStartCapital : 1;
    const safePaymentLimit = numPaymentLimit >= 0 ? numPaymentLimit : 0;
    
    let currentCapital = safeStartCapital;
    const yearlyData = [{
      year: 0,
      nominalCapital: safeStartCapital,
      realCapital: safeStartCapital,
      propertyValue: 0,
      loanBalance: 0
    }];
    
    const milestones = [];

    for (let cycle = 0; cycle < constants.cyclesCount; cycle++) {
      const currentMortgageTermYears = 30 - (cycle * 5);
      const totalMonths = currentMortgageTermYears * 12;
      
      let cycleProperties = [];
      let cycleUnusedCapital = 0;

      if (cycle === 0) {
        let remainingCapital = currentCapital;
        let remainingPaymentLimit = isAutoPayment ? Infinity : safePaymentLimit;

        // Попытка 1: Семейная ипотека (строго 20% ПВ)
        if (isFamilyMortgage && remainingCapital > 0 && remainingPaymentLimit > 0) {
          const familyRateDecimal = (constants.rateFamily / 100) / 12;
          const annuityFamily = (familyRateDecimal * Math.pow(1 + familyRateDecimal, totalMonths)) / (Math.pow(1 + familyRateDecimal, totalMonths) - 1);

          const maxLoanByPayment = remainingPaymentLimit / annuityFamily;
          const maxLoanByProgram = 12000000;
          const approvedLoan = Math.min(maxLoanByPayment, maxLoanByProgram);

          const maxPriceByLoan = approvedLoan / (1 - constants.downPaymentPercent);
          const maxPriceByCapital = remainingCapital / constants.downPaymentPercent;

          const familyPrice = Math.min(maxPriceByLoan, maxPriceByCapital);

          if (familyPrice > 0) {
            const familyDP = familyPrice * constants.downPaymentPercent;
            const familyLoan = familyPrice - familyDP;
            const familyPayment = familyLoan * annuityFamily;

            cycleProperties.push({
              price: familyPrice, loan: familyLoan, rate: familyRateDecimal, payment: familyPayment
            });

            remainingCapital -= familyDP;
            remainingPaymentLimit -= familyPayment;
          }
        }

        // Попытка 2: Докупка на остатки по стандартной ставке (строго 20% ПВ)
        if (remainingCapital > 0 && remainingPaymentLimit > 0) {
          const standardRateDecimal = (constants.rateStandardFirst / 100) / 12;
          const annuityStandard = (standardRateDecimal * Math.pow(1 + standardRateDecimal, totalMonths)) / (Math.pow(1 + standardRateDecimal, totalMonths) - 1);

          const maxLoanByPayment = remainingPaymentLimit / annuityStandard;
          const maxPriceByLoan = maxLoanByPayment / (1 - constants.downPaymentPercent);
          const maxPriceByCapital = remainingCapital / constants.downPaymentPercent;

          const standardPrice = Math.min(maxPriceByLoan, maxPriceByCapital);

          if (standardPrice > 0) {
            const standardDP = standardPrice * constants.downPaymentPercent;
            const standardLoan = standardPrice - standardDP;
            const standardPayment = standardLoan * annuityStandard;

            cycleProperties.push({
              price: standardPrice, loan: standardLoan, rate: standardRateDecimal, payment: standardPayment
            });

            remainingCapital -= standardDP;
          }
        }
        
        cycleUnusedCapital = Math.max(0, remainingCapital);

      } else {
        // ЦИКЛЫ 2 И 3: АВТОМАТИЧЕСКОЕ РЕИНВЕСТИРОВАНИЕ
        // Если в первом цикле клиент был согласен на платежи (кредит),
        // весь капитал автоматически становится 20% взносом для новых больших объектов.
        if (isAutoPayment || safePaymentLimit > 0) {
          const nextRateDecimal = (constants.rateNextCycles / 100) / 12;
          const annuityNext = (nextRateDecimal * Math.pow(1 + nextRateDecimal, totalMonths)) / (Math.pow(1 + nextRateDecimal, totalMonths) - 1);

          const price = currentCapital / constants.downPaymentPercent;
          const dp = currentCapital;
          const loan = price - dp;
          const payment = loan * annuityNext;

          cycleProperties.push({
            price: price, loan: loan, rate: nextRateDecimal, payment: payment
          });
          cycleUnusedCapital = 0;
        } else {
          // Если платеж 0, клиент не берет ипотеку. Деньги просто лежат.
          cycleUnusedCapital = currentCapital;
        }
      }

      let cycleMonthlyPayment = cycleProperties.reduce((sum, p) => sum + p.payment, 0);

      for (let year = 1; year <= constants.cycleYears; year++) {
        const globalYear = cycle * constants.cycleYears + year;
        const monthsPassed = year * 12;

        let totalPropertyValue = 0;
        let totalLoanBalance = 0;
        let totalCommission = 0;
        let initialTotalPropertyValue = 0;

        cycleProperties.forEach(prop => {
          const currentPropertyValue = prop.price * Math.pow(1 + constants.marketGrowth / 100, year);
          const remainingLoan = prop.loan * (Math.pow(1 + prop.rate, totalMonths) - Math.pow(1 + prop.rate, monthsPassed)) / (Math.pow(1 + prop.rate, totalMonths) - 1);
          const commissionAmount = currentPropertyValue * constants.commissionPercent;

          totalPropertyValue += currentPropertyValue;
          totalLoanBalance += remainingLoan;
          totalCommission += commissionAmount;
          initialTotalPropertyValue += prop.price;
        });
        
        // К неиспользованному капиталу не прибавляется рост недвижимости
        let netCapital = totalPropertyValue - totalCommission - totalLoanBalance + cycleUnusedCapital;
        let realCapital = netCapital / Math.pow(1 + constants.inflation / 100, globalYear);

        yearlyData.push({
          year: globalYear,
          nominalCapital: Math.round(netCapital),
          realCapital: Math.round(realCapital),
          propertyValue: Math.round(totalPropertyValue),
          loanBalance: Math.round(totalLoanBalance)
        });

        if (year === constants.cycleYears) {
          currentCapital = netCapital;
          milestones.push({
            year: globalYear,
            initialPropertyValue: Math.round(initialTotalPropertyValue),
            propertyValue: Math.round(totalPropertyValue),
            loanBalance: Math.round(totalLoanBalance),
            commission: Math.round(totalCommission),
            netCapital: Math.round(netCapital),
            realCapital: Math.round(realCapital),
            monthlyPayment: Math.round(cycleMonthlyPayment)
          });
        }
      }
    }

    const finalNominal = yearlyData[yearlyData.length - 1].nominalCapital;
    const finalReal = yearlyData[yearlyData.length - 1].realCapital;
    const growthMultiplier = (finalReal / safeStartCapital).toFixed(1);
    const cagr = ((Math.pow(finalReal / safeStartCapital, 1 / (constants.cyclesCount * constants.cycleYears)) - 1) * 100).toFixed(1);

    return { yearlyData, milestones, finalNominal, finalReal, growthMultiplier, cagr };
  }, [startCapital, isAutoPayment, monthlyPaymentLimit, isFamilyMortgage]);

  const currentStrategyFinalReal = useMemo(() => {
    let nominal = 0;

    realEstate.forEach(item => {
      const futureValue = item.currentValue * Math.pow(1 + constants.basePropertyGrowth, 15);
      const remainingDebt = item.hasMortgage ? getRemainingBalance(item.loanBalance, item.mortgageRate || 0, item.mortgagePayment || 0, 15 * 12) : 0;
      const futureCommission = futureValue * constants.commissionPercent;
      const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? (item.rentIncome || 0) : 0) - (item.hasMortgage ? (item.mortgagePayment || 0) : 0);
      const accumulatedRent = netMonthlyRent * 12 * 15;
      nominal += futureValue - remainingDebt - futureCommission + accumulatedRent;
    });

    deposits.forEach(item => {
      nominal += item.amount * Math.pow(1 + item.rate / 100, 15);
    });

    stocks.forEach(item => {
      nominal += item.amount * Math.pow(1 + item.yield / 100, 15);
    });

    nominal += Number(cash) || 0;
    const real = nominal / Math.pow(1 + constants.inflation / 100, 15);
    return real > 0 ? real : 0;
  }, [realEstate, deposits, stocks, cash]);

  const chartData = useMemo(() => {
    return calculationResults.yearlyData.map(point => {
      const year = point.year;
      let nominal = 0;

      realEstate.forEach(item => {
        const futureValue = item.currentValue * Math.pow(1 + constants.basePropertyGrowth, year);
        const remainingDebt = item.hasMortgage ? getRemainingBalance(item.loanBalance, item.mortgageRate || 0, item.mortgagePayment || 0, year * 12) : 0;
        const futureCommission = futureValue * constants.commissionPercent;
        const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? (item.rentIncome || 0) : 0) - (item.hasMortgage ? (item.mortgagePayment || 0) : 0);
        const accumulatedRent = netMonthlyRent * 12 * year;
        nominal += futureValue - remainingDebt - futureCommission + accumulatedRent;
      });

      deposits.forEach(item => {
        nominal += item.amount * Math.pow(1 + item.rate / 100, year);
      });

      stocks.forEach(item => {
        nominal += item.amount * Math.pow(1 + item.yield / 100, year);
      });

      nominal += Number(cash) || 0;
      const real = nominal / Math.pow(1 + constants.inflation / 100, year);

      return {
        ...point,
        realCapitalA: Math.round(real > 0 ? real : 0)
      };
    });
  }, [calculationResults.yearlyData, realEstate, deposits, stocks, cash]);

  const currentProgress = Math.min(100, (currentStrategyFinalReal / targetCapital) * 100).toFixed(1);
  const activeProgress = Math.min(100, (calculationResults.finalReal / targetCapital) * 100).toFixed(1);
  const lostProfit = Math.max(0, calculationResults.finalReal - currentStrategyFinalReal);

  const formatMoney = (val) => {
    if (isNaN(val) || val === null) return "0 ₽";
    return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(val) + " ₽";
  };

  const addRE = () => {
    setRealEstate(prev => [{
      id: Date.now(), type: '', city: '', purchaseYear: CURRENT_YEAR, purchasePrice: 0, currentValue: 0,
      hasMortgage: false, initialPayment: 0, loanBalance: 0, mortgagePayment: 0, mortgageRate: 0,
      isUnderConstruction: false, isRented: false, rentIncome: 0, isEditing: true
    }, ...prev]);
  };

  const addDeposit = () => setDeposits(prev => [{ id: Date.now(), amount: 0, rate: 0, isEditing: true }, ...prev]);
  const addStock = () => setStocks(prev => [{ id: Date.now(), amount: 0, yield: 0, isEditing: true }, ...prev]);
  const addCash = () => { setCash(0); setIsEditingCash(true); setCashId(Date.now()); };

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
            <p className={`text-sm font-medium mb-1 ${styles.text}`}>
              Статус: {audit.status}
            </p>
            <p className={`text-xs leading-relaxed ${styles.desc}`}>
              {audit.comment}
            </p>
            {lostAlternativeIncome > 0 && (
              <div className={`mt-3 pt-3 flex items-center justify-between border-t ${styles.border}`}>
                <span className={`text-xs font-medium ${styles.text}`}>
                  Потерянная альтернативная доходность
                </span>
                <span className="text-sm font-bold text-red-600">
                  -{formatMoney(lostAlternativeIncome)} / год
                </span>
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Tenor+Sans&display=swap'); 
        .font-tenor { font-family: 'Tenor Sans', sans-serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        
        @keyframes urgentPulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          50% { box-shadow: 0 0 12px 6px rgba(220, 38, 38, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .animate-urgent-pulse {
          animation: urgentPulse 1.5s infinite;
        }

        @media print {
          @page { margin: 1.5cm; size: A4 portrait; }
          body, .min-h-screen { 
            background-color: #fff !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
          .print-break-inside-avoid { 
            page-break-inside: avoid; 
            break-inside: avoid; 
          }
        }
      `}</style>

      <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between items-center py-2 text-[#a0a0a0] text-[10px] z-50 bg-white border-t border-[#e5e5e5]">
        <span>Диагностика активов и план роста капитала</span>
        <span className="font-tenor text-sm text-[#222222]">Надо брать</span>
      </div>

      <div className="min-h-screen bg-[#fafafa] text-[#222222] font-montserrat p-4 md:p-10 pb-20 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-16">
          <header className="text-center space-y-4 pt-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-tenor tracking-tight">Инвестиционный калькулятор</h1>
            <p className="text-lg text-[#666666] font-light max-w-2xl mx-auto px-4">
              Диагностика ваших активов и план максимизации роста капитала
            </p>
          </header>

          <div className="max-w-4xl mx-auto bg-white border border-[#e5e5e5] p-6 md:p-8 text-sm text-[#666666] font-light leading-relaxed">
            <p className="font-medium text-[#222222] mb-4 text-base">Этот калькулятор показывает базовую модель масштабирования капитала через недвижимость</p>
            <p className="mb-4">Стратегия основана на четырёх ключевых принципах:</p>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
                <p>рост стоимости ликвидных объектов, особенно при входе в проекты на старте продаж</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
                <p>использование кредитного плеча – покупка с ипотекой при первоначальном взносе от 20%</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
                <p>продажа объекта на пике роста цены, как правило через 4–5 лет владения</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-[#987362] mr-3 flex-shrink-0 mt-0.5" />
                <p>эффект сложного процента за счёт последовательного реинвестирования капитала</p>
              </div>
            </div>
          </div>

          <section className="space-y-8">
            <div className="bg-white p-6 md:p-8 border border-[#e5e5e5] space-y-4">
              <h2 className="text-2xl font-tenor tracking-tight">1 шаг. Оценка финансовой точки А</h2>
              <p className="text-[#666666] font-light leading-relaxed text-sm">
                Введите свои активы, чтобы оценить их доходность и потенциал, а также выявить средства, которые стоит перераспределить для максимального роста капитала
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#e5e5e5] no-print">
                <button onClick={addRE} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> Недвижимость
                </button>
                <button onClick={addDeposit} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> Депозит
                </button>
                <button onClick={addStock} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> Акции
                </button>
                {cash === null && (
                  <button onClick={addCash} className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#222222] px-4 py-2 text-sm font-medium transition-colors flex items-center">
                    <Plus className="w-4 h-4 mr-1.5" /> Наличные
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {combinedAssets.length === 0 && (
                <p className="text-sm text-[#666666] font-light p-6 bg-white border border-[#e5e5e5] text-center">Вы пока не добавили ни одного актива</p>
              )}

              {combinedAssets.map(asset => {
                if (asset.assetCategory === 'realEstate') {
                  const item = asset;
                  const yearsOwned = Math.max(1, CURRENT_YEAR - item.purchaseYear);
                  const commission = item.currentValue * constants.commissionPercent;
                  let tax = 0;
                  if (yearsOwned < constants.taxFreeYears && item.currentValue > item.purchasePrice) {
                    tax = (item.currentValue - item.purchasePrice) * constants.taxRate;
                  }

                  const activeLoanBalance = item.hasMortgage ? (item.loanBalance || 0) : 0;
                  const equity = item.currentValue - activeLoanBalance - commission - tax;
                  const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? (item.rentIncome || 0) : 0) - (item.hasMortgage ? (item.mortgagePayment || 0) : 0);
                  const roe = equity > 0 ? ((netMonthlyRent * 12) / equity) * 100 : 0;
                  
                  let cagr = 0;
                  if (item.purchasePrice > 0 && item.currentValue > 0) {
                    cagr = (Math.pow(item.currentValue / item.purchasePrice, 1 / yearsOwned) - 1) * 100;
                  }
                  const totalGrowthPercent = item.purchasePrice > 0 ? (((item.currentValue - item.purchasePrice) / item.purchasePrice) * 100).toFixed(1) : 0;
                  
                  const totalNominalYield = cagr + roe;
                  const realTotalYield = totalNominalYield - constants.inflation;
                  const audit = getRealEstateAudit(yearsOwned, cagr, realTotalYield, roe, item.isUnderConstruction, item.isRented);
                  
                  const lostYieldPercent = constants.alternativeYieldPercent - totalNominalYield;
                  const lostAlternativeIncome = lostYieldPercent > 0 ? (Math.max(0, equity) * (lostYieldPercent / 100)) : 0;
                  const cStyles = getAlertStyles(audit.level);

                  if (item.isEditing) {
                    return (
                      <div key={`re-${item.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print print-break-inside-avoid">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Home className="w-5 h-5 mr-2 text-[#987362]" /> Параметры недвижимости</h4>
                          <button onClick={() => removeRE(item.id)} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Тип объекта</label>
                            <input 
                              type="text" 
                              value={item.type} 
                              onChange={(e) => updateRE(item.id, 'type', e.target.value)} 
                              className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors placeholder:text-gray-300 focus:placeholder-transparent" 
                              placeholder="Двушка в ЖК Familia или комната в коммуналке" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Город (необязательно)</label>
                            <input type="text" value={item.city} onChange={(e) => updateRE(item.id, 'city', e.target.value)} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" placeholder="Москва" />
                            <p className="text-[10px] text-[#a0a0a0] mt-1 leading-tight">Заполните для себя, чтобы удобнее ориентироваться в активах, или для более точного подбора стратегии на будущей консультации с брокером</p>
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Год покупки</label>
                            <input type="number" value={item.purchaseYear} onChange={(e) => updateRE(item.id, 'purchaseYear', Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Текущая рыночная цена (₽)</label>
                            <input type="text" inputMode="numeric" value={formatNumInput(item.currentValue || '')} onChange={(e) => updateRE(item.id, 'currentValue', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                            <button className="text-[10px] text-[#987362] hover:underline mt-1 flex items-center"><ExternalLink className="w-3 h-3 mr-1" /> Запросить точную оценку</button>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-[#666666] mb-1 block">Цена покупки (полная стоимость по ДДУ, ₽)</label>
                            <input type="text" inputMode="numeric" value={formatNumInput(item.purchasePrice || '')} onChange={(e) => updateRE(item.id, 'purchasePrice', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                          
                          <div className="sm:col-span-2 space-y-4 bg-white p-4 border border-[#e5e5e5]">
                            <div className="flex items-center space-x-3 text-sm">
                              <input 
                                type="checkbox" 
                                id={`construction-${item.id}`}
                                checked={item.isUnderConstruction || false} 
                                onChange={(e) => {
                                  updateRE(item.id, 'isUnderConstruction', e.target.checked);
                                  if (e.target.checked) {
                                    updateRE(item.id, 'isRented', false);
                                    updateRE(item.id, 'rentIncome', 0);
                                  }
                                }} 
                                className="w-4 h-4 accent-[#987362] cursor-pointer" 
                              />
                              <label htmlFor={`construction-${item.id}`} className="font-medium cursor-pointer select-none">Объект находится в стройке</label>
                            </div>
                          </div>

                          <div className="sm:col-span-2 space-y-4 bg-white p-4 border border-[#e5e5e5]">
                            <div className="flex items-center space-x-3 text-sm">
                              <input 
                                type="checkbox" 
                                id={`mortgage-${item.id}`}
                                checked={item.hasMortgage} 
                                onChange={(e) => updateRE(item.id, 'hasMortgage', e.target.checked)} 
                                className="w-4 h-4 accent-[#987362] cursor-pointer" 
                              />
                              <label htmlFor={`mortgage-${item.id}`} className="font-medium cursor-pointer select-none">Объект в ипотеке</label>
                            </div>
                            {item.hasMortgage && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-7 border-l-2 border-[#e5e5e5] mt-4">
                                <div>
                                  <label className="text-xs text-[#666666] mb-1 block">Первый взнос (₽)</label>
                                  <input type="text" inputMode="numeric" value={formatNumInput(item.initialPayment || '')} onChange={(e) => updateRE(item.id, 'initialPayment', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                                </div>
                                <div>
                                  <label className="text-xs text-[#666666] mb-1 block">Остаток долга (₽)</label>
                                  <input type="text" inputMode="numeric" value={formatNumInput(item.loanBalance || '')} onChange={(e) => updateRE(item.id, 'loanBalance', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                                </div>
                                <div>
                                  <label className="text-xs text-[#666666] mb-1 block">Платеж в месяц (₽)</label>
                                  <input type="text" inputMode="numeric" value={formatNumInput(item.mortgagePayment || '')} onChange={(e) => updateRE(item.id, 'mortgagePayment', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                                </div>
                                <div>
                                  <label className="text-xs text-[#666666] mb-1 block">Ставка (%)</label>
                                  <input type="number" value={item.mortgageRate || ''} onChange={(e) => updateRE(item.id, 'mortgageRate', Number(e.target.value))} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {!item.isUnderConstruction && (
                            <div className="sm:col-span-2 space-y-4 bg-white p-4 border border-[#e5e5e5]">
                              <div className="flex items-center space-x-3 text-sm">
                                <input 
                                  type="checkbox" 
                                  id={`rent-${item.id}`}
                                  checked={item.isRented} 
                                  onChange={(e) => updateRE(item.id, 'isRented', e.target.checked)} 
                                  className="w-4 h-4 accent-[#987362] cursor-pointer" 
                                />
                                <label htmlFor={`rent-${item.id}`} className="font-medium cursor-pointer select-none">Актив сдается в аренду</label>
                              </div>
                              {item.isRented && (
                                <div className="pl-7 border-l-2 border-[#e5e5e5] mt-4">
                                  <label className="text-xs text-[#666666] mb-1 block">Доход от аренды в месяц (₽)</label>
                                  <input type="text" inputMode="numeric" value={formatNumInput(item.rentIncome || '')} onChange={(e) => updateRE(item.id, 'rentIncome', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-[#fafafa] border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => toggleEditRE(item.id)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">
                            Сохранить актив
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={`re-${item.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} shadow-sm hover:shadow-md transition-shadow duration-300 relative group p-6 md:p-8 print-break-inside-avoid`}>
                      <button onClick={() => removeRE(item.id)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <div>
                          <h4 className="font-tenor text-2xl mb-1 flex items-center">
                            <Home className="w-5 h-5 mr-2 text-[#987362]" />
                            {(item.type || "Объект") + (item.city ? " в г. " + item.city : "")}
                            {item.isUnderConstruction && <span className="ml-3 px-2 py-0.5 bg-[#f5e6e0] text-[#987362] text-xs rounded border border-[#e5e5e5] font-montserrat">В стройке</span>}
                          </h4>
                          <p className="text-sm text-[#666666] font-light">{"Куплено в " + item.purchaseYear + " году"}</p>
                        </div>
                        <div>{renderAuditBadge(audit)}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Текущая стоимость</p>
                          <p className="font-medium text-xl">{formatMoney(item.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Чистый капитал</p>
                          <p className="font-medium text-xl text-[#987362]">{formatMoney(Math.max(0, equity))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Срок владения</p>
                          <p className="font-medium text-xl">{yearsOwned + " " + getYearWord(yearsOwned)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Общий прирост</p>
                          <p className={`font-medium text-xl ${totalGrowthPercent > 0 ? "text-green-600" : (totalGrowthPercent < 0 ? "text-red-600" : "")}`}>
                            {totalGrowthPercent > 0 ? "+" : ""}{totalGrowthPercent}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Рост стоимости (CAGR)</p>
                          <p className={`font-medium text-xl ${cagr > 0 ? "text-green-600" : "text-red-600"}`}>
                            {cagr.toFixed(1) + "%"} <span className="text-xs text-[#a0a0a0] font-light">в год</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Чистая арендная доходность</p>
                          <p className={`font-medium text-xl ${item.isUnderConstruction ? "text-[#a0a0a0]" : (roe > 0 ? "text-green-600" : "text-red-600")}`}>
                            {item.isUnderConstruction ? "В стройке" : roe.toFixed(1) + "%"} 
                            {!item.isUnderConstruction && <span className="text-xs text-[#a0a0a0] font-light">в год</span>}
                          </p>
                        </div>
                        <div className="col-span-2 bg-[#fafafa] p-3 border border-[#e5e5e5] rounded flex flex-col justify-center">
                          <p className="text-xs text-[#666666] mb-1 font-light">Реальная полная доходность</p>
                          <p className={`font-medium text-2xl ${realTotalYield > 4 ? "text-green-600" : (realTotalYield < 0 ? "text-red-600" : "text-yellow-600")}`}>
                            {realTotalYield > 0 ? "+" : ""}{realTotalYield.toFixed(1) + "%"} <span className="text-xs text-[#a0a0a0] font-light">в год</span>
                          </p>
                        </div>
                      </div>

                      {renderAuditAlert(audit, lostAlternativeIncome)}

                      <button onClick={() => toggleEditRE(item.id)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print">
                        <Settings2 className="w-4 h-4 mr-2" /> Изменить параметры
                      </button>
                    </div>
                  );
                }

                if (asset.assetCategory === 'deposit') {
                  const dep = asset;
                  const realYield = dep.rate - constants.inflation;
                  const audit = getDepositAudit(realYield);
                  const lostYieldPercent = constants.alternativeYieldPercent - dep.rate;
                  const lostAlternativeIncome = lostYieldPercent > 0 ? (dep.amount * (lostYieldPercent / 100)) : 0;
                  const cStyles = getAlertStyles(audit.level);

                  if (dep.isEditing) {
                    return (
                      <div key={`dep-${dep.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print print-break-inside-avoid">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Параметры депозита</h4>
                          <button onClick={() => removeDeposit(dep.id)} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Сумма на счету (₽)</label>
                            <input type="text" inputMode="numeric" value={formatNumInput(dep.amount === 0 ? '' : dep.amount)} onChange={(e) => updateDeposit(dep.id, 'amount', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Годовая ставка (%)</label>
                            <input type="number" value={dep.rate === 0 ? '' : dep.rate} onChange={(e) => updateDeposit(dep.id, 'rate', Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => toggleEditDeposit(dep.id)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">
                            Сохранить депозит
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`dep-${dep.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative group print-break-inside-avoid`}>
                      <button onClick={() => removeDeposit(dep.id)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <h4 className="font-tenor text-2xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Банковский депозит</h4>
                        {renderAuditBadge(audit)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Текущий объем</p>
                          <p className="font-medium text-xl">{formatMoney(dep.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Доходность (ном.)</p>
                          <p className={`font-medium text-xl ${dep.rate >= constants.inflation ? "text-green-600" : "text-red-600"}`}>
                            {dep.rate.toFixed(1) + "%"}
                          </p>
                        </div>
                      </div>

                      {renderAuditAlert(audit, lostAlternativeIncome)}

                      <button onClick={() => toggleEditDeposit(dep.id)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print">
                        <Settings2 className="w-4 h-4 mr-2" /> Изменить параметры
                      </button>
                    </div>
                  );
                }

                if (asset.assetCategory === 'stock') {
                  const stock = asset;
                  const realYield = stock.yield - constants.inflation;
                  const audit = getStockAudit(realYield);
                  const lostYieldPercent = constants.alternativeYieldPercent - stock.yield;
                  const lostAlternativeIncome = lostYieldPercent > 0 ? (stock.amount * (lostYieldPercent / 100)) : 0;
                  const cStyles = getAlertStyles(audit.level);

                  if (stock.isEditing) {
                    return (
                      <div key={`stock-${stock.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print print-break-inside-avoid">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Параметры инвестиций в акции</h4>
                          <button onClick={() => removeStock(stock.id)} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Оценка портфеля (₽)</label>
                            <input type="text" inputMode="numeric" value={formatNumInput(stock.amount === 0 ? '' : stock.amount)} onChange={(e) => updateStock(stock.id, 'amount', Number(e.target.value.replace(/\D/g, '')))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666666] mb-1 block">Средняя доходность (%)</label>
                            <input type="number" value={stock.yield === 0 ? '' : stock.yield} onChange={(e) => updateStock(stock.id, 'yield', Number(e.target.value))} className="w-full p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => toggleEditStock(stock.id)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">
                            Сохранить портфель
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`stock-${stock.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative group print-break-inside-avoid`}>
                      <button onClick={() => removeStock(stock.id)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <h4 className="font-tenor text-2xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Фондовый рынок</h4>
                        {renderAuditBadge(audit)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Текущий объем</p>
                          <p className="font-medium text-xl">{formatMoney(stock.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Доходность (ном.)</p>
                          <p className={`font-medium text-xl ${stock.yield >= constants.inflation ? "text-green-600" : "text-red-600"}`}>
                            {stock.yield.toFixed(1) + "%"}
                          </p>
                        </div>
                      </div>

                      {renderAuditAlert(audit, lostAlternativeIncome)}

                      <button onClick={() => toggleEditStock(stock.id)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print">
                        <Settings2 className="w-4 h-4 mr-2" /> Изменить параметры
                      </button>
                    </div>
                  );
                }

                if (asset.assetCategory === 'cash') {
                  const share = auditResults.totalPotentialCapital > 0 ? (asset.amount / auditResults.totalPotentialCapital) * 100 : 0;
                  const audit = getCashAudit(share);
                  const lostAlternativeIncome = asset.amount * (constants.alternativeYieldPercent / 100);
                  const cStyles = getAlertStyles(audit.level);

                  if (asset.isEditing) {
                    return (
                      <div key={`cash-${asset.id}`} className="bg-[#fafafa] border border-[#e5e5e5] shadow-sm relative group p-6 md:p-8 no-print print-break-inside-avoid">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-tenor text-xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Настройка наличных</h4>
                          <button onClick={() => { setCash(null); setIsEditingCash(false); }} className="text-[#a0a0a0] hover:text-red-400 transition-colors" title="Удалить актив">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div>
                          <label className="text-xs text-[#666666] mb-1 block">Наличные (₽)</label>
                          <input type="text" inputMode="numeric" value={formatNumInput(asset.amount)} onChange={(e) => setCash(e.target.value === '' ? 0 : Number(e.target.value.replace(/\D/g, '')))} className="w-full md:w-1/2 p-2.5 text-sm bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-end">
                          <button onClick={() => setIsEditingCash(false)} className="bg-[#987362] hover:bg-[#826152] text-white px-6 py-2.5 text-sm font-medium transition-colors">
                            Сохранить актив
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`cash-${asset.id}`} className={`${cStyles.cardBg} border ${cStyles.cardBorder} p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative group print-break-inside-avoid`}>
                      <button onClick={() => setCash(null)} className="absolute top-6 right-6 text-[#e5e5e5] group-hover:text-red-400 transition-colors z-10 no-print" title="Удалить актив">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pr-8">
                        <h4 className="font-tenor text-2xl flex items-center"><Wallet className="w-5 h-5 mr-2 text-[#987362]" /> Наличные средства</h4>
                        {renderAuditBadge(audit)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Текущий объем</p>
                          <p className="font-medium text-xl">{formatMoney(asset.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] mb-1 font-light">Доля в портфеле</p>
                          <p className="font-medium text-xl">{share.toFixed(1)}%</p>
                        </div>
                      </div>

                      {renderAuditAlert(audit, lostAlternativeIncome)}

                      <button onClick={() => setIsEditingCash(true)} className="text-sm text-[#987362] hover:text-[#826152] flex items-center font-medium transition-colors mt-2 no-print">
                        <Settings2 className="w-4 h-4 mr-2" /> Изменить сумму
                      </button>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="bg-[#987362] p-8 md:p-10 shadow-sm relative overflow-hidden mt-10 print-break-inside-avoid">
              <Scale className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5 pointer-events-none" />
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <p className="text-sm text-white/80 mb-2 font-light">Ваш капитал сегодня</p>
                    <p className="text-4xl md:text-5xl font-tenor tracking-tight text-white">{formatMoney(auditResults.totalPotentialCapital)}</p>
                    <p className="text-xs text-white/70 mt-3 font-light leading-relaxed">
                      Это сумма, которую вы получите при продаже всех активов с учетом:
                      <br/>– налога 13% (если срок владения менее 5 лет)
                      <br/>– комиссии при продаже (в среднем 3.5%)
                      <br/>– погашения остатка по ипотеке
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/80 mb-2 font-light">Капитал, который можно усилить</p>
                    <p className="text-4xl md:text-5xl font-tenor tracking-tight text-[#f5e6e0]">{formatMoney(auditResults.inefficientCapital)}</p>
                    <p className="text-xs text-white/70 mt-3 font-light leading-relaxed">
                      Часть средств, которые сейчас работают ниже целевой доходности 13% и могут быть направлены в более эффективные инструменты.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                       <p className="text-xs text-white/80 mb-1 font-light">Потенциал роста за 15 лет</p>
                       <p className="text-xl font-medium text-white">{formatMoney(auditResults.inefficientFutureReal)}</p>
                       <p className="text-xs text-white/60 mt-1 font-light">
                         Если направить этот капитал в стратегию реинвестирования недвижимости (Сценарий Б)
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8 pt-8 print-break-inside-avoid">
            <div className="space-y-4 border-b border-[#e5e5e5] pb-4">
              <div className="flex items-center space-x-3">
                <Calculator className="w-6 h-6 text-[#987362]" />
                <h2 className="text-2xl font-tenor tracking-tight">Шаг 2. Проектирование финансовой точки Б</h2>
              </div>
              <p className="text-[#666666] font-light leading-relaxed text-sm max-w-4xl">
                Определите сумму для реинвестирования: вы можете задействовать весь капитал или переложить только неэффективные активы. Укажите комфортный ежемесячный платеж, тип ипотеки и желаемую сумму пассивного дохода, чтобы алгоритм построил пошаговый план на 15 лет
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8 bg-white p-6 md:p-8 border border-[#e5e5e5] no-print">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666]">Стартовый капитал (₽)</label>
                    <input type="text" inputMode="numeric" value={formatNumInput(startCapital)} onChange={(e) => setStartCapital(e.target.value.replace(/\D/g, ''))} className="w-full text-xl font-medium p-3 bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                    <p className="text-xs text-[#a0a0a0]">Извлеченный собственный капитал</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e5e5] gap-4">
                    <span className="text-sm font-medium leading-snug">Рассчитать платеж автоматически</span>
                    <button onClick={() => setIsAutoPayment(!isAutoPayment)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center transition-colors border ${isAutoPayment ? "bg-[#987362] border-[#987362]" : "bg-[#e5e5e5] border-[#e5e5e5]"}`}>
                      <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${isAutoPayment ? "translate-x-6" : "translate-x-1"}`}></span>
                    </button>
                  </div>

                  {!isAutoPayment && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#666666]">Комфортный платеж в месяц (₽)</label>
                      <input type="text" inputMode="numeric" value={formatNumInput(monthlyPaymentLimit)} onChange={(e) => setMonthlyPaymentLimit(Number(e.target.value.replace(/\D/g, '')))} className="w-full text-xl font-medium p-3 bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666] block mb-2">Право на семейную ипотеку (6%)</label>
                    <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e5e5] gap-4">
                      <span className="text-sm font-medium leading-snug">Семейная ипотека</span>
                      <button onClick={() => setIsFamilyMortgage(!isFamilyMortgage)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center transition-colors border ${isFamilyMortgage ? "bg-[#987362] border-[#987362]" : "bg-[#e5e5e5] border-[#e5e5e5]"}`}>
                        <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${isFamilyMortgage ? "translate-x-6" : "translate-x-1"}`}></span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-6 border-t border-[#e5e5e5]">
                    <label className="text-sm font-medium text-[#666666]">Желаемый пассивный доход в месяц (₽)</label>
                    <input type="text" inputMode="numeric" value={formatNumInput(desiredPassiveIncome || '')} onChange={(e) => setDesiredPassiveIncome(e.target.value === '' ? '' : Number(e.target.value.replace(/\D/g, '')))} className="w-full text-xl font-medium p-3 bg-white border border-[#e5e5e5] focus:outline-none focus:border-[#987362] transition-colors" />
                    <p className="text-xs text-[#a0a0a0]">Цель через 15 лет</p>
                  </div>
                </div>
              </div>

              <ChartSection
                calculationResults={calculationResults}
                targetCapital={targetCapital}
                formatMoney={formatMoney}
                chartData={chartData}
                currentProgress={currentProgress}
                activeProgress={activeProgress}
                lostProfit={lostProfit}
              />
            </div>

            <div className="mt-10 pt-10 border-t border-[#e5e5e5] flex justify-center no-print">
              <button 
                onClick={handlePrint} 
                className="bg-white hover:bg-[#fafafa] text-[#222222] border border-[#e5e5e5] hover:border-[#987362] px-8 py-4 text-sm font-medium transition-all flex items-center space-x-2"
              >
                <Download className="w-5 h-5 text-[#987362]" />
                <span>Скачать расчет в PDF</span>
              </button>
            </div>
          </section>

          <div className="bg-[#1c1c1c] p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full print-break-inside-avoid">
            <div className="space-y-2">
              <p className="text-xl md:text-3xl font-tenor text-white tracking-tight leading-snug">Калькулятор показывает потенциал</p>
              <p className="text-[#a0a0a0] text-sm md:text-xl font-light">Консультация превращает его в стратегию</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto justify-center bg-[#987362] hover:bg-[#826152] text-white px-6 py-4 text-sm md:text-base font-medium transition-colors flex items-center space-x-2 no-print"
            >
              <span className="text-center">Записаться на разбор</span>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>

          <Showcase formatMoney={formatMoney} />

          <footer className="pt-16 pb-8 border-t border-[#e5e5e5] mt-16 text-center md:text-left print-break-inside-avoid">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[#666666]">
               <div className="space-y-2 flex flex-col items-center md:items-start">
                 <p className="font-medium text-[#222222]">ИП Соболева Виктория Викторовна</p>
                 <p className="text-xs">ОГРНИП: 321508100582522</p>
               </div>
               <div className="space-y-2">
                  <p className="font-medium text-[#222222]">Документы</p>
                  <a href="#" className="text-xs hover:text-[#987362] transition-colors block">Политика конфиденциальности</a>
                  <a href="#" className="text-xs hover:text-[#987362] transition-colors block">Договор оферты</a>
               </div>
               <div className="space-y-2">
                  <p className="font-medium text-[#222222]">Контакты</p>
                  <div className="flex justify-center md:justify-start space-x-4">
                     <a href="#" className="text-xs hover:text-[#987362] transition-colors">Telegram</a>
                     <a href="#" className="text-xs hover:text-[#987362] transition-colors">WhatsApp</a>
                     <a href="#" className="text-xs hover:text-[#987362] transition-colors">Instagram</a>
                  </div>
               </div>
            </div>
          </footer>

        </div>
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
      />

    </div>
  );
}