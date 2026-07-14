import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [hunts, setHunts] = useState([]);
  const [rawLog, setRawLog] = useState('');
  const [tcPrice, setTcPrice] = useState(40000);

  const fetchHunts = async () => {
    try {
      const res = await axios.get('/api/hunts');
      setHunts(res.data);
    } catch (error) {
      console.error("Erro ao buscar hunts:", error);
    }
  };

  useEffect(() => { fetchHunts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawLog.trim()) return;

    try {
      await axios.post('/api/hunts', {
        log: rawLog, tc_price: tcPrice
      });
      setRawLog('');
      fetchHunts();
    } catch (error) {
      console.error("Erro ao registrar hunt:", error);
      alert("Erro ao registrar! Verifique o log.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Excluir esta hunt?")) {
      try {
        await axios.delete(`/api/hunts/${id}`);
        fetchHunts();
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  // Cálculos Totais
  const lucroTotal = hunts.reduce((acc, hunt) => acc + hunt.balance, 0);
  const valorTotalBrl = hunts.reduce((acc, hunt) => acc + hunt.brl_value, 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
        Tibia Solo Tracker
      </h1>

      {/* Card de Lucro Acumulado */}
      <div style={{ 
        display: 'flex', gap: '40px', marginBottom: '30px', 
        backgroundColor: '#2c3e50', padding: '20px', borderRadius: '8px', color: 'white' 
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Lucro Acumulado</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#27ae60' }}>{(lucroTotal / 1000000).toFixed(2)} kk</h2>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Total em Reais (estimado)</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#f1c40f' }}>R$ {valorTotalBrl.toFixed(2)}</h2>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>Cotação atual do TC: </label>
            <input 
              type="number" value={tcPrice} onChange={(e) => setTcPrice(Number(e.target.value))} 
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <textarea 
            rows="4" placeholder="Cole o 'Session data' do Tibia aqui..." 
            value={rawLog} onChange={(e) => setRawLog(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Registrar Sessão
          </button>
        </form>
      </div>

      <h2>Histórico de Hunts</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
              <th style={{ padding: '12px' }}>Data</th>
              <th style={{ padding: '12px' }}>Lucro</th>
              <th style={{ padding: '12px' }}>R$</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {hunts.map(hunt => (
              <tr key={hunt.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{hunt.session_date}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: hunt.balance >= 0 ? '#27ae60' : '#c0392b' }}>
                  {(hunt.balance / 1000).toLocaleString()}k
                </td>
                <td style={{ padding: '12px' }}>R$ {hunt.brl_value.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(hunt.id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;