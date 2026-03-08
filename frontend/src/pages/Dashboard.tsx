import { useEffect, useState } from 'react';
import api from '../services/api';
interface CloudTask {
  id: number;
  name: string;
  isCompleted: boolean;
}
const Dashboard = () => {
  const [items, setItems] = useState<CloudTask[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get('/tasks')
      .then((res: any) => {
        setItems(res.data);
      })
      .catch((err: any) => {
        console.error("Szczegóły błędu:", err);
        setError("Błąd połączenia z API. Sprawdź, czy kontener cloud-backend działa na porcie 8081.");
      });
  }, []);
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>☁️ Cloud App Dashboard</h1>
      {error && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '5px', margin: '20px auto', maxWidth: '400px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {items.length === 0 && !error && <p>Brak zadań w bazie. Dodaj coś przez Swaggera (http://localhost:8081)!</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li key={item.id} style={{
              background: '#f8f9fa',
              margin: '5px',
              padding: '10px 20px',
              borderRadius: '8px',
              borderLeft: item.isCompleted ? '5px solid green' : '5px solid gray',
              width: '350px',
              textAlign: 'left'
            }}>
              <strong>{item.name}</strong> {item.isCompleted ? '✅' : '⏳'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;