import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [hunts, setHunts] = useState([]);
  const [rawLog, setRawLog] = useState('');
  const [tcPrice, setTcPrice] = useState(40000);

  const fetchHunts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/hunts');
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
      await axios.post('http://localhost:5000/api/hunts', {
        log: rawLog, tc_price: tcPrice
      });
      setRawLog('');
      fetchHunts();
    } catch (error) {
      console.error("Erro ao registrar hunt:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta hunt? Os valores dos dashboards serão recalculados.")) {
      try {
        await axios.delete(`http://localhost:5000/api/hunts/${id}`);
        fetchHunts();
      } catch (error) {
        console.error("Erro ao excluir hunt:", error);
      }
    }
  };

  // Agrupa dados por Dia
  const huntsByDay = hunts.reduce((acc, hunt) => {
    const date = hunt.session_date;
    if (!acc[date]) acc[date] = { balance: 0, tc: 0, brl: 0, count: 0 };
    acc[date].balance += hunt.balance;
    acc[date].tc += hunt.tc_farmed;
    acc[date].brl += hunt.brl_value;
    acc[date].count += 1;
    return acc;
  }, {});

  // Agrupa dados por Mês
  const huntsByMonth = hunts.reduce((acc, hunt) => {
    const month = hunt.session_date.substring(0, 7); // "2026-07"
    if (!acc[month]) acc[month] = { balance: 0, tc: 0, brl: 0, count: 0 };
    acc[month].balance += hunt.balance;
    acc[month].tc += hunt.tc_farmed;
    acc[month].brl += hunt.brl_value;
    acc[month].count += 1;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
        Tibia Solo Tracker
      </h1>
      
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
            rows="6" placeholder="Cole o 'Session data' do Tibia aqui..." 
            value={rawLog} onChange={(e) => setRawLog(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: 'fit-content' }}>
            Registrar Sessão
          </button>
        </form>
      </div>

      {/* DASHBOARDS AGRUPADOS */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        
        {/* Tabela de Resumo Mensal */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ color: '#2c3e50', fontSize: '1.2rem' }}>💰 Resumo Mensal</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Mês</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Hunts</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Lucro</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Reais</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(huntsByMonth).map(([month, data]) => (
                <tr key={month}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{month}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.count}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: data.balance >= 0 ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                    {(data.balance / 1000000).toFixed(2)}kk
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>R$ {data.brl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabela de Resumo Diário */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ color: '#2c3e50', fontSize: '1.2rem' }}>📅 Resumo Diário</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Dia</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Hunts</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Lucro</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Reais</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(huntsByDay).map(([day, data]) => (
                <tr key={day}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{day}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.count}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: data.balance >= 0 ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                    {(data.balance / 1000000).toFixed(2)}kk
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>R$ {data.brl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTÓRICO COMPLETO */}
      <h2 style={{ color: '#2c3e50' }}>Últimas Hunts Registradas</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Data</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Tempo</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Lucro (gp)</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>TCs</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Reais (R$)</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {hunts.map(hunt => (
              <tr key={hunt.id} style={{ borderBottom: '1px solid #ddd', backgroundColor: '#fff' }}>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{hunt.session_date}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{hunt.session_time}h</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', color: hunt.balance >= 0 ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                  {hunt.balance.toLocaleString('pt-BR')} gp
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{hunt.tc_farmed.toFixed(2)}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>R$ {hunt.brl_value.toFixed(2)}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleDelete(hunt.id)}
                    style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
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