import axios from 'axios';

// Configurar la URL base para todas las peticiones
axios.defaults.baseURL = 'http://localhost:3000';

// Configurar headers por defecto
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios;