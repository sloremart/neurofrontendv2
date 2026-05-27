export const getToken = () => {
    return localStorage.getItem('token');
  };
  
  // Función para guardar el token en localStorage
  export const saveToken = (token) => {
    localStorage.setItem('token', token);
  };
  
  // Función para eliminar el token de localStorage (por ejemplo, al cerrar sesión)
  export const removeToken = () => {
    localStorage.removeItem('token');
  };