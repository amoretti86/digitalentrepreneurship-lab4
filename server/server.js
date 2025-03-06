const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool, initDb } = require('./db');
const sendEmail = require('./email');
require('dotenv').config();

const app = express();

app.use(express.json());

// Initialize database
initDb();

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// ========================================================
// Authentication Routes
// ========================================================

// Registration endpoint
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(`Received registration request with name: ${name}, email: ${email}`);
  
  // Email validation
  const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ 
      success: false,
      message: 'Email must end with @spelman.edu or @morehouse.edu.' 
    });
  }
  
  // Password validation
  if (!password || password.length < 8) {
    return res.status(400).json({ 
      success: false,
      message: 'Password must be at least 8 characters long.'
    });
  }

  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, verification_code, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, verificationCode, hashedPassword]
    );

    // Send verification email
    const subject = "Verify Your Email";
    const content = `Your verification code: <b>${verificationCode}</b>`;
    await sendEmail(email, subject, content);
    
    console.log("User registered successfully:", result.rows[0]);
    res.json({ 
      success: true,
      message: 'Registration successful. Verification email sent.'
    });
  } catch (err) {
    console.error('Error during registration:', err);
    
    // Handle duplicate email
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error saving user to database'
    });
  }
});

// Login endpoint for returning users
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Received login request for email: ${email}`);

  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // User not found
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const user = userResult.rows[0];
    
    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false,
        message: 'Email not verified. Please verify your email first.' 
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Login successful
    res.json({
      success: true,
      message: 'Login successful',
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Verification endpoint
app.post('/verify', async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Check if verification code is valid
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND verification_code = $2',
      [email, verificationCode]
    );

    if (result.rows.length > 0) {
      // Update the user's verification status
      await pool.query(
        'UPDATE users SET is_verified = TRUE WHERE email = $1',
        [email]
      );
      
      res.json({ 
        success: true, 
        message: 'Email verified successfully!',
        name: result.rows[0].name,
        email: result.rows[0].email
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code.' 
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Database error during verification' 
    });
  }
});

// ========================================================
// NEW: Doctor Search Routes
// ========================================================

// NEW: Get all specialties for dropdown menu
app.get('/api/specialties', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM specialties ORDER BY name');
    res.json({
      success: true,
      specialties: result.rows
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching specialties'
    });
  }
});

// NEW: Get all insurance plans for dropdown menu
app.get('/api/insurances', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM insurances ORDER BY name');
    res.json({
      success: true,
      insurances: result.rows
    });
  } catch (error) {
    console.error('Error fetching insurances:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching insurance plans'
    });
  }
});

// NEW: Search doctors with filters for specialty, insurance, and zipcode
app.get('/api/doctors/search', async (req, res) => {
  // Extract query parameters
  const { specialty, insurance, zipcode } = req.query;
  
  try {
    // Base query to join doctors with their specialties and insurances
    let query = `
      SELECT DISTINCT d.id, d.name, d.address, d.city, d.state, d.zipcode, 
             d.phone, d.email, d.bio, d.affiliation
      FROM doctors d
    `;
    
    // Array to hold query parameters
    const queryParams = [];
    // Array to hold WHERE conditions
    const conditions = [];
    
    // Add specialty filter if provided
    if (specialty) {
      query += `
        JOIN doctor_specialties ds ON d.id = ds.doctor_id
        JOIN specialties s ON ds.specialty_id = s.id
      `;
      queryParams.push(specialty);
      conditions.push(`s.name = $${queryParams.length}`);
    }
    
    // Add insurance filter if provided
    if (insurance) {
      // Only add the JOIN if not already included due to specialty
      if (!specialty) {
        query += `
          JOIN doctor_insurances di ON d.id = di.doctor_id
          JOIN insurances i ON di.insurance_id = i.id
        `;
      } else {
        query += `
          JOIN doctor_insurances di ON d.id = di.doctor_id
          JOIN insurances i ON di.insurance_id = i.id
        `;
      }
      queryParams.push(insurance);
      conditions.push(`i.name = $${queryParams.length}`);
    }
    
    // Add zipcode filter if provided
    if (zipcode) {
      queryParams.push(zipcode);
      conditions.push(`d.zipcode = $${queryParams.length}`);
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ORDER BY to sort results by doctor name
    query += ` ORDER BY d.name`;
    
    console.log('Executing search query:', query, queryParams);
    
    const result = await pool.query(query, queryParams);
    
    // For each doctor, fetch their specialties and insurances
    const doctorsWithDetails = await Promise.all(result.rows.map(async (doctor) => {
      // Get specialties for this doctor
      const specialtiesResult = await pool.query(`
        SELECT s.name
        FROM specialties s
        JOIN doctor_specialties ds ON s.id = ds.specialty_id
        WHERE ds.doctor_id = $1
      `, [doctor.id]);
      
      // Get insurances for this doctor
      const insurancesResult = await pool.query(`
        SELECT i.name
        FROM insurances i
        JOIN doctor_insurances di ON i.id = di.insurance_id
        WHERE di.doctor_id = $1
      `, [doctor.id]);
      
      // Return doctor with added specialties and insurances arrays
      return {
        ...doctor,
        specialties: specialtiesResult.rows.map(s => s.name),
        insurances: insurancesResult.rows.map(i => i.name)
      };
    }));
    
    res.json({
      success: true,
      count: doctorsWithDetails.length,
      doctors: doctorsWithDetails
    });
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching doctors'
    });
  }
});

// NEW: Get doctor details by ID
app.get('/api/doctors/:id', async (req, res) => {
  const doctorId = req.params.id;
  
  try {
    // Get basic doctor information
    const doctorResult = await pool.query(`
      SELECT id, name, address, city, state, zipcode, phone, email, bio, affiliation
      FROM doctors
      WHERE id = $1
    `, [doctorId]);
    
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    const doctor = doctorResult.rows[0];
    
    // Get specialties for this doctor
    const specialtiesResult = await pool.query(`
      SELECT s.name
      FROM specialties s
      JOIN doctor_specialties ds ON s.id = ds.specialty_id
      WHERE ds.doctor_id = $1
    `, [doctorId]);
    
    // Get insurances for this doctor
    const insurancesResult = await pool.query(`
      SELECT i.name
      FROM insurances i
      JOIN doctor_insurances di ON i.id = di.insurance_id
      WHERE di.doctor_id = $1
    `, [doctorId]);
    
    // Return doctor with added specialties and insurances arrays
    res.json({
      success: true,
      doctor: {
        ...doctor,
        specialties: specialtiesResult.rows.map(s => s.name),
        insurances: insurancesResult.rows.map(i => i.name)
      }
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor details'
    });
  }
});

// Fallback route to serve React frontend for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});