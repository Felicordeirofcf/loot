import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [hunts, setHunts] = useState([]);
  const [rawLog, setRawLog] = useState('');
  const [tcPrice, setTcPrice] = useState(40000);
  const [activeTab, setActiveTab] = useState('mensal'); // 'diario', 'mensal', 'anual'

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
      // O backend continua salvando o log bruto e o saldo em gold
      await axios.post('/api/hunts', { log: rawLog, tc_price: tcPrice });
      setRawLog('');
      fetchHunts();
    } catch (error) {
      console.error("Erro ao registrar hunt:", error);
      alert("Erro ao registrar! Verifique o log.");
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

  // CÁLCULO DINÂMICO BASEADO NA COTAÇÃO ATUAL DIGITADA
  // Cada hunt calcula seu TC e seu valor em Reais usando o 'tcPrice' do input em tempo real
  const processedHunts = hunts.map(hunt => {
    const tcFarmed = hunt.balance / (tcPrice > 0 ? tcPrice : 40000);
    const brlValue = tcFarmed * (51 / 250); // Mantém a proporção de conversão em BRL
    return {
      ...hunt,
      tc_farmed: tcFarmed,
      brl_value: brlValue
    };
  });

  // Totais globais dinâmicos
  const lucroTotal = processedHunts.reduce((acc, hunt) => acc + hunt.balance, 0);
  const tcTotal = processedHunts.reduce((acc, hunt) => acc + hunt.tc_farmed, 0);
  const brlTotal = processedHunts.reduce((acc, hunt) => acc + hunt.brl_value, 0);

  // Filtros agrupados dinâmicos
  const huntsGrouped = processedHunts.reduce((acc, hunt) => {
    const dateStr = hunt.session_date || '2026-01-01';
    let key = dateStr;
    if (activeTab === 'mensal') key = dateStr.substring(0, 7);
    if (activeTab === 'anual') key = dateStr.substring(0, 4);

    if (!acc[key]) acc[key] = { balance: 0, tc: 0, brl: 0, count: 0 };
    acc[key].balance += hunt.balance;
    acc[key].tc += hunt.tc_farmed;
    acc[key].brl += hunt.brl_value;
    acc[key].count += 1;
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#0f1115', color: '#e1e1e6', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Cabeçalho */}
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ color: '#00b4d8', fontSize: '2.5rem', margin: '0 0 10px 0', letterSpacing: '1px' }}>
            ⚔️ Tibia Solo Tracker
          </h1>
          <p style={{ color: '#8c95a1', margin: 0 }}>Painel avançado com cálculo de cotação em tempo real</p>
        </header>

        {/* Cards de Métricas Totais Dinâmicas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #2ecc71' }}>
            <span style={{ color: '#8c95a1', fontSize: '0.85rem' }}>LUCRO TOTAL (GOLD)</span>
            <h2 style={{ color: '#2ecc71', margin: '8px 0 0 0', fontSize: '1.5rem' }}>{(lucroTotal / 1000000).toFixed(2)} kk</h2>
          </div>
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #3498db' }}>
            <span style={{ color: '#8c95a1', fontSize: '0.85rem' }}>TIBIA COINS TOTAIS</span>
            <h2 style={{ color: '#3498db', margin: '8px 0 0 0', fontSize: '1.5rem' }}>{tcTotal.toFixed(1)} TC</h2>
          </div>
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #f1c40f' }}>
            <span style={{ color: '#8c95a1', fontSize: '0.85rem' }}>VALOR TOTAL (R$)</span>
            <h2 style={{ color: '#f1c40f', margin: '8px 0 0 0', fontSize: '1.5rem' }}>R$ {brlTotal.toFixed(2)}</h2>
          </div>
        </div>

        {/* Formulário de Cadastro e Cotação Dinâmica */}
        <div style={{ backgroundColor: '#161b22', padding: '25px', borderRadius: '10px', marginBottom: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#c9d1d9' }}>Registrar Nova Sessão</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#00b4d8', fontWeight: 'bold' }}>
                ⚡ Cotação atual do TC (Altere aqui para recalcular tudo instantaneamente):
              </label>
              <input 
                type="number" 
                value={tcPrice} 
                onChange={(e) => setTcPrice(Number(e.target.value))} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #00b4d8', backgroundColor: '#0d1117', color: 'white', width: '220px', fontWeight: 'bold', fontSize: '1rem' }}
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

        {/* Seção de Filtros e Resumo Agrupado Dinâmico */}
        <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #30363d', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ color: '#c9d1d9', margin: 0 }}>📊 Resumo Analítico (Dinâmico)</h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['diario', 'mensal', 'anual'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    backgroundColor: activeTab === tab ? '#00b4d8' : '#21262d',
                    color: activeTab === tab ? '#0f1115' : '#8c95a1',
                    border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#21262d', color: '#8c95a1', fontSize: '0.85rem', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px' }}>Período ({activeTab})</th>
                  <th style={{ padding: '10px' }}>Qtd. Hunts</th>
                  <th style={{ padding: '10px' }}>Lucro (Gold)</th>
                  <th style={{ padding: '10px' }}>Tibia Coins</th>
                  <th style={{ padding: '10px' }}>Reais (R$)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(huntsGrouped).map(([key, data]) => (
                  <tr key={key} style={{ borderBottom: '1px solid #30363d' }}>
                    <td style={{ padding: '10px' }}>{key}</td>
                    <td style={{ padding: '10px' }}>{data.count}</td>
                    <td style={{ padding: '10px', color: '#2ecc71', fontWeight: 'bold' }}>{(data.balance / 1000000).toFixed(2)} kk</td>
                    <td style={{ padding: '10px', color: '#3498db' }}>{data.tc.toFixed(1)} TC</td>
                    <td style={{ padding: '10px' }}>R$ {data.brl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histórico Detalhado */}
        <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ color: '#c9d1d9', borderBottom: '2px solid #30363d', paddingBottom: '8px', marginTop: 0 }}>📋 Histórico Detalhado</h3>
          <p style={{ color: '#8c95a1', fontSize: '0.85rem' }}>Os valores em TCs e Reais mudam na hora conforme você mexe na cotação lá em cima.</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#21262d', color: '#8c95a1', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px' }}>Data</th>
                  <th style={{ padding: '12px' }}>Tempo</th>
                  <th style={{ padding: '12px' }}>Lucro (gp)</th>
                  <th style={{ padding: '12px' }}>TCs (Dinâmico)</th>
                  <th style={{ padding: '12px' }}>Reais (R$)</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {processedHunts.map(hunt => (
                  <tr key={hunt.id} style={{ borderBottom: '1px solid #30363d' }}>
                    <td style={{ padding: '12px' }}>{hunt.session_date}</td>
                    <td style={{ padding: '12px' }}>{hunt.session_time}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: hunt.balance >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      {(hunt.balance / 1000).toLocaleString()}k
                    </td>
                    <td style={{ padding: '12px', color: '#3498db' }}>{hunt.tc_farmed.toFixed(1)}</td>
                    <td style={{ padding: '12px' }}>R$ {hunt.brl_value.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(hunt.id)} style={{ backgroundColor: '#da3633', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;