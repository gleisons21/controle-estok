const nodemailer = require('nodemailer');
const pool = require('../config/database');
require('dotenv').config();

let transporter;

// Inicializar transportador de email
const inicializarTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 4000,
        rateLimit: 14
      }
    });

    // Testar conexão
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Erro ao conectar ao servidor de email:', error.message);
      } else {
        console.log('✅ Servidor de email conectado com sucesso');
      }
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar transportador:', error);
  }
};

// Inicializar ao carregar o módulo
inicializarTransporter();

/**
 * Adiciona email à fila
 */
const adicionarAFila = async (destinatario, assunto, corpoHtml, tipo = 'geral', referenciaId = null) => {
  try {
    const query = `
      INSERT INTO fila_emails (destinatario, assunto, corpo_html, tipo, referencia_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const resultado = await pool.query(query, [
      destinatario,
      assunto,
      corpoHtml,
      tipo,
      referenciaId
    ]);

    console.log(`✅ Email adicionado à fila: ${resultado.rows[0].id}`);
    return { sucesso: true, filaId: resultado.rows[0].id };
  } catch (error) {
    console.error('❌ Erro ao adicionar email à fila:', error);
    return { sucesso: false, erro: error.message };
  }
};

/**
 * Processa fila de emails
 */
const processarFila = async () => {
  try {
    // Buscar emails pendentes ou com retry
    const query = `
      SELECT * FROM fila_emails
      WHERE 
        (status = 'pendente' OR status = 'erro')
        AND proxima_tentativa <= CURRENT_TIMESTAMP
        AND tentativas < max_tentativas
      ORDER BY criado_em ASC
      LIMIT 10
    `;

    const resultado = await pool.query(query);
    const emails = resultado.rows;

    if (emails.length === 0) {
      console.log('✅ Nenhum email na fila para processar');
      return { processados: 0, sucesso: 0, erro: 0 };
    }

    console.log(`📧 Processando ${emails.length} email(s) da fila...`);

    let sucessos = 0;
    let erros = 0;

    for (const email of emails) {
      try {
        // Atualizar status para 'enviando'
        await atualizarStatusFila(email.id, 'enviando');

        // Tentar enviar
        const resultadoEnvio = await enviarEmailDireto(
          email.destinatario,
          email.assunto,
          email.corpo_html
        );

        if (resultadoEnvio.sucesso) {
          // Email enviado com sucesso
          await atualizarStatusFila(email.id, 'enviado');
          await registrarLogEmail(email.id, email.destinatario, email.assunto, 'enviado', null, null, email.tentativas + 1);
          sucessos++;
          console.log(`✅ Email enviado: ${email.destinatario}`);
        } else {
          throw new Error(resultadoEnvio.erro || 'Erro desconhecido');
        }
      } catch (error) {
        erros++;
        const novasTentativas = email.tentativas + 1;
        const proximaTentativa = calcularProximaTentativa(novasTentativas);

        if (novasTentativas >= email.max_tentativas) {
          // Falha permanente
          await atualizarStatusFila(email.id, 'falha_permanente', error.message);
          console.log(`❌ Email falhou permanentemente após ${novasTentativas} tentativas: ${email.destinatario}`);
        } else {
          // Tentar novamente
          await atualizarStatusFilaComRetry(email.id, novasTentativas, proximaTentativa, error.message);
          console.log(`⚠️  Email agendado para retry em ${proximaTentativa}: ${email.destinatario}`);
        }

        await registrarLogEmail(email.id, email.destinatario, email.assunto, 'erro', 'ENVIO_FALHOU', error.message, novasTentativas);
      }
    }

    console.log(`\n📊 Resumo: ${sucessos} enviado(s), ${erros} erro(s)\n`);
    return { processados: emails.length, sucesso: sucessos, erro: erros };
  } catch (error) {
    console.error('❌ Erro ao processar fila:', error);
    return { processados: 0, sucesso: 0, erro: 0 };
  }
};

/**
 * Envia email direto
 */
const enviarEmailDireto = async (para, assunto, corpoHtml) => {
  return new Promise((resolve) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: para,
      subject: assunto,
      html: corpoHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        resolve({ sucesso: false, erro: error.message });
      } else {
        resolve({ sucesso: true, id: info.messageId });
      }
    });
  });
};

/**
 * Calcula próxima tentativa (backoff exponencial)
 */
const calcularProximaTentativa = (tentativas) => {
  const delay = Math.min(Math.pow(2, tentativas) * 60, 86400); // Máximo 24 horas
  const proximaTentativa = new Date(Date.now() + delay * 1000);
  return proximaTentativa;
};

/**
 * Atualiza status da fila
 */
const atualizarStatusFila = async (filaId, status, erro = null) => {
  try {
    let query;
    let params;

    if (status === 'enviado') {
      query = `
        UPDATE fila_emails 
        SET status = $1, enviado_em = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      params = [status, filaId];
    } else {
      query = `
        UPDATE fila_emails 
        SET status = $1, erro_mensagem = $2
        WHERE id = $3
      `;
      params = [status, erro, filaId];
    }

    await pool.query(query, params);
  } catch (error) {
    console.error('Erro ao atualizar status da fila:', error);
  }
};

/**
 * Atualiza status com retry
 */
const atualizarStatusFilaComRetry = async (filaId, tentativas, proximaTentativa, erro) => {
  try {
    const query = `
      UPDATE fila_emails 
      SET status = 'erro', tentativas = $1, proxima_tentativa = $2, erro_mensagem = $3
      WHERE id = $4
    `;

    await pool.query(query, [tentativas, proximaTentativa, erro, filaId]);
  } catch (error) {
    console.error('Erro ao atualizar retry:', error);
  }
};

/**
 * Registra log de email
 */
const registrarLogEmail = async (filaId, destinatario, assunto, status, codigoErro = null, mensagemErro = null, tentativa = 1) => {
  try {
    const query = `
      INSERT INTO log_emails 
      (fila_email_id, destinatario, assunto, status, codigo_erro, mensagem_erro, tentativa_numero)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await pool.query(query, [filaId, destinatario, assunto, status, codigoErro, mensagemErro, tentativa]);
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

/**
 * Busca status da fila
 */
const obterStatusFila = async () => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as quantidade
      FROM fila_emails
      GROUP BY status
    `;

    const resultado = await pool.query(query);
    return resultado.rows;
  } catch (error) {
    console.error('Erro ao obter status:', error);
    return [];
  }
};

/**
 * Busca logs de emails
 */
const obterLogsEmails = async (limite = 50) => {
  try {
    const query = `
      SELECT * FROM log_emails
      ORDER BY enviado_em DESC
      LIMIT $1
    `;

    const resultado = await pool.query(query, [limite]);
    return resultado.rows;
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    return [];
  }
};

module.exports = {
  adicionarAFila,
  processarFila,
  enviarEmailDireto,
  obterStatusFila,
  obterLogsEmails,
  inicializarTransporter
};