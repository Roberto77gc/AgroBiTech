export function useAuthFetch() {
  const token = localStorage.getItem('token');
  return (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': 'Bearer ' + token
      }
    });
  };
}
