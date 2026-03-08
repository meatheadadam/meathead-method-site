import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check for all non-GET requests
  if (req.method !== 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // GET — fetch all articles
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM articles ORDER BY created_at DESC
      `;
      return res.status(200).json(rows);
    }

    // POST — create new article
    if (req.method === 'POST') {
      const { slug, title, category, excerpt, body, read_time, published } = req.body;
      const { rows } = await sql`
        INSERT INTO articles (slug, title, category, excerpt, body, read_time, published)
        VALUES (${slug}, ${title}, ${category}, ${excerpt}, ${body}, ${read_time}, ${published})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    // PUT — update existing article
    if (req.method === 'PUT') {
      const { id, slug, title, category, excerpt, body, read_time, published } = req.body;
      const { rows } = await sql`
        UPDATE articles
        SET slug=${slug}, title=${title}, category=${category},
            excerpt=${excerpt}, body=${body}, read_time=${read_time},
            published=${published}, updated_at=NOW()
        WHERE id=${id}
        RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    // DELETE — remove article by id
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await sql`DELETE FROM articles WHERE id=${id}`;
      return res.status(200).json({ success: true });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}