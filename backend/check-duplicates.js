const { Client } = require('pg');

async function checkDuplicates() {
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

    // Get all question details
    const result = await client.query(`
      SELECT id, "questionSchemeId", question, "sortOrder", "createdAt"
      FROM question_details
      ORDER BY "questionSchemeId", "sortOrder", "createdAt"
    `);

    console.log(`Total question records: ${result.rows.length}\n`);

    // Group by scheme
    const byScheme = {};
    result.rows.forEach(row => {
      if (!byScheme[row.questionSchemeId]) {
        byScheme[row.questionSchemeId] = [];
      }
      byScheme[row.questionSchemeId].push(row);
    });

    // Display each scheme's questions
    for (const [schemeId, questions] of Object.entries(byScheme)) {
      console.log(`\n=== Scheme ID: ${schemeId} ===`);
      console.log(`Total questions: ${questions.length}`);

      questions.forEach((q, idx) => {
        console.log(`\n${idx + 1}. ID: ${q.id}`);
        console.log(`   Question: "${q.question}"`);
        console.log(`   Sort Order: ${q.sortOrder}`);
        console.log(`   Created: ${q.createdAt}`);
      });

      // Check for duplicates
      const questionTexts = questions.map(q => q.question);
      const uniqueTexts = new Set(questionTexts);
      if (questionTexts.length !== uniqueTexts.size) {
        console.log(`\n⚠️  WARNING: Found duplicate questions in this scheme!`);
        const duplicates = questionTexts.filter((item, index) => questionTexts.indexOf(item) !== index);
        console.log(`   Duplicates: ${[...new Set(duplicates)].join(', ')}`);
      }

      // Check for empty questions
      const emptyQuestions = questions.filter(q => !q.question || q.question.trim() === '');
      if (emptyQuestions.length > 0) {
        console.log(`\n⚠️  WARNING: Found ${emptyQuestions.length} empty question(s)!`);
        emptyQuestions.forEach(q => {
          console.log(`   Empty question ID: ${q.id}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDuplicates();
