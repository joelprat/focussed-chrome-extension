export default function getHoursBetween(currentHour, targetHour) {
  const result = [];
  let hour = Number(currentHour);

  while (true) {
    result.push(hour.toString().padStart(2, "0"));
    if (hour === Number(targetHour)) break;

    hour = (hour + 1) % 24;
  }

  return result;
}
