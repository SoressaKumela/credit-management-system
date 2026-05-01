
function calculateDueDate(transactionDate, cycle) {
  if (!cycle || cycle === 'FLEXIBLE') return null;
  const d = new Date(transactionDate);
  switch (cycle) {
    case 'WEEKLY': d.setDate(d.getDate() + 7); break;
    case 'BIWEEKLY': d.setDate(d.getDate() + 14); break;
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
    default: return null;
  }
  return d;
}

function classifyPayment(paymentDate, nextDueDate) {
  if (!nextDueDate) return 'ON_TIME';
  const payment = new Date(paymentDate).getTime();
  const due = new Date(nextDueDate).getTime();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (payment > due) return 'LATE';
  if (payment < due - threeDays) return 'EARLY';
  return 'ON_TIME';
}

module.exports = { calculateDueDate, classifyPayment };
