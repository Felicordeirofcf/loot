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
      await axios.post('/api/hunts', { log: rawLog, tc_price: tcPrice });
      setRawLog('');
      fetchHunts();
    } catch (error) {
      console.error("Erro ao registrar hunt:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir esta hunt?")) {
      try {
        await axios.delete(`/api/hunts/${id}`);
        fetchHunts();
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  const huntsByMonth = hunts.reduce((acc, hunt) => {
    const month = hunt.session_date.substring(0, 7);
    if (!acc[month]) acc[month] = { balance: 0, tc: 0, brl: 0, count: 0 };
    acc[month].balance += hunt.balance;
    acc[month].brl += hunt.brl_value;
    acc[month].count += 1;
    return acc;
  }, {});

  const huntsByDay = hunts.reduce((acc, hunt) => {
    const date = hunt.session_date;
    if (!acc[date]) acc[date] = { balance: 0, brl: 0, count: 0 };
    acc[date].balance += hunt.balance;
    acc[date].brl += hunt.brl_value;
    acc[date].count += 1;
    return acc;
  }, {});

  const lucroTotal = hunts.reduce((acc, hunt) => acc + hunt.balance, 0);
  const brlTotal = hunts.reduce((acc, hunt) => acc + hunt.brl_value, 0);

  return (
    <div style={{ 
      backgroundColor: '#0f1115', color: '#e1e1e6', minHeight: '100vh', 
      fontFamily: 'Segoe UI, sans-serif', padding: '40px 20px' 
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Cabeçalho */}
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ color: '#00b4d8', fontSize: '2.5rem', margin: '0 0 10px 0', letterSpacing: '1px' }}>
            ⚔️ Tibia Solo Tracker
          </h1>
          <p style={{ color: '#8c95a1', margin: 0 }}>Gerenciador de rendimento e lucro de hunts na nuvem</p>
        </header>

        {/* Cards de Métricas Totais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #2ecc71' }}>
            <span style={{ color: '#8c95a1', fontSize: '0.85rem' }}>LUCRO TOTAL ACUMULADO</span>
            <h2 style={{ color: '#2ecc71', margin: '8px 0 0 0', fontSize: '1.8rem' }}>{(lucroTotal / 1000000).toFixed(2)} kk</h2>
          </div>
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #f1c40f' }}>
            <span style={{ color: '#8c95a1', fontSize: '0.85rem' }}>VALOR TOTAL ESTIMADO</span>
            <h2 style={{ color: '#f1c40f', margin: '8px 0 0 0', fontSize: '1.8rem' }}>R$ {brlTotal.toFixed(2)}</h2>
          </div>
        </div>

        {/* Formulário de Cadastro */}
        <div style={{ backgroundColor: '#161b22', padding: '25px', borderRadius: '10px', marginBottom: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#c9d1d9' }}>Registrar Nova Sessão</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#8c95a1' }}>Cotação atual do TC (gp):</label>
              <input 
                type="number" value={tcPrice} onChange={(e) => setTcPrice(Number(e.target.value))} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px alt #30363d', backgroundColor: '#0d1117', color: 'white', width: '200px' }}
              />
            </div>
            <textarea 
              rows="4" placeholder="Cole o 'Session data' do Tibia aqui..." 
              value={rawLog} onChange={(e) => setRawLog(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: 'white', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#00b4d8', color: '#0f1115', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', width: 'fit-content' }}>
              Salvar Sessão
            </button>
          </form>
        </div>

        {/* Tabelas de Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          {/* Mensal */}
          <div>
            <h3 style={{ color: '#c9d1d9', borderBottom: '2px solid #30363d', paddingBottom: '8px' }}>💰 Resumo Mensal</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#21262d', color: '#8c95a1', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px' }}>Mês</th>
                    <th style={{ padding: '10px' }}>Hunts</th>
                    <th style={{ padding: '10px' }}>Lucro</th>
                    <th style={{ padding: '10px' }}>Reais</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(huntsByMonth).map(([month, data]) => (
                    <tr key={month} style={{ borderBottom: '1px solid #30363d' }}>
                      <td style={{ padding: '10px' }}>{month}</td>
                      <td style={{ padding: '10px' }}>{data.count}</td>
                      <td style={{ padding: '10px', color: '#2ecc71', fontWeight: 'bold' }}>{(data.balance / 1000000).toFixed(2)}kk</td>
                      <td style={{ padding: '10px' }}>R$ {data.brl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diário */}
          <div>
            <h3 style={{ color: '#c9d1d9', borderBottom: '2px solid #30363d', paddingBottom: '8px' }}>📅 Resumo Diário</h3>
            <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#21262d', color: '#8c95a1', fontSize: '0.85rem', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px' }}>Dia</th>
                    <th style={{ padding: '10px' }}>Hunts</th>
                    <th style={{ padding: '10px' }}>Lucro</th>
                    <th style={{ padding: '10px' }}>Reais</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(huntsByDay).map(([day, data]) => (
                    <tr key={day} style={{ borderBottom: '1px solid #30363d' }}>
                      <td style={{ padding: '10px' }}>{day}</td>
                      <td style={{ padding: '10px' }}>{data.count}</td>
                      <td style={{ padding: '10px', color: '#2ecc71', fontWeight: 'bold' }}>{(data.balance / 1000000).toFixed(2)}kk</td>
                      <td style={{ padding: '10px' }}>R$ {data.brl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;