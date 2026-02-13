// ============================================================
// 🛍️ API Loja Crianças e Cia - Render + Neon (100% gratuito)
// Mercado Pago + WhatsApp + MySQL/PostgreSQL
// ============================================================

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const db = require("./lib/db");

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_URL = (process.env.STORE_URL || process.env.BASE_URL || "https://xn--crianaecia-s6a.store").replace(/\/$/, "");
const API_URL = (process.env.API_URL || STORE_URL).replace(/\/$/, "");
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;
const CALLMEBOT_TOKEN = process.env.CALLMEBOT_TOKEN;

// CORS
const ALLOWED_ORIGINS = [
  "https://xn--crianaecia-s6a.store",
  "http://localhost:5500",
  "http://localhost:3000",
  "https://sitefer-c2faa.web.app",
];
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.includes("ngrok") ||
    origin.includes("onrender.com") ||
    origin.includes("localhost") ||
    origin === "null"; // file:// local
  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", (origin && origin !== "null") ? origin : "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  next();
});

app.use(express.json());

// ============================================================
// ✅ Envia WhatsApp (CallMeBot)
// ============================================================
async function enviarMensagemWhatsAppPedido(pedido) {
  const itensFormatados = (pedido.itens || [])
    .map(
      (item) =>
        `• ${item.nome || "Produto"} — ${item.tamanho || "Sem tamanho"} (x${item.quantidade || 1}) — R$ ${Number(item.preco || 0).toFixed(2)}`
    )
    .join("\n");

  const mensagem = `
✅ *Novo Pedido Aprovado!*

👤 *Cliente:* ${pedido.nome || "Não informado"}
📧 *Email:* ${pedido.email || "Não informado"}
📞 *Telefone:* ${pedido.telefone || "Não informado"}
🏠 *Endereço:* ${pedido.endereco || "Não informado"}
💰 *Total:* R$ ${Number(pedido.total || 0).toFixed(2)}

🛍️ *Itens:*
${itensFormatados}

🏪 *Loja:* Crianças e Cia 👕✨
🕓 *Status:* Pagamento aprovado!
`.trim();

  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(mensagem)}&apikey=${CALLMEBOT_TOKEN}`;
  await axios.get(url);
  console.log("✅ WhatsApp enviado com sucesso!");
}

// ============================================================
// 💰 Cria preferência no Mercado Pago
// ============================================================
app.post("/api/mpCriaPreferencia", async (req, res) => {
  try {
    const {
      descricao,
      total,
      subtotal,
      desconto,
      cupom,
      frete,
      nome,
      email,
      telefone,
      endereco,
      itens,
      userId,
    } = req.body;

    if (!descricao || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: "Dados inválidos: descrição/itens obrigatórios" });
    }

    const totalNumber = Number(total || 0);
    if (!isFinite(totalNumber) || totalNumber <= 0) {
      return res.status(400).json({ error: "Total inválido. Envie um número > 0" });
    }

    const orderId = uuidv4();
    const subtotalItens = subtotal
      ? Number(subtotal)
      : itens.reduce((sum, item) => sum + Number(item.preco || 0) * Number(item.quantidade || 1), 0);
    const freteNumber = Number(frete || 0);
    const descontoNumber = Number(desconto || 0);
    const cupomCode = cupom || null;

    const itemsMP = itens.map((item) => ({
      title: item.nome || "Produto sem nome",
      quantity: Number(item.quantidade || 1),
      unit_price: Number(item.preco || 0),
      currency_id: "BRL",
    }));

    if (freteNumber > 0) {
      itemsMP.push({ title: "Frete", quantity: 1, unit_price: freteNumber, currency_id: "BRL" });
    }
    if (descontoNumber > 0 && cupomCode) {
      itemsMP.push({
        title: `Desconto (Cupom: ${cupomCode})`,
        quantity: 1,
        unit_price: -descontoNumber,
        currency_id: "BRL",
      });
    }

    const notificationUrl = `${API_URL}/api/whatsappNotification`;
    const preference = {
      items: itemsMP,
      payer: { name: nome || "", email: email || "cliente@exemplo.com" },
      external_reference: orderId,
      notification_url: notificationUrl,
      back_urls: {
        success: `${STORE_URL}/sucesso.html`,
        failure: `${STORE_URL}/erro.html`,
        pending: `${STORE_URL}/pendente.html`,
      },
      auto_return: "approved",
    };

    const mpResp = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preference,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const initPoint = mpResp?.data?.init_point;
    if (!initPoint) {
      throw new Error("Mercado Pago não retornou init_point");
    }

    const pedidoSeguro = {
      order_id: orderId,
      user_id: userId || null,
      descricao: descricao || "",
      subtotal: subtotalItens,
      desconto: descontoNumber,
      cupom: cupomCode,
      total: totalNumber,
      frete: freteNumber,
      nome: nome || "",
      email: email || "",
      telefone: telefone || "Não informado",
      endereco: endereco || "",
      itens: JSON.stringify(
        (Array.isArray(itens) ? itens : []).map((i) => ({
          id: i.id || null,
          nome: i.nome || "Produto",
          tamanho: i.tamanho || "Sem tamanho",
          quantidade: Number(i.quantidade || 1),
          preco: Number(i.preco || 0),
        }))
      ),
      preference_id: mpResp.data.id || null,
      payment_id: null,
      status: "pendente",
    };

    await db.execute(
      `INSERT INTO pedidos (order_id, user_id, descricao, subtotal, desconto, cupom, total, frete, nome, email, telefone, endereco, itens, preference_id, payment_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedidoSeguro.order_id,
        pedidoSeguro.user_id,
        pedidoSeguro.descricao,
        pedidoSeguro.subtotal,
        pedidoSeguro.desconto,
        pedidoSeguro.cupom,
        pedidoSeguro.total,
        pedidoSeguro.frete,
        pedidoSeguro.nome,
        pedidoSeguro.email,
        pedidoSeguro.telefone,
        pedidoSeguro.endereco,
        pedidoSeguro.itens,
        pedidoSeguro.preference_id,
        pedidoSeguro.payment_id,
        pedidoSeguro.status,
      ]
    );

    // Atualiza estoque (se tabela products existir)
    const itensArray = JSON.parse(pedidoSeguro.itens);
    for (const item of itensArray) {
      try {
        if (item.id) {
          const [rows] = await db.execute(
            "SELECT stock FROM products WHERE id = ?",
            [item.id]
          );
          if (rows.length > 0) {
            const estoqueAtual = rows[0].stock || 0;
            const novoEstoque = Math.max(estoqueAtual - item.quantidade, 0);
            await db.execute("UPDATE products SET stock = ? WHERE id = ?", [
              novoEstoque,
              item.id,
            ]);
            console.log(`📦 Estoque atualizado ${item.nome}: ${estoqueAtual} → ${novoEstoque}`);
            continue;
          }
        }
        const [rows] = await db.execute(
          "SELECT id, stock FROM products WHERE name = ? LIMIT 1",
          [item.nome]
        );
        if (rows.length > 0) {
          const estoqueAtual = rows[0].stock || 0;
          const novoEstoque = Math.max(estoqueAtual - item.quantidade, 0);
          await db.execute("UPDATE products SET stock = ? WHERE id = ?", [
            novoEstoque,
            rows[0].id,
          ]);
          console.log(`📦 Estoque atualizado ${item.nome}: ${estoqueAtual} → ${novoEstoque}`);
        }
      } catch (err) {
        console.warn(`⚠️ Produto não encontrado ou erro estoque: ${item.nome}`);
      }
    }

    console.log("✅ Preferência criada:", initPoint, "orderId:", orderId);
    return res.status(200).json({ init_point: initPoint });
  } catch (error) {
    console.error("❌ Erro ao criar preferência:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Erro ao criar preferência",
      details: error.response?.data || error.message,
    });
  }
});

