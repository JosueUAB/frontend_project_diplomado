import axios from 'axios';

// Configurar la URL base para todas las peticiones
axios.defaults.baseURL = 'https://backend-project-diplomado.onrender.com/';

// Configurar headers por defecto
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios;