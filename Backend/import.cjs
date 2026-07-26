const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT || 26602,
    multipleStatements: true,
    ssl: { rejectUnauthorized: false }
});

async function runImport() {
    try {
        console.log('Connecting to Aiven MySQL...');
        const promisePool = connection.promise();

        console.log('Configuring session parameters...');
        await promisePool.query('SET sql_require_primary_key = 0;');
        await promisePool.query('SET foreign_key_checks = 0;');
        
        console.log('Cleaning existing tables...');
        await promisePool.query('DROP TABLE IF EXISTS interests, messages, profile_views, reports, users;');
        
        await promisePool.query('SET foreign_key_checks = 1;');

        const sqlFilePath = path.join(process.cwd(), 'vivahshaadi.sql');
        console.log(`Reading SQL file from: ${sqlFilePath}`);
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing database import...');
        await promisePool.query(sqlContent);

        console.log('Database import completed successfully!');
    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        connection.end();
    }
}

runImport();