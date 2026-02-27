import { useMemo } from 'react';
import { CURRENT_YEAR, constants } from '../config/data';
import { 
  getRemainingBalance, getRealEstateAudit, getStockAudit, 
  getDepositAudit, getCashAudit 
} from '../utils/helpers';

export const useCalculator = ({
  realEstate, deposits, stocks, cash, 
  startCapital, isAutoPayment, monthlyPaymentLimit, 
  isFamilyMortgage, desiredPassiveIncome
}) => {

  const auditResults = useMemo(() => {
    let totalPotentialCapital = 0;
    let inefficientCapital = 0;
    let totalCurrentRealIncome = 0;
    let totalLostIncome = 0;
    
    const reData = [];

    realEstate.forEach(item => {
      const yearsOwned = Math.max(1, CURRENT_YEAR - (Number(item.purchaseYear) || CURRENT_YEAR));
      const cValue = Number(item.currentValue) || 0;
      const pPrice = Number(item.purchasePrice) || 0;
      const lBalance = Number(item.loanBalance) || 0;
      
      const commission = cValue * constants.commissionPercent;
      let tax = 0;
      if (yearsOwned < constants.taxFreeYears && cValue > pPrice) {
        tax = (cValue - pPrice) * constants.taxRate;
      }
      const activeLoanBalance = item.hasMortgage ? lBalance : 0;
      const equity = Math.max(0, cValue - activeLoanBalance - commission - tax);
      
      totalPotentialCapital += equity;
      reData.push({ item, yearsOwned, equity, cValue, pPrice });
    });

    deposits.forEach(item => { totalPotentialCapital += Number(item.amount) || 0; });
    stocks.forEach(item => { totalPotentialCapital += Number(item.amount) || 0; });
    const cashNum = Number(cash) || 0;
    totalPotentialCapital += cashNum;

    reData.forEach(({ item, yearsOwned, equity, cValue, pPrice }) => {
      const rIncome = Number(item.rentIncome) || 0;
      const mPayment = Number(item.mortgagePayment) || 0;
      
      const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? rIncome : 0) - (item.hasMortgage ? mPayment : 0);
      const roe = equity > 0 ? ((netMonthlyRent * 12) / equity) * 100 : 0;
      
      let cagr = 0;
      if (pPrice > 0 && cValue > 0) {
        cagr = (Math.pow(cValue / pPrice, 1 / yearsOwned) - 1) * 100;
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
      const amt = Number(item.amount) || 0;
      const rate = Number(item.rate) || 0;
      const realYield = rate - constants.inflation;
      const audit = getDepositAudit(realYield);
      
      if (audit.level === 'red' || audit.level === 'orange' || realYield < 0) {
        inefficientCapital += amt;
      }
      
      totalCurrentRealIncome += amt * (realYield / 100);
      const lostYield = constants.alternativeYieldPercent - rate;
      if (lostYield > 0) totalLostIncome += amt * (lostYield / 100);
    });

    stocks.forEach(item => {
      const amt = Number(item.amount) || 0;
      const yieldPct = Number(item.yield) || 0;
      const realYield = yieldPct - constants.inflation;
      const audit = getStockAudit(realYield);
      
      if (audit.level === 'red' || audit.level === 'orange') {
        inefficientCapital += amt;
      }
      
      totalCurrentRealIncome += amt * (realYield / 100);
      const lostYield = constants.alternativeYieldPercent - yieldPct;
      if (lostYield > 0) totalLostIncome += amt * (lostYield / 100);
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
      totalPotentialCapital, inefficientCapital, averageRealYield,
      potentialIncome10, inefficientFutureReal, totalLostIncome
    };
  }, [realEstate, deposits, stocks, cash]);

  const targetCapital = useMemo(() => {
    const income = Number(desiredPassiveIncome) || 0;
    return (income * 12) / constants.conservativeYield;
  }, [desiredPassiveIncome]);

  const calculationResults = useMemo(() => {
    const numStartCapital = Number(startCapital) || 0;
    const numPaymentLimit = Number(monthlyPaymentLimit) || 0;
    const safeStartCapital = numStartCapital > 0 ? numStartCapital : 1;
    const safePaymentLimit = numPaymentLimit >= 0 ? numPaymentLimit : 0;
    
    let currentCapital = safeStartCapital;
    const yearlyData = [{
      year: 0, nominalCapital: safeStartCapital, realCapital: safeStartCapital, propertyValue: 0, loanBalance: 0
    }];
    const milestones = [];

    // Вычисляем "идеальный платеж", если вложить ВЕСЬ капитал под 20%
    let optimalFullPayment = 0;
    let capForOpt = safeStartCapital;
    const optMonths = 360;
    if (isFamilyMortgage && capForOpt > 0) {
      const fRate = (constants.rateFamily / 100) / 12;
      const annF = (fRate * Math.pow(1 + fRate, optMonths)) / (Math.pow(1 + fRate, optMonths) - 1);
      const usedDP = Math.min(capForOpt, 3000000); // макс ПВ для семейной
      optimalFullPayment += (usedDP / constants.downPaymentPercent * (1 - constants.downPaymentPercent)) * annF;
      capForOpt -= usedDP;
    }
    if (capForOpt > 0) {
      const sRate = (constants.rateStandardFirst / 100) / 12;
      const annS = (sRate * Math.pow(1 + sRate, optMonths)) / (Math.pow(1 + sRate, optMonths) - 1);
      optimalFullPayment += (capForOpt / constants.downPaymentPercent * (1 - constants.downPaymentPercent)) * annS;
    }

    let firstCycleUnusedCapital = 0;
    let firstCyclePropertiesCount = 0;

    for (let cycle = 0; cycle < constants.cyclesCount; cycle++) {
      const currentMortgageTermYears = 30 - (cycle * 5);
      const totalMonths = currentMortgageTermYears * 12;
      let cycleProperties = [];
      let cycleUnusedCapital = 0;
      let remainingCapital = currentCapital;
      let remainingPaymentLimit = isAutoPayment ? Infinity : safePaymentLimit;

      if (cycle === 0) {
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
            cycleProperties.push({ price: familyPrice, loan: familyLoan, rate: familyRateDecimal, payment: familyPayment });
            remainingCapital -= familyDP;
            remainingPaymentLimit -= familyPayment;
          }
        }

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
            cycleProperties.push({ price: standardPrice, loan: standardLoan, rate: standardRateDecimal, payment: standardPayment });
            remainingCapital -= standardDP;
          }
        }
        
        firstCycleUnusedCapital = Math.max(0, remainingCapital);
        firstCyclePropertiesCount = cycleProperties.length;

      } else {
        if (remainingCapital > 0 && (isAutoPayment || safePaymentLimit > 0)) {
          const nextRateDecimal = (constants.rateNextCycles / 100) / 12;
          const annuityNext = (nextRateDecimal * Math.pow(1 + nextRateDecimal, totalMonths)) / (Math.pow(1 + nextRateDecimal, totalMonths) - 1);
          const price = remainingCapital / constants.downPaymentPercent;
          const dp = remainingCapital;
          const loan = price - dp;
          const payment = loan * annuityNext;
          cycleProperties.push({ price: price, loan: loan, rate: nextRateDecimal, payment: payment });
          remainingCapital = 0;
        }
      }

      cycleUnusedCapital = Math.max(0, remainingCapital);
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
        
        let netCapital = totalPropertyValue - totalCommission - totalLoanBalance + cycleUnusedCapital;
        let realCapital = netCapital / Math.pow(1 + constants.inflation / 100, globalYear);

        yearlyData.push({
          year: globalYear, nominalCapital: Math.round(netCapital), realCapital: Math.round(realCapital),
          propertyValue: Math.round(totalPropertyValue), loanBalance: Math.round(totalLoanBalance)
        });

        if (year === constants.cycleYears) {
          currentCapital = netCapital;
          milestones.push({
            year: globalYear, initialPropertyValue: Math.round(initialTotalPropertyValue), propertyValue: Math.round(totalPropertyValue),
            loanBalance: Math.round(totalLoanBalance), commission: Math.round(totalCommission),
            netCapital: Math.round(netCapital), realCapital: Math.round(realCapital), monthlyPayment: Math.round(cycleMonthlyPayment)
          });
        }
      }
    }

    const finalNominal = yearlyData[yearlyData.length - 1].nominalCapital;
    const finalReal = yearlyData[yearlyData.length - 1].realCapital;
    const growthMultiplier = (finalReal / safeStartCapital).toFixed(1);
    const cagr = ((Math.pow(finalReal / safeStartCapital, 1 / (constants.cyclesCount * constants.cycleYears)) - 1) * 100).toFixed(1);

    return { 
      yearlyData, milestones, finalNominal, finalReal, growthMultiplier, cagr, 
      firstCycleUnusedCapital, firstCyclePropertiesCount, optimalFullPayment 
    };
  }, [startCapital, isAutoPayment, monthlyPaymentLimit, isFamilyMortgage]);

  const currentStrategyFinalReal = useMemo(() => {
    let nominal = 0;
    realEstate.forEach(item => {
      const cValue = Number(item.currentValue) || 0;
      const lBalance = Number(item.loanBalance) || 0;
      const mRate = Number(item.mortgageRate) || 0;
      const mPayment = Number(item.mortgagePayment) || 0;
      const rIncome = Number(item.rentIncome) || 0;

      const futureValue = cValue * Math.pow(1 + constants.basePropertyGrowth, 15);
      const remainingDebt = item.hasMortgage ? getRemainingBalance(lBalance, mRate, mPayment, 15 * 12) : 0;
      const futureCommission = futureValue * constants.commissionPercent;
      const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? rIncome : 0) - (item.hasMortgage ? mPayment : 0);
      const accumulatedRent = netMonthlyRent * 12 * 15;
      nominal += futureValue - remainingDebt - futureCommission + accumulatedRent;
    });

    deposits.forEach(item => { nominal += (Number(item.amount) || 0) * Math.pow(1 + (Number(item.rate) || 0) / 100, 15); });
    stocks.forEach(item => { nominal += (Number(item.amount) || 0) * Math.pow(1 + (Number(item.yield) || 0) / 100, 15); });
    nominal += Number(cash) || 0;
    
    const real = nominal / Math.pow(1 + constants.inflation / 100, 15);
    return real > 0 ? real : 0;
  }, [realEstate, deposits, stocks, cash]);

  const chartData = useMemo(() => {
    return calculationResults.yearlyData.map(point => {
      const year = point.year;
      let nominal = 0;

      realEstate.forEach(item => {
        const cValue = Number(item.currentValue) || 0;
        const lBalance = Number(item.loanBalance) || 0;
        const mRate = Number(item.mortgageRate) || 0;
        const mPayment = Number(item.mortgagePayment) || 0;
        const rIncome = Number(item.rentIncome) || 0;

        const futureValue = cValue * Math.pow(1 + constants.basePropertyGrowth, year);
        const remainingDebt = item.hasMortgage ? getRemainingBalance(lBalance, mRate, mPayment, year * 12) : 0;
        const futureCommission = futureValue * constants.commissionPercent;
        const netMonthlyRent = (!item.isUnderConstruction && item.isRented ? rIncome : 0) - (item.hasMortgage ? mPayment : 0);
        const accumulatedRent = netMonthlyRent * 12 * year;
        nominal += futureValue - remainingDebt - futureCommission + accumulatedRent;
      });

      deposits.forEach(item => { nominal += (Number(item.amount) || 0) * Math.pow(1 + (Number(item.rate) || 0) / 100, year); });
      stocks.forEach(item => { nominal += (Number(item.amount) || 0) * Math.pow(1 + (Number(item.yield) || 0) / 100, year); });
      nominal += Number(cash) || 0;
      
      const real = nominal / Math.pow(1 + constants.inflation / 100, year);
      return { ...point, realCapitalA: Math.round(real > 0 ? real : 0) };
    });
  }, [calculationResults.yearlyData, realEstate, deposits, stocks, cash]);

  const currentProgress = targetCapital > 0 ? Math.min(100, (currentStrategyFinalReal / targetCapital) * 100).toFixed(1) : 0;
  const activeProgress = targetCapital > 0 ? Math.min(100, (calculationResults.finalReal / targetCapital) * 100).toFixed(1) : 0;
  const lostProfit = Math.max(0, calculationResults.finalReal - currentStrategyFinalReal);

  return {
    auditResults, targetCapital, calculationResults, currentStrategyFinalReal, 
    chartData, currentProgress, activeProgress, lostProfit
  };
};