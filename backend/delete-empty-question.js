const { Client } = require('pg');

async function deleteEmptyQuestion() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'order_management',
    user: 'jianouyang',
    password: '',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Delete the empty question
    const result = await client.query(`
      DELETE FROM question_details
      WHERE id = 'e9209d71-d6cf-4245-95fb-5670cd694b87'
      RETURNING id, question
    `);

    if (result.rowCount > 0) {
      console.log('✓ Deleted empty question:', result.rows[0]);
    } else {
      console.log('No empty question found with that ID');
    }

    // Also delete any other empty questions
    const cleanupResult = await client.query(`
      DELETE FROM question_details
      WHERE question IS NULL OR question = ''
      RETURNING id
    `);

    if (cleanupResult.rowCount > 0) {
      console.log(`✓ Cleaned up ${cleanupResult.rowCount} additional empty question(s)`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

deleteEmptyQuestion();
