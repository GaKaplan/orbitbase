import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyMessage } from 'viem';

const dbConfig = {
  host: '54.94.87.16',
  user: 'admin',
  password: 'Infotech$123',
  database: 'orbitbase',
  port: 3306,
  connectTimeout: 20000 
};

const RESEND_API_KEY = 're_jVuvwmdR_PM5tBCQAmuQgJXfkAqy6ffXt';
const ADMIN_WALLET_ADDRESSES = [
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Anvil Owner
  '0x37042a9bba97e82811ded1061c28c89488e3234d'  // Deployer Owner
];
const ADMIN_DEFAULT_EMAIL = 'info@orbitbase.xyz';

// Helper to check if address is admin
function isPlatformAdmin(address: string): boolean {
  return ADMIN_WALLET_ADDRESSES.includes(address.toLowerCase());
}

// Helper to send email via Resend
async function sendNotificationEmail(to: string[], subject: string, htmlContent: string) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'OrbitBase Community <info@orbitbase.xyz>',
        to,
        subject,
        html: htmlContent
      })
    });
  } catch (err) {
    console.error('[OrbitBase Resend] Error sending email:', err);
  }
}

// GET /api/messages?poolAddress=0x...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const poolAddress = searchParams.get('poolAddress');

  if (!poolAddress) {
    return NextResponse.json({ success: false, error: 'Missing poolAddress parameter' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT id, pool_address, sender_address, sender_name, message, reply_to_id, target_type, recipient_addresses, created_at, updated_at
      FROM pool_messages
      WHERE pool_address = ?
      ORDER BY created_at ASC
    `;
    const [rows] = await connection.execute(query, [poolAddress]);
    connection.end();

    const messages = rows as any[];
    
    // Structure messages: filter parents and map replies
    const parents = messages.filter(m => !m.reply_to_id);
    const replies = messages.filter(m => m.reply_to_id);

    parents.forEach(parent => {
      parent.replies = replies.filter(r => r.reply_to_id === parent.id);
    });

    // Return chronological descending for parent threads
    parents.reverse();

    return NextResponse.json({ success: true, messages: parents });
  } catch (error: any) {
    if (connection) connection.end().catch(() => {});
    console.error('[OrbitBase GET Messages] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/messages
export async function POST(request: Request) {
  let connection;
  try {
    const payload = await request.json();
    const {
      poolAddress,
      senderAddress,
      senderName,
      message,
      replyToId,
      targetType = 'public', // 'public', 'announcement_all', 'announcement_some', 'admin'
      recipientAddresses, // array of strings for announcement_some
      signature,
      signatureMessage,
      lang = 'es'
    } = payload;

    if (!poolAddress || !message) {
      return NextResponse.json({ success: false, error: 'Missing poolAddress or message' }, { status: 400 });
    }

    let verifiedSenderAddress = null;

    // Verify signature if sender address is claimed (Web3 authentication)
    if (senderAddress && signature && signatureMessage) {
      try {
        const isValid = await verifyMessage({
          address: senderAddress as `0x${string}`,
          message: signatureMessage,
          signature: signature as `0x${string}`
        });

        if (isValid) {
          verifiedSenderAddress = senderAddress.toLowerCase();
        } else {
          return NextResponse.json({ success: false, error: 'Invalid signature verification' }, { status: 401 });
        }
      } catch (e: any) {
        return NextResponse.json({ success: false, error: `Signature verification failed: ${e.message}` }, { status: 400 });
      }
    }

    connection = await mysql.createConnection(dbConfig);

    // Save message to DB
    const insertQuery = `
      INSERT INTO pool_messages (pool_address, sender_address, sender_name, message, reply_to_id, target_type, recipient_addresses)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(insertQuery, [
      poolAddress,
      verifiedSenderAddress,
      senderName || null,
      message,
      replyToId || null,
      targetType,
      recipientAddresses ? JSON.stringify(recipientAddresses) : null
    ]);

    const insertId = (result as any).insertId;

    // --- EMAIL NOTIFICATION LOGIC ---
    let emailsToNotify: string[] = [];
    let senderEmail: string | null = null;

    // 1. Fetch sender email if registered
    if (verifiedSenderAddress) {
      const [senderRows] = await connection.execute(
        'SELECT email FROM wallet_emails WHERE wallet = ? AND verified = 1',
        [verifiedSenderAddress]
      );
      const sRec = (senderRows as any[])[0];
      if (sRec) senderEmail = sRec.email;
    }

    // 2. Fetch project context if message is pool-specific
    let poolCreator: string | null = null;
    let poolName = `Pool ${poolAddress.substring(0, 6)}`;
    if (poolAddress !== 'admin') {
      const [poolRows] = await connection.execute(
        'SELECT creator, description FROM pools WHERE poolAddress = ?',
        [poolAddress]
      );
      const pRec = (poolRows as any[])[0];
      if (pRec) {
        poolCreator = pRec.creator;
        poolName = pRec.description || poolName;
      }
    }

    // 3. Determine recipients based on target type
    if (targetType === 'admin' || poolAddress === 'admin') {
      // Send to Admin
      emailsToNotify.push(ADMIN_DEFAULT_EMAIL);
      // Try to find email of the deployer owner in registered emails
      const [adminRows] = await connection.execute(
        'SELECT email FROM wallet_emails WHERE wallet = ? AND verified = 1',
        [ADMIN_WALLET_ADDRESSES[1]]
      );
      const aRec = (adminRows as any[])[0];
      if (aRec) emailsToNotify.push(aRec.email);

      // Email to Admin
      const adminHtml = `
        <div style="background-color:#09090b;color:#ffffff;font-family:sans-serif;padding:32px;border-radius:16px;max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);">
          <h2 style="color:#f59e0b;margin:0 0 16px;font-size:20px;text-transform:uppercase;">💬 Nuevo Mensaje de Soporte</h2>
          <p style="color:#e4e4e7;line-height:1.6;font-size:14px;">
            Has recibido una consulta de soporte general en la plataforma OrbitBase.
          </p>
          <div style="background-color:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);margin:24px 0;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;font-weight:bold;">REMITENTE:</p>
            <p style="margin:0 0 16px;font-size:14px;color:#ffffff;font-family:monospace;">${verifiedSenderAddress || 'Anónimo'} ${senderName ? `(${senderName})` : ''}</p>
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;font-weight:bold;">MENSAJE:</p>
            <p style="margin:0;font-size:14px;color:#e4e4e7;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="font-size:10px;color:#52525b;margin-top:32px;">OrbitBase Administration • Base Mainnet</p>
        </div>
      `;
      await sendNotificationEmail(emailsToNotify, '💬 Soporte OrbitBase: Nuevo mensaje recibido', adminHtml);
    } 
    else if (replyToId) {
      // It is a reply to an existing comment. Notify parent message author.
      const [parentRows] = await connection.execute(
        'SELECT sender_address FROM pool_messages WHERE id = ?',
        [replyToId]
      );
      const pMsg = (parentRows as any[])[0];
      if (pMsg && pMsg.sender_address) {
        const [parentEmailRows] = await connection.execute(
          'SELECT email FROM wallet_emails WHERE wallet = ? AND verified = 1',
          [pMsg.sender_address]
        );
        const pEmail = (parentEmailRows as any[])[0];
        if (pEmail) {
          const userHtml = `
            <div style="background-color:#09090b;color:#ffffff;font-family:sans-serif;padding:32px;border-radius:16px;max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);">
              <h2 style="color:#3b82f6;margin:0 0 16px;font-size:20px;">💬 Respuesta recibida en OrbitBase</h2>
              <p style="color:#e4e4e7;line-height:1.6;font-size:14px;">
                El creador del proyecto <strong>${poolName}</strong> ha respondido a tu pregunta pública.
              </p>
              <div style="background-color:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);margin:24px 0;">
                <p style="margin:0 0 8px;font-size:12px;color:#71717a;font-weight:bold;">RESPUESTA:</p>
                <p style="margin:0;font-size:14px;color:#e4e4e7;white-space:pre-wrap;">${message}</p>
              </div>
              <a href="https://orbitbase.xyz" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:12px;text-transform:uppercase;">Ver en OrbitBase</a>
            </div>
          `;
          await sendNotificationEmail([pEmail.email], `💬 Respuesta recibida en: ${poolName}`, userHtml);
        }
      }
    } 
    else if (targetType.startsWith('announcement_')) {
      // It is an announcement to investors. Fetch all contributors to the pool.
      const [contribRows] = await connection.execute(
        "SELECT DISTINCT creator FROM history_events WHERE address = ? AND type = 'CONTRIBUTED'",
        [poolAddress]
      );
      let investors = (contribRows as any[]).map(c => c.creator.toLowerCase());

      // If targeted to specific investors, filter the list
      if (targetType === 'announcement_some' && recipientAddresses) {
        const targets = recipientAddresses.map((a: string) => a.toLowerCase());
        investors = investors.filter(i => targets.includes(i));
      }

      if (investors.length > 0) {
        // Find emails for these investors
        const placeholders = investors.map(() => '?').join(',');
        const [emailRows] = await connection.execute(
          `SELECT email FROM wallet_emails WHERE wallet IN (${placeholders}) AND verified = 1`,
          investors
        );
        const investorEmails = (emailRows as any[]).map(e => e.email);

        if (investorEmails.length > 0) {
          const annHtml = `
            <div style="background-color:#09090b;color:#ffffff;font-family:sans-serif;padding:32px;border-radius:16px;max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);">
              <h2 style="color:#f59e0b;margin:0 0 16px;font-size:20px;text-transform:uppercase;">📢 Anuncio de Campaña: ${poolName}</h2>
              <p style="color:#e4e4e7;line-height:1.6;font-size:14px;">
                El creador de la preventa en la que participas ha publicado un nuevo anuncio oficial.
              </p>
              <div style="background-color:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#ffffff;white-space:pre-wrap;line-height:1.7;">${message}</p>
              </div>
              <a href="https://orbitbase.xyz" style="display:inline-block;background-color:#f59e0b;color:#000000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:black;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Ir a la plataforma</a>
            </div>
          `;
          await sendNotificationEmail(investorEmails, `📢 Nuevo anuncio de: ${poolName}`, annHtml);
        }
      }
    } 
    else if (poolCreator) {
      // Standard public Q&A comment to creator. Notify creator.
      const [creatorEmailRows] = await connection.execute(
        'SELECT email FROM wallet_emails WHERE wallet = ? AND verified = 1',
        [poolCreator.toLowerCase()]
      );
      const cEmail = (creatorEmailRows as any[])[0];
      if (cEmail) {
        const creatorHtml = `
          <div style="background-color:#09090b;color:#ffffff;font-family:sans-serif;padding:32px;border-radius:16px;max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);">
            <h2 style="color:#3b82f6;margin:0 0 16px;font-size:20px;text-transform:uppercase;">💬 Nueva Pregunta en tu Preventa</h2>
            <p style="color:#e4e4e7;line-height:1.6;font-size:14px;">
              Has recibido una nueva pregunta pública de un inversor/visitante en tu campaña <strong>${poolName}</strong>.
            </p>
            <div style="background-color:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);margin:24px 0;">
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;font-weight:bold;">PREGUNTA:</p>
              <p style="margin:0 0 16px;font-size:14px;color:#ffffff;">"${message}"</p>
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;font-weight:bold;">REMITENTE:</p>
              <p style="margin:0;font-size:13px;color:#a1a1aa;font-family:monospace;">${verifiedSenderAddress || 'Anónimo'} ${senderName ? `(${senderName})` : ''}</p>
            </div>
            <a href="https://orbitbase.xyz" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:12px;text-transform:uppercase;">Responder Pregunta</a>
          </div>
        `;
        await sendNotificationEmail([cEmail.email], `💬 Nueva consulta en tu preventa: ${poolName}`, creatorHtml);
      }
    }

    // 4. Notify sender as acknowledgment
    if (senderEmail) {
      const confirmHtml = `
        <div style="background-color:#09090b;color:#ffffff;font-family:sans-serif;padding:32px;border-radius:16px;max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);">
          <h2 style="color:#10b981;margin:0 0 16px;font-size:20px;text-transform:uppercase;">✅ Tu mensaje ha sido publicado</h2>
          <p style="color:#e4e4e7;line-height:1.6;font-size:14px;">
            Confirmamos que tu mensaje en <strong>${poolName}</strong> ha sido publicado con éxito y se ha notificado a las partes correspondientes.
          </p>
          <div style="background-color:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#a1a1aa;font-style:italic;">"${message}"</p>
          </div>
          <p style="font-size:10px;color:#52525b;margin-top:32px;">OrbitBase Community Team • Base Mainnet</p>
        </div>
      `;
      await sendNotificationEmail([senderEmail], `✅ Mensaje publicado: ${poolName}`, confirmHtml);
    }

    connection.end();

    return NextResponse.json({
      success: true,
      message: {
        id: insertId,
        pool_address: poolAddress,
        sender_address: verifiedSenderAddress,
        sender_name: senderName || null,
        message,
        reply_to_id: replyToId || null,
        target_type: targetType,
        recipient_addresses: recipientAddresses || null,
        created_at: new Date()
      }
    });

  } catch (error: any) {
    if (connection) connection.end().catch(() => {});
    console.error('[OrbitBase POST Messages] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/messages (Moderación - Editar)
export async function PUT(request: Request) {
  let connection;
  try {
    const { id, message, signature, signatureMessage, address } = await request.json();

    if (!id || !message || !signature || !signatureMessage || !address) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Cryptographic signature check
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: signatureMessage,
      signature: signature as `0x${string}`
    });

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid signature verification' }, { status: 401 });
    }

    // Authorization check
    if (!isPlatformAdmin(address)) {
      return NextResponse.json({ success: false, error: 'Access denied: You are not the platform owner' }, { status: 403 });
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `UPDATE pool_messages SET message = ? WHERE id = ?`;
    await connection.execute(query, [message, id]);
    connection.end();

    return NextResponse.json({ success: true, message: 'Message updated by administrator.' });
  } catch (error: any) {
    if (connection) connection.end().catch(() => {});
    console.error('[OrbitBase PUT Messages] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/messages (Moderación - Eliminar)
export async function DELETE(request: Request) {
  let connection;
  try {
    const { id, signature, signatureMessage, address } = await request.json();

    if (!id || !signature || !signatureMessage || !address) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Cryptographic signature check
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: signatureMessage,
      signature: signature as `0x${string}`
    });

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid signature verification' }, { status: 401 });
    }

    // Authorization check
    if (!isPlatformAdmin(address)) {
      return NextResponse.json({ success: false, error: 'Access denied: You are not the platform owner' }, { status: 403 });
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `DELETE FROM pool_messages WHERE id = ?`;
    await connection.execute(query, [id]);
    connection.end();

    return NextResponse.json({ success: true, message: 'Message deleted by administrator.' });
  } catch (error: any) {
    if (connection) connection.end().catch(() => {});
    console.error('[OrbitBase DELETE Messages] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
