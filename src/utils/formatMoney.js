/**
 * Форматирует число с разделением тысяч пробелами.
 * @param {number|undefined|null} amount
 * @returns {string|number}
 */
export const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return 0;
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
