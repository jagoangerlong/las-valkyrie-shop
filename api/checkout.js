/**
 * Vercel Serverless Function — Proxy ke Discord Webhook
 * Webhook URL disimpan di Environment Variable Vercel, aman dari frontend.
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return res.status(500).json({ error: "DISCORD_WEBHOOK_URL belum di-set di Vercel Environment Variables." });
  }

  try {
    const order = req.body;
    if (!order || !order.namaPemesan || !order.items || order.items.length === 0) {
      return res.status(400).json({ error: "Data order tidak lengkap." });
    }

    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const tanggal = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const blocks = order.items.map((item) => {
      return (
        `>>>>>${item.name}<<<<<\n` +
        `Jumlah Pesanan : ${item.qty}\n` +
        `Harga Per Item : $${item.price.toLocaleString("en-US")}\n` +
        `Jumlah Harga : $${item.subtotal.toLocaleString("en-US")}\n` +
        `================================================`
      );
    });

    let description = `Pesanan Atas Nama : ${order.namaPemesan}\n\n`;
    description += blocks.join("\n\n");
    description += `\n\nTotal Harga Pesanan : $${order.total.toLocaleString("en-US")}`;
    if (order.catatan) {
      description += `\n\nCatatan : ${order.catatan}`;
    }

    const payload = {
      username: "Las Valkyrie Resource Shop",
      embeds: [
        {
          title: "🛒 Pesanan Baru!",
          description: description,
          color: 0x8e44ad,
          footer: { text: `Pesanan dibuat pada: ${tanggal}` },
          timestamp: now.toISOString(),
        },
      ],
    };

    const discordRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok && discordRes.status !== 204) {
      throw new Error(`Discord error ${discordRes.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: err.message || "Gagal kirim ke Discord." });
  }
}
