import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Conectando al backend...');
  const [data, setData] = useState(null);

  useEffect(() => {
    // Vite inyecta las variables de entorno a través de import.meta.env
    const apiUrl = import.meta.env.VITE_API_URL;
    
    console.log("Intentando conectar a:", apiUrl);

    // Hacemos una petición a la cartelera de clases (operations/classes)
    fetch(`${apiUrl}/operations/classes`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(backendData => {
        console.log("Datos recibidos del backend:", backendData);
        setStatus('¡Conexión Exitosa! ✅');
        setData(backendData);
      })
      .catch(error => {
        console.error("Error de conexión o CORS:", error);
        setStatus('Error de conexión ❌. Revisa la consola.');
      });
  }, []);

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>GYMSAAS - Prueba de Comunicación</h1>
      <h2>{status}</h2>
      
      {data && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '8px', display: 'inline-block' }}>
          <p>Se encontraron <strong>{data.length}</strong> clases programadas en la base de datos.</p>
          <p>(Abre la consola del navegador para ver el Array completo)</p>
        </div>
      )}
    </div>
  );
}

export default App;