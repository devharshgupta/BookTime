export function GetSecondsForDateFromNow(dateString: string): number {
  // Create a Date object from the provided date string
  const date = new Date(dateString);
  date.setHours(23, 59, 59, 999);

  // Get the current time in milliseconds
  const now = new Date();

  if (now.getTime() > date.getTime()) {
    return 0;
  }

  // Calculate the difference in milliseconds between the provided date and now
  const diffInMilliseconds = date.getTime() - now.getTime();

  // Convert the difference in milliseconds to seconds
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);

  // Return the number of seconds
  return diffInSeconds;
}

export function addDaysToDate(date: Date, days: number): Date {
  const newDate = new Date(date.getTime()); // Clone the date object
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
