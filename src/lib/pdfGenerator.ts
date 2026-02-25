import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from './utils';

export function generateMemberReport(member: any, salaryPayments: any[], extraPayments: any[], startDate?: string | null, endDate?: string | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text('Fahari Football Club', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.text('Member Financial Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  if (startDate || endDate) {
    doc.setFontSize(9);
    const dateRange = startDate && endDate
      ? `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
      ? `From: ${formatDate(startDate)}`
      : `Until: ${formatDate(endDate!)}`;
    doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  } else {
    yPos += 15;
  }

  doc.setFontSize(10);
  doc.text(`Name: ${member.full_name}`, 20, yPos);
  yPos += 6;
  doc.text(`Role: ${member.role}`, 20, yPos);
  yPos += 6;
  doc.text(`Type: ${member.member_type === 'player' ? 'Player' : 'Staff'}`, 20, yPos);
  yPos += 6;
  doc.text(`Monthly Salary: ${formatCurrency(member.monthly_salary)}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.text('Salary Payments', 20, yPos);
  yPos += 6;

  if (salaryPayments.length === 0) {
    doc.setFontSize(9);
    doc.text('No salary payments recorded', 20, yPos);
    yPos += 6;
  } else {
    doc.setFontSize(8);
    salaryPayments.forEach((payment) => {
      doc.text(`${formatDate(payment.payment_date)} - ${payment.month}: ${formatCurrency(payment.amount)}`, 20, yPos);
      yPos += 5;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
  }

  yPos += 5;
  doc.setFontSize(11);
  doc.text('Extra Payments', 20, yPos);
  yPos += 6;

  if (extraPayments.length === 0) {
    doc.setFontSize(9);
    doc.text('No extra payments recorded', 20, yPos);
    yPos += 6;
  } else {
    doc.setFontSize(8);
    extraPayments.forEach((payment) => {
      doc.text(`${formatDate(payment.payment_date)} - ${payment.category}: ${formatCurrency(payment.amount)}`, 20, yPos);
      yPos += 5;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
  }

  yPos += 10;
  const totalSalaries = salaryPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExtras = extraPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCost = totalSalaries + totalExtras;

  doc.setFontSize(10);
  doc.text(`Total Salaries: ${formatCurrency(totalSalaries)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Extra Payments: ${formatCurrency(totalExtras)}`, 20, yPos);
  yPos += 6;
  doc.setFontSize(11);
  doc.text(`Total Cost: ${formatCurrency(totalCost)}`, 20, yPos);

  doc.save(`${member.full_name}_Report.pdf`);
}

export function generateAllMembersReport(members: any[], type: 'player' | 'staff') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text('Fahari Football Club', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.text(`${type === 'player' ? 'Players' : 'Staff'} Report`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(8);
  doc.text('Name', 20, yPos);
  doc.text('Role', 80, yPos);
  doc.text('Monthly Salary', 140, yPos);
  yPos += 6;

  members.forEach((member) => {
    doc.text(member.full_name, 20, yPos);
    doc.text(member.role, 80, yPos);
    doc.text(formatCurrency(member.monthly_salary), 140, yPos);
    yPos += 5;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 10;
  const totalSalaries = members.reduce((sum, m) => sum + Number(m.monthly_salary), 0);
  doc.setFontSize(10);
  doc.text(`Total Monthly Salaries: ${formatCurrency(totalSalaries)}`, 20, yPos);

  doc.save(`All_${type === 'player' ? 'Players' : 'Staff'}_Report.pdf`);
}

export function generateMatchExpensesReport(expenses: any[], startDate?: string | null, endDate?: string | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text('Fahari Football Club', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.text('Match Expenses Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  if (startDate || endDate) {
    const dateRange = startDate && endDate
      ? `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
      ? `From: ${formatDate(startDate)}`
      : `Until: ${formatDate(endDate!)}`;
    doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  } else {
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }

  doc.setFontSize(8);
  doc.text('Date', 20, yPos);
  doc.text('Opponent', 50, yPos);
  doc.text('Category', 100, yPos);
  doc.text('Amount', 150, yPos);
  yPos += 6;

  expenses.forEach((expense) => {
    doc.text(formatDate(expense.match_date), 20, yPos);
    doc.text(expense.opponent, 50, yPos);
    doc.text(expense.category, 100, yPos);
    doc.text(formatCurrency(expense.amount), 150, yPos);
    yPos += 5;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 10;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  doc.setFontSize(10);
  doc.text(`Total Match Expenses: ${formatCurrency(total)}`, 20, yPos);

  doc.save('Match_Expenses_Report.pdf');
}

export function generateOtherExpensesReport(expenses: any[], startDate?: string | null, endDate?: string | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text('Fahari Football Club', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.text('Other Expenses Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  if (startDate || endDate) {
    const dateRange = startDate && endDate
      ? `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
      ? `From: ${formatDate(startDate)}`
      : `Until: ${formatDate(endDate!)}`;
    doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  } else {
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }

  doc.setFontSize(8);
  doc.text('Date', 20, yPos);
  doc.text('Item', 45, yPos);
  doc.text('Category', 95, yPos);
  doc.text('Amount', 150, yPos);
  yPos += 6;

  expenses.forEach((expense) => {
    doc.text(formatDate(expense.expense_date), 20, yPos);
    doc.text(expense.expense_item, 45, yPos);
    doc.text(expense.category, 95, yPos);
    doc.text(formatCurrency(expense.amount), 150, yPos);
    yPos += 5;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 10;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  doc.setFontSize(10);
  doc.text(`Total Other Expenses: ${formatCurrency(total)}`, 20, yPos);

  doc.save('Other_Expenses_Report.pdf');
}

export function generateFinancialSummaryReport(data: any, startDate?: string | null, endDate?: string | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text('Fahari Football Club', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.text('Financial Summary Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  if (startDate || endDate) {
    const dateRange = startDate && endDate
      ? `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
      ? `From: ${formatDate(startDate)}`
      : `Until: ${formatDate(endDate!)}`;
    doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  } else {
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
  }

  doc.setFontSize(11);
  doc.text('Club Statistics', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Total Players: ${data.totalPlayers}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Staff: ${data.totalStaff}`, 20, yPos);
  yPos += 15;

  doc.setFontSize(11);
  doc.text('Financial Overview', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Total Salaries Paid: ${formatCurrency(data.totalSalariesPaid)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Extra Payments: ${formatCurrency(data.totalExtraPayments)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Match Expenses: ${formatCurrency(data.totalMatchExpenses)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Other Expenses: ${formatCurrency(data.totalOtherExpenses)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Income: ${formatCurrency(data.totalIncome)}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  const netBalance = data.totalIncome - (
    data.totalSalariesPaid +
    data.totalExtraPayments +
    data.totalMatchExpenses +
    data.totalOtherExpenses
  );
  doc.text(`Net Balance: ${formatCurrency(netBalance)}`, 20, yPos);

  doc.save('Financial_Summary_Report.pdf');
}
