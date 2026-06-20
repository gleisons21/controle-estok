import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>📦 Controle de Estoque</h1>
        <p>Bem-vindo ao sistema de controle de estoque</p>
      </header>
      <main>
        <p>Módulos disponíveis:</p>
        <ul>
          <li>Gerenciamento de Produtos</li>
          <li>Controle de Entrada e Saída</li>
          <li>Relatórios</li>
          <li>Alertas de Estoque Baixo</li>
        </ul>
      </main>
    </div>
  );
}

export default App;