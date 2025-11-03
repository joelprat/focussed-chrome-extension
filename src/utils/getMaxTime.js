export default function getMaxTime(date) {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + 5);
  return newDate;
}
