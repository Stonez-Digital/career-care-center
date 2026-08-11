(function () {
  try {
    var savedTheme = globalThis.localStorage.getItem('ccc-theme');
    var prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : (prefersDark ? 'dark' : 'light');
    globalThis.document.documentElement.classList.toggle('dark', theme === 'dark');
    globalThis.document.documentElement.style.colorScheme = theme;
  } catch {
    // The application provider will apply the default if storage is unavailable.
  }
})();
