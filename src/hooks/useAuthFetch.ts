export function useAuthFetch() {
  return (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token'); // lee el token en cada petición
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': 'Bearer ' + token
      }
    });
  };
}
