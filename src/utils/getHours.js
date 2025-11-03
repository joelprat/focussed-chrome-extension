export default function getHours(date) {
  const hours = date.getHours();
  const formattedHours = hours.toString().padStart(2, "0");
  return formattedHours;
}
