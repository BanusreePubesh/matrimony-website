import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  // Use 127.0.0.1 explicitly — 'localhost' resolves to IPv6 (::1) on Windows,
  // which causes AggregateError when mysql2 tries all addresses and all fail.
  host: (process.env.DB_HOST || 'localhost') === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const dbName = process.env.DB_NAME || 'vivahshaadi';

console.log("Database:", process.env.DB_NAME);

let pool;

// Auto-initialize DB and Tables
async function initDB() {
  try {
    // 1. Connect without db to ensure database exists
    let tempConnection;
    try {
      tempConnection = await mysql.createConnection(dbConfig);
    } catch (connErr) {
      const hint = connErr.code === 'ECONNREFUSED'
        ? `\n\n  MySQL is not running or not accepting connections on ${dbConfig.host}:${dbConfig.port}.\n  Please start MySQL and try again.`
        : connErr.code === 'ER_ACCESS_DENIED_ERROR'
        ? `\n\n  Access denied. Check DB_USER and DB_PASSWORD in Backend/.env`
        : '';
      throw new Error(`Cannot connect to MySQL: ${connErr.message}${hint}`);
    }
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 2. Create the connection pool with database selected
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL Database: ${dbName}`);

    // 3. Create Tables
    await createTables();

    // 4. Seed initial profiles if empty
    await seedProfiles();

  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

async function createTables() {
  // Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(15) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      gender VARCHAR(10) NOT NULL, -- 'male' / 'female' / 'groom' / 'bride'
      age INT,
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100),
      pincode VARCHAR(15),
      religion VARCHAR(50),
      caste VARCHAR(50),
      education VARCHAR(100),
      job VARCHAR(100),
      salary VARCHAR(50),
      height VARCHAR(20),
      complexion VARCHAR(50),
      rasi VARCHAR(50),
      nakshatra VARCHAR(50),
      dosham VARCHAR(100),
      horoscope_path VARCHAR(255),
      horoscope_status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
      img VARCHAR(255),
      premium_plan VARCHAR(20) DEFAULT 'Basic', -- 'Basic', 'Gold', 'Premium'
      views_used INT DEFAULT 0,
      interests_used INT DEFAULT 0,
      online TINYINT DEFAULT 1,
      status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Pending', 'Blocked'
      verified TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Interests Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS interests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_interest (sender_id, receiver_id)
    )
  `);

  // Messages Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Profile Views Table (Unique views per month/session)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile_views (
      viewer_id INT NOT NULL,
      viewed_id INT NOT NULL,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (viewer_id, viewed_id),
      FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (viewed_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Reports Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reported_id INT NOT NULL,
      reporter_id INT NOT NULL,
      type VARCHAR(100) NOT NULL, -- 'Fake Profile', 'Harassment', etc.
      severity VARCHAR(20) DEFAULT 'Low', -- 'Low', 'Medium', 'High'
      status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database tables verified/created successfully.');
}

async function seedProfiles() {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (rows[0].count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial profiles...');

  const initialProfiles = [
    // Female Profiles
    { phone: '9999999901', name: 'Priya Sharma', gender: 'female', age: 26, city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600001', religion: 'Hindu', caste: 'Brahmin', education: 'M.Tech', job: 'Software Engineer', salary: '12 LPA', height: "5'4\"", complexion: 'Fair', rasi: 'Mesham', nakshatra: 'Ashwini', dosham: 'None', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&fit=crop&q=80', premium_plan: 'Premium', status: 'Active', verified: 1 },
    { phone: '9999999902', name: 'Ananya Krishnan', gender: 'female', age: 24, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', pincode: '641001', religion: 'Hindu', caste: 'Mudaliar', education: 'MBA', job: 'Bank Manager', salary: '8 LPA', height: "5'3\"", complexion: 'Wheatish', rasi: 'Rishabam', nakshatra: 'Rohini', dosham: 'Chevvai Dosham', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop&q=80', premium_plan: 'Basic', status: 'Active', verified: 1 },
    { phone: '9999999903', name: 'Divya Nair', gender: 'female', age: 27, city: 'Bangalore', state: 'Karnataka', country: 'India', pincode: '560001', religion: 'Hindu', caste: 'Nair', education: 'MBBS', job: 'Doctor', salary: '18 LPA', height: "5'5\"", complexion: 'Fair', rasi: 'Mithunam', nakshatra: 'Thiruvathirai', dosham: 'None', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&fit=crop&q=80', premium_plan: 'Gold', status: 'Active', verified: 1 },
    { phone: '9999999904', name: 'Kavitha Reddy', gender: 'female', age: 25, city: 'Hyderabad', state: 'Telangana', country: 'India', pincode: '500001', religion: 'Hindu', caste: 'Reddy', education: 'B.Tech', job: 'Data Analyst', salary: '10 LPA', height: "5'2\"", complexion: 'Wheatish', rasi: 'Katakam', nakshatra: 'Pushyam', dosham: 'None', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&q=80', premium_plan: 'Basic', status: 'Active', verified: 1 },
    { phone: '9999999905', name: 'Meena Iyer', gender: 'female', age: 28, city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400001', religion: 'Hindu', caste: 'Iyer', education: 'CA', job: 'Chartered Accountant', salary: '15 LPA', height: "5'3\"", complexion: 'Fair', rasi: 'Simmam', nakshatra: 'Magam', dosham: 'None', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&fit=crop&q=80', premium_plan: 'Premium', status: 'Active', verified: 1 },
    { phone: '9999999906', name: 'Lakshmi Venkat', gender: 'female', age: 23, city: 'Madurai', state: 'Tamil Nadu', country: 'India', pincode: '625001', religion: 'Hindu', caste: 'Pillai', education: 'B.E.', job: 'Teacher', salary: '5 LPA', height: "5'1\"", complexion: 'Fair', rasi: 'Kanni', nakshatra: 'Uthiram', dosham: 'Sevvai Dosham', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&fit=crop&q=80', premium_plan: 'Basic', status: 'Active', verified: 0 },

    // Male Profiles
    { phone: '9999999911', name: 'Arun Kumar', gender: 'male', age: 28, city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600001', religion: 'Hindu', caste: 'Brahmin', education: 'B.Tech', job: 'Software Engineer', salary: '15 LPA', height: "5'10\"", complexion: 'Fair', rasi: 'Mesham', nakshatra: 'Ashwini', dosham: 'None', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&q=80', premium_plan: 'Basic', status: 'Active', verified: 1 },
    { phone: '9999999912', name: 'Rajesh Pillai', gender: 'male', age: 30, city: 'Madurai', state: 'Tamil Nadu', country: 'India', pincode: '625001', religion: 'Hindu', caste: 'Pillai', education: 'MBA', job: 'Business Manager', salary: '12 LPA', height: "5'9\"", complexion: 'Wheatish', rasi: 'Rishabam', nakshatra: 'Rohini', dosham: 'None', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80', premium_plan: 'Gold', status: 'Pending', verified: 0 },
    { phone: '9999999913', name: 'Vikram Nair', gender: 'male', age: 29, city: 'Bangalore', state: 'Karnataka', country: 'India', pincode: '560001', religion: 'Hindu', caste: 'Nair', education: 'MS', job: 'Product Manager', salary: '25 LPA', height: "6'0\"", complexion: 'Fair', rasi: 'Mithunam', nakshatra: 'Thiruvathirai', dosham: 'Sevvai Dosham', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&fit=crop&q=80', premium_plan: 'Premium', status: 'Active', verified: 1 }
  ];

  const query = `
    INSERT INTO users (
      phone, name, gender, age, city, state, country, pincode, 
      religion, caste, education, job, salary, height, complexion, 
      rasi, nakshatra, dosham, img, premium_plan, status, verified
    ) VALUES ?
  `;

  const values = initialProfiles.map(p => [
    p.phone, p.name, p.gender, p.age, p.city, p.state, p.country, p.pincode,
    p.religion, p.caste, p.education, p.job, p.salary, p.height, p.complexion,
    p.rasi, p.nakshatra, p.dosham, p.img, p.premium_plan, p.status, p.verified
  ]);

  await pool.query(query, [values]);

  // Seed initial interest
  // Priya Sharma (id=1) sent interest to Arun Kumar (id=7)
  await pool.query('INSERT IGNORE INTO interests (sender_id, receiver_id, status) VALUES (1, 7, \'pending\')');
  // Divya Nair (id=3) sent interest to Arun Kumar (id=7) (accepted)
  await pool.query('INSERT IGNORE INTO interests (sender_id, receiver_id, status) VALUES (3, 7, \'accepted\')');
  // Ananya Krishnan (id=2) sent interest to Arun Kumar (id=7) (accepted)
  await pool.query('INSERT IGNORE INTO interests (sender_id, receiver_id, status) VALUES (2, 7, \'accepted\')');

  // Seed initial messages
  await pool.query('INSERT INTO messages (sender_id, receiver_id, text) VALUES (3, 7, \'Hello Arun! I liked your profile.\')');
  await pool.query('INSERT INTO messages (sender_id, receiver_id, text) VALUES (7, 3, \'Hi Divya, thank you! I liked your profile too. Let us connect.\')');

  // Seed initial reports
  // Reporter: Priya M. (Priya Sharma, id 1) reported Rajesh Pillai (id 8)
  await pool.query('INSERT INTO reports (reported_id, reporter_id, type, severity, status) VALUES (8, 1, \'Fake Profile\', \'High\', \'open\')');

  console.log('Seeding profiles, interests, messages completed successfully.');
}

// Wrapper for executing query
export async function query(sql, params = []) {
  if (!pool) await initDB();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Wrapper for running statements that return metadata (insert id, changes)
export async function run(sql, params = []) {
  if (!pool) await initDB();
  const [result] = await pool.execute(sql, params);
  return { insertId: result.insertId, affectedRows: result.affectedRows };
}

export default {
  initDB,
  query,
  run,
  getPool: () => pool
};
