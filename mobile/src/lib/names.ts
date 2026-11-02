/** "deepak.bhat@example.com" becomes "Deepak Bhat"; names that are not emails are left alone. */
export function displayName(user: string | null): string {
  if (!user) return '';
  if (!user.includes('@')) return user;
  return user
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  return hour < 17 ? 'Good afternoon' : 'Good evening';
}
