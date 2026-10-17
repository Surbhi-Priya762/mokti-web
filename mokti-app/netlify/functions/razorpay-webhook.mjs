// Razorpay calls this after every successful payment.
// payment_page.paid is the event to subscribe to: it is the only one that says which
// Payment Page (pl_...) was paid. order.paid and payment.captured still work as a fallback.
// It works out which ebook was bought and emails the PDF to the buyer through Resend.
//
// Netlify environment variables it needs:
//   RAZORPAY_WEBHOOK_SECRET  the secret typed when creating the webhook in Razorpay
//   RESEND_API_KEY           from resend.com > API Keys
//   FROM_EMAIL               optional, defaults to "Surbhi Priya <hello@mokti.in>"
//   OWNER_EMAIL              optional, defaults to surbhi7priya@gmail.com (replies + problem alerts)
//   PDF_...                  one Google Drive share link per PDF, see netlify/lib/products.mjs

import crypto from "node:crypto";
import { FILE_NAMES, findProduct } from "../lib/products.mjs";

const OWNER_EMAIL = process.env.OWNER_EMAIL || "surbhi7priya@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "Surbhi Priya <hello@mokti.in>";
// Resend allows 40 MB per email after encoding; stay well under it.
const MAX_ATTACH_BYTES = 25 * 1024 * 1024;

export const config = { path: "/api/razorpay-webhook" };

export default async (req) => {
  if (req.method !== "POST") return new Response("ok");

  const rawBody = await req.text();
  if (!validSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    console.warn("Rejected webhook: bad signature");
    return new Response("bad signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (!["payment_page.paid", "order.paid", "payment.captured"].includes(event.event)) return new Response("ignored");

  const payment = event.payload?.payment?.entity || {};
  const order = event.payload?.order?.entity || {};
  const page = event.payload?.payment_page?.entity || {};
  const buyer = payment.email;
  const name = firstName(payment.notes);
  const product = findProduct(payment, rawBody, order, page);
  console.log(event.event, "payment", payment.id, "amount", payment.amount, "description", payment.description,
    "notes", JSON.stringify(payment.notes), "page", page.id, page.title, "->", product ? product.key : "NO MATCH");
  // Shows which fields Razorpay sends for Payment Page orders, so matching can be tuned.
  console.log("order", JSON.stringify(order));

  try {
    if (!buyer || !product) {
      await sendEmail({
        to: OWNER_EMAIL,
        subject: `Action needed: send an ebook by hand (${payment.id})`,
        html: `<p>A payment came in but the website couldn't tell ${buyer ? "which ebook it was for" : "the buyer's email"}, so nothing was sent to the buyer.</p>
<p>Payment: ${esc(payment.id)}<br>Amount: ₹${(payment.amount || 0) / 100}<br>Buyer email: ${esc(buyer || "missing")}<br>Phone: ${esc(payment.contact || "")}<br>Description: ${esc(payment.description || "")}<br>Notes: ${esc(JSON.stringify(payment.notes || {}))}<br>Page: ${esc(page.id || "not sent")} ${esc(page.title || "")}<br>Order: ${esc(JSON.stringify(order))}</p>
<p>Please email them the PDF yourself, and tell Claude this payment so the matching can be fixed.</p>`
      });
      return new Response("owner notified");
    }

    const files = await Promise.all(product.files.map(loadPdf));
    const attachments = [];
    const links = [];
    let total = 0;
    for (const f of files) {
      if (f.content && total + f.content.length <= MAX_ATTACH_BYTES) {
        total += f.content.length;
        attachments.push({ filename: f.filename, content: f.content.toString("base64") });
      } else if (f.url) {
        links.push(f);
      }
    }
    if (attachments.length === 0 && links.length === 0) throw new Error(`No PDF configured for ${product.key}`);

    await sendEmail({
      to: buyer,
      reply_to: OWNER_EMAIL,
      subject: `Your ${product.files.length > 1 ? "ebooks" : "ebook"}: ${product.title}`,
      html: buyerEmail({ name, product, attachments, links }),
      attachments
    });
    return new Response("sent");
  } catch (err) {
    // A 500 makes Razorpay retry later, which helps if Resend or Drive had a hiccup.
    console.error("Delivery failed for", payment.id, err);
    await sendEmail({
      to: OWNER_EMAIL,
      subject: `Action needed: ebook email failed (${payment.id})`,
      html: `<p>The ebook email to ${esc(buyer || "unknown")} for <b>${esc(product?.title || "unknown")}</b> failed: ${esc(err.message)}</p><p>Razorpay will retry on its own. If the buyer writes to you, send the PDF by hand.</p>`
    }).catch(() => {});
    return new Response("delivery failed", { status: 500 });
  }
};

function validSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Turns a Drive share link into a direct download and fetches the PDF.
// Files Drive won't hand over directly (very large ones) come back as a link instead.
async function loadPdf(envName) {
  const filename = FILE_NAMES[envName] || `${envName}.pdf`;
  const shareUrl = (process.env[envName] || "").trim();
  if (!shareUrl) throw new Error(`Netlify variable ${envName} is empty`);
  const id = shareUrl.match(/\/d\/([\w-]{10,})/)?.[1] || shareUrl.match(/[?&]id=([\w-]{10,})/)?.[1];
  const downloadUrl = id ? `https://drive.google.com/uc?export=download&id=${id}` : shareUrl;
  try {
    const res = await fetch(downloadUrl, { redirect: "follow" });
    const size = Number(res.headers.get("content-length") || 0);
    if (res.ok && size <= MAX_ATTACH_BYTES) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.subarray(0, 5).toString() === "%PDF-") return { filename, content: buf, url: shareUrl };
    }
    console.warn(`${envName}: not attachable (status ${res.status}, ${size} bytes), sending link`);
  } catch (err) {
    console.warn(`${envName}: download failed, sending link`, err.message);
  }
  return { filename, url: shareUrl };
}

async function sendEmail(message) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, ...message })
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function firstName(notes) {
  if (!notes || typeof notes !== "object") return "";
  const key = Object.keys(notes).find(k => /name/i.test(k));
  return key ? String(notes[key]).trim().split(/\s+/)[0] : "";
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function buyerEmail({ name, product, attachments, links }) {
  const many = attachments.length + links.length > 1;
  const attachedLine = attachments.length
    ? `<p>Your ${many ? "ebooks are" : "ebook is"} attached to this email as ${attachments.length > 1 ? "PDF files" : "a PDF"}. Tap ${attachments.length > 1 ? "each one" : "it"} to open, then save ${attachments.length > 1 ? "them" : "it"} to your phone or computer so you always have ${attachments.length > 1 ? "them" : "it"}.</p>`
    : "";
  const linkList = links.length
    ? `<p>${attachments.length ? "This one was too big to attach, so download it here:" : "Download your ebook here:"}</p><ul>${links.map(l => `<li><a href="${esc(l.url)}">${esc(l.filename.replace(/ - Surbhi Priya\.pdf$/, ""))}</a></li>`).join("")}</ul>`
    : "";
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#2b2024;max-width:560px">
<p>Hi${name ? " " + esc(name) : ""},</p>
<p>Thank you so much for buying <b>${esc(product.title)}</b>. It means a lot to me.</p>
${attachedLine}${linkList}
<p>If anything doesn't open, just reply to this email and I'll help.</p>
<p>With love,<br>Surbhi Priya<br><a href="https://mokti.in">mokti.in</a></p>
</div>`;
}
