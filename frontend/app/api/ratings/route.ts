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

// GET /api/ratings?targetAddress=0x...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetAddress = searchParams.get('targetAddress');

  if (!targetAddress) {
    return NextResponse.json({ success: false, error: 'Missing targetAddress parameter' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Fetch ratings
    const query = `
      SELECT id, reviewer_address, stars, message, created_at, updated_at
      FROM user_ratings
      WHERE target_address = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await connection.execute(query, [targetAddress.toLowerCase()]);
    connection.end();

    const ratings = rows as any[];
    
    // Calculate average stars
    const totalReviews = ratings.length;
    const totalStars = ratings.reduce((sum, r) => sum + r.stars, 0);
    const averageStars = totalReviews > 0 ? parseFloat((totalStars / totalReviews).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      ratings,
      averageStars,
      totalReviews
    });
  } catch (error: any) {
    if (connection) connection.end().catch(() => {});
    console.error('[OrbitBase GET Ratings] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/ratings
export async function POST(request: Request) {
  let connection;
  try {
    const payload = await request.json();
    const {
      reviewerAddress,
      targetAddress,
      stars,
      message,
      signature,
      signatureMessage
    } = payload;

    if (!reviewerAddress || !targetAddress || stars === undefined || !signature || !signatureMessage) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const numStars = parseInt(stars);
    if (isNaN(numStars) || numStars < 0 || numStars > 5) {
      return NextResponse.json({ success: false, error: 'Stars rating must be an integer between 0 and 5' }, { status: 400 });
    }

    if (reviewerAddress.toLowerCase() === targetAddress.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'No puedes evaluarte a ti mismo' }, { status: 400 });
    }

    // 1. Verify cryptographic signature
    try {
      const isValid = await verifyMessage({
        address: reviewerAddress as `0x${string}`,
        message: signatureMessage,
        signature: signature as `0x${string}`
      });

      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid signature verification' }, { status: 401 });
      }
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Signature verification failed: ${e.message}` }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    // 2. Verify business eligibility (Commercial relation check)
    // Check if reviewer has contributed to target's pool OR target has contributed to reviewer's pool
    const checkRelationQuery = `
      SELECT COUNT(*) as count 
      FROM history_events h
      JOIN pools p ON h.address = p.poolAddress
      WHERE (h.creator = ? AND p.creator = ? AND h.type = 'CONTRIBUTED')
         OR (h.creator = ? AND p.creator = ? AND h.type = 'CONTRIBUTED')
    `;

    const [relationRows] = await connection.execute(checkRelationQuery, [
      reviewerAddress.toLowerCase(),
      targetAddress.toLowerCase(),
      targetAddress.toLowerCase(),
      reviewerAddress.toLowerCase()
    ]);

    const hasRelation = (relationRows as any[])[0]?.count > 0;

    if (!hasRelation) {
      connection.end();
      return NextResponse.json({ 
        success: false, 
        error: 'Debe haber participado en un proyecto comercial en común para poder calificar' 
      }, { status: 403 });
    }

    // 3. Insert or update rating
    const insertQuery = `
      INSERT INTO user_ratings (reviewer_address, target_address, stars, message)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE stars = VALUES(stars), message = VALUES(message)
    `;
    
    await connection.execute(insertQuery, [
      reviewerAddress.toLowerCase(),
      targetAddress.toLowerCase(),
      numStars,
      message ? message.trim() : null
    ]);

    connection.end();

    return NextResponse.json({ success: true, message: 'Rating saved successfully' });

  } catch (error: any) {
    if (connection) connection.end().catch(() => {});
    console.error('[OrbitBase POST Ratings] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
