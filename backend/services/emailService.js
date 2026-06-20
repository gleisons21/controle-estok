const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar transportador de email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Testar conexão
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erro ao conectar ao servidor de email:', error);
  } else {
    console.log('✅ Servidor de email conectado com sucesso');
  }
});

/**
 * Envia email de aviso de vencimento
 * @param {string} para - Email do destinatário
 * @param {string} nomeProduto - Nome do produto
 * @param {date} dataValidade - Data de validade
 * @param {number} diasParaVencer - Dias até o vencimento
 */
const enviarAvisoVencimento = async (para, nomeProduto, dataValidade, diasParaVencer, lote = '') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: para,
      subject: `⚠️ Aviso de Vencimento: ${nomeProduto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #FF6B6B; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">⚠️ Aviso de Vencimento</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Olá,</p>
            <p style="font-size: 14px; color: #666;">
              Um produto em seu estoque está próximo ao vencimento:
            </p>
            <div style="background-color: white; border-left: 4px solid #FF6B6B; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>📦 Produto:</strong> ${nomeProduto}</p>
              <p style="margin: 5px 0;"><strong>📅 Data de Validade:</strong> ${new Date(dataValidade).toLocaleDateString('pt-BR')}</p>
              <p style="margin: 5px 0;"><strong>⏰ Dias para Vencer:</strong> <span style="color: #FF6B6B; font-weight: bold;">${diasParaVencer} dia(s)</span></p>
              ${lote ? `<p style="margin: 5px 0;"><strong>🏷️ Lote:</strong> ${lote}</p>` : ''}
            </div>
            <p style="font-size: 14px; color: #666;">
              <strong>Ação Recomendada:</strong> Verifique seu estoque e tome as providências necessárias.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              Este é um aviso automático do sistema de Controle de Estoque.<br>
              Por favor, não responda este email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de aviso enviado para: ${para}`);
    return { sucesso: true, mensagem: 'Email enviado com sucesso' };
  } catch (error) {
    console.error(`❌ Erro ao enviar email:`, error);
    return { sucesso: false, erro: error.message };
  }
};

/**
 * Envia avisos para múltiplos produtos
 */
const enviarAvisosMultiplos = async (produtos) => {
  const resultados = [];
  
  for (const produto of produtos) {
    const resultado = await enviarAvisoVencimento(
      produto.email,
      produto.nome,
      produto.data_validade,
      produto.dias_para_vencer,
      produto.lote
    );
    resultados.push(resultado);
  }
  
  return resultados;
};

module.exports = {
  enviarAvisoVencimento,
  enviarAvisosMultiplos
};