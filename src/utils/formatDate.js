const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

export const formatDay = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.getDate().toString().padStart(2, "0");
};

export const formatMonth = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return MONTHS[d.getMonth()];
};

export const formatFullDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