// ============================================================
// 🔔 Webhook do Mercado Pago
// ============================================================
app.post("/api/whatsappNotification", async (req, res) => {
  try {
    const { type, data } = req.body || {};
    if (type !== "payment" || !data?.id) {
      return res.status(200).send("OK");
    }

    const paymentId = data.id;
    const mpPay = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    const pagamento = mpPay.data;
    const status = pagamento?.status || "unknown";
    const orderId = pagamento?.external_reference;

    if (status !== "approved") {
      return res.status(200).send("Aguardando aprovação...");
    }

    if (!orderId) {
      return res.status(400).send("Pagamento sem external_reference");
    }

    const [rows] = await db.execute("SELECT * FROM pedidos WHERE order_id = ?", [orderId]);
    if (rows.length === 0) {
      return res.status(404).send("Pedido não encontrado.");
    }

    const pedido = rows[0];
    pedido.itens = typeof pedido.itens === "string" ? JSON.parse(pedido.itens) : pedido.itens;

    await db.execute(
      "UPDATE pedidos SET payment_id = ?, status = 'aprovado', atualizado_em = NOW() WHERE order_id = ?",
      [paymentId, orderId]
    );

    await enviarMensagemWhatsAppPedido(pedido);
    return res.status(200).send("✅ Mensagem enviada com sucesso!");
  } catch (error) {
    console.error("❌ Erro no webhook:", error.message);
    return res.status(500).json({ error: "Erro no webhook", detalhes: error.message });
  }
});

// ============================================================
// 📱 Envia encomenda pelo WhatsApp
// ============================================================
app.get("/health", (req, res) => res.json({ ok: true, msg: "API Loja Crianças e Cia" }));
app.get("/api/health", (req, res) => res.json({ ok: true, msg: "API Loja Crianças e Cia" }));

app.post("/api/enviarEncomenda", async (req, res) => {
  try {
    const { nome, email, telefone, descricao } = req.body;
    if (!nome || !email || !telefone || !descricao) {
      return res.status(400).json({
        error: "Dados incompletos: nome, email, telefone e descrição são obrigatórios",
      });
    }

    const mensagem = `🛍️ *Nova Encomenda Especial*\n\n` +
      `👤 *Nome:* ${nome}\n📧 *Email:* ${email}\n📞 *Telefone/WhatsApp:* ${telefone}\n\n` +
      `📝 *Descrição do Pedido:*\n${descricao}\n\n🏪 *Loja:* Crianças e Cia 👕✨`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(mensagem)}&apikey=${CALLMEBOT_TOKEN}`;
    await axios.get(url);

    return res.status(200).json({ success: true, message: "Encomenda enviada com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao enviar encomenda:", error.message);
    return res.status(500).json({ error: "Erro ao enviar encomenda", details: error.message });
  }
});

// ============================================================
// Inicia servidor
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log(`   API: ${API_URL} | Loja: ${STORE_URL}`);
  console.log(`   Endpoints: /mpCriaPreferencia, /whatsappNotification, /enviarEncomenda`);
});
