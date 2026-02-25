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
  doc.text(`ID No: ${member.id_no || '-'}`, 20, yPos);
  yPos += 6;
  doc.text(`Role: ${member.role}`, 20, yPos);
  yPos += 6;
  doc.text(`Type: ${member.member_type === 'player' ? 'Player' : 'Staff'}`, 20, yPos);
  yPos += 6;
  doc.text(`Monthly Salary: ${formatCurrency(member.monthly_salary)}`, 20, yPos);
  yPos += 6;
  doc.text(`Registration Fee: ${formatCurrency(Number(member.registration_fee || 0))}`, 20, yPos);
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
  doc.text('ID No', 70, yPos);
  doc.text('Role', 100, yPos);
  doc.text('Salary', 140, yPos);
  doc.text('Reg Fee', 172, yPos);
  yPos += 6;

  members.forEach((member) => {
    doc.text(member.full_name, 20, yPos);
    doc.text(member.id_no || '-', 70, yPos);
    doc.text(member.role, 100, yPos);
    doc.text(formatCurrency(member.monthly_salary), 140, yPos);
    doc.text(formatCurrency(Number(member.registration_fee || 0)), 172, yPos);
    yPos += 5;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 10;
  const totalSalaries = members.reduce((sum, m) => sum + Number(m.monthly_salary), 0);
  const totalRegistrationFees = members.reduce((sum, m) => sum + Number(m.registration_fee || 0), 0);
  doc.setFontSize(10);
  doc.text(`Total Monthly Salaries: ${formatCurrency(totalSalaries)}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Registration Fees: ${formatCurrency(totalRegistrationFees)}`, 20, yPos);

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

export function generateContractAgreement(contract: any, member: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPos = 18;

  const writeWrapped = (text: string, fontSize = 10, lineGap = 5) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * lineGap;
  };

  const ensurePageBreak = (spaceNeeded = 16) => {
    if (yPos + spaceNeeded > 280) {
      doc.addPage();
      yPos = 20;
    }
  };

  doc.setFontSize(16);
  doc.text('Fahari Football Club', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  doc.setFontSize(12);
  if (contract.contract_type === 'player') {
    doc.text('PLAYER CONTRACT AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.text('MKATABA WA AJIRA YA MCHEZAJI', pageWidth / 2, yPos, { align: 'center' });
  } else {
    doc.text('STAFF CONTRACT AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.text('MKATABA WA AJIRA YA STAFF', pageWidth / 2, yPos, { align: 'center' });
  }

  yPos += 10;
  doc.setFontSize(9);
  doc.text(`Contract No: ${contract.contract_no}`, margin, yPos);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  writeWrapped(
    `This Agreement is made between Fahari Football Club (the Club) and ${member.full_name} (the ${contract.contract_type === 'player' ? 'Player' : 'Staff'}).`
  );
  writeWrapped(
    `Mkataba huu umefanywa kati ya Fahari Football Club (Timu) na ${member.full_name} (${contract.contract_type === 'player' ? 'Mchezaji' : 'Staff'}).`
  );

  yPos += 2;
  doc.setFontSize(10);
  doc.text(`ID No: ${member.id_no || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(`Position/Cheo: ${contract.position_title || member.role || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(
    `Contract Period: ${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`,
    margin,
    yPos
  );
  yPos += 8;

  ensurePageBreak();
  doc.setFontSize(11);
  doc.text('1. CONTRACT PERIOD / MUDA WA MKATABA', margin, yPos);
  yPos += 6;
  writeWrapped(
    `The contract shall commence on ${formatDate(contract.start_date)} and end on ${formatDate(contract.end_date)}.`
  );
  writeWrapped(
    `Mkataba huu utaanza tarehe ${formatDate(contract.start_date)} na utaisha tarehe ${formatDate(contract.end_date)}.`
  );

  ensurePageBreak();
  doc.setFontSize(11);
  doc.text('2. FINANCIAL TERMS / MASHARTI YA FEDHA', margin, yPos);
  yPos += 6;
  writeWrapped(
    `Monthly allowance shall be ${formatCurrency(Number(contract.monthly_allowance || 0))}.`
  );
  writeWrapped(
    `Posho ya kila mwezi itakuwa ${formatCurrency(Number(contract.monthly_allowance || 0))}.`
  );

  if (contract.contract_type === 'player') {
    writeWrapped(
      `Registration fee shall be ${formatCurrency(Number(contract.registration_fee || 0))} (if applicable).`
    );
    writeWrapped(
      `Ada ya usajili itakuwa ${formatCurrency(Number(contract.registration_fee || 0))} (kama ipo).`
    );
  }

  ensurePageBreak();
  doc.setFontSize(11);
  if (contract.contract_type === 'player') {
    doc.text('3. PLAYER OBLIGATIONS / WAJIBU WA MCHEZAJI', margin, yPos);
    yPos += 6;
    writeWrapped('Attend all trainings and official matches.');
    writeWrapped('Kuhudhuria mazoezi na mechi rasmi zote.');
    writeWrapped('Follow instructions from the technical bench.');
    writeWrapped('Kufuata maelekezo ya benchi la ufundi.');
    writeWrapped('Maintain discipline on and off the field.');
    writeWrapped('Kudumisha nidhamu ndani na nje ya uwanja.');
  } else {
    doc.text('3. DUTIES / MAJUKUMU', margin, yPos);
    yPos += 6;
    writeWrapped('The Staff agrees to perform assigned duties professionally and protect the interests of the Club.');
    writeWrapped('Staff atatekeleza majukumu yake kwa uaminifu na kulinda maslahi ya timu.');
  }

  ensurePageBreak();
  doc.setFontSize(11);
  doc.text('4. CONFIDENTIALITY / SIRI ZA TIMU', margin, yPos);
  yPos += 6;
  writeWrapped('The member shall not disclose confidential information of the Club to third parties without written permission.');
  writeWrapped('Mhusika hataruhusiwa kutoa taarifa za siri za timu kwa mtu yeyote bila ruhusa ya maandishi kutoka kwa timu.');

  ensurePageBreak();
  doc.setFontSize(11);
  doc.text('5. TERMINATION / KUSITISHA MKATABA', margin, yPos);
  yPos += 6;
  writeWrapped('This contract may be terminated by mutual agreement or serious misconduct.');
  writeWrapped('Mkataba huu unaweza kusitishwa kwa makubaliano ya pande zote au kwa utovu wa nidhamu mkubwa.');

  if (contract.termination_reason) {
    ensurePageBreak();
    doc.setFontSize(10);
    doc.text(`Termination Reason: ${contract.termination_reason}`, margin, yPos);
    yPos += 8;
  }

  ensurePageBreak(42);
  doc.setFontSize(11);
  doc.text('SIGNATURES / SAINI', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`${contract.contract_type === 'player' ? 'Player' : 'Staff'} Signature: ____________________`, margin, yPos);
  yPos += 6;
  doc.text(`Name/Jina: ${contract.member_signed_name || member.full_name || ''}`, margin, yPos);
  yPos += 6;
  doc.text(`Date/Tarehe: ${contract.member_signed_date ? formatDate(contract.member_signed_date) : '____________________'}`, margin, yPos);
  yPos += 10;
  doc.text('For Fahari Football Club: ____________________', margin, yPos);
  yPos += 6;
  doc.text(`Name/Jina: ${contract.club_signed_name || '____________________'}`, margin, yPos);
  yPos += 6;
  doc.text(`Date/Tarehe: ${contract.club_signed_date ? formatDate(contract.club_signed_date) : '____________________'}`, margin, yPos);

  yPos += 12;
  doc.setFontSize(8);
  writeWrapped(
    'Legal Notice: This template should be reviewed by legal counsel before production use.',
    8,
    4
  );

  doc.save(`${contract.contract_no}_Agreement.pdf`);
}
