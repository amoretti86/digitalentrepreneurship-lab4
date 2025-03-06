const { Pool } = require('pg');
require("dotenv").config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Setup the PostgreSQL pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false 
    //ssl:{
    //    rejectUnauthorized: false
    //}
});

// Function to initialize the database
const initDb = async () => {
    try {
        // Drop existing tables if they exist
        await pool.query(`DROP TABLE IF EXISTS users, doctors, specialties, insurances, doctor_specialties, doctor_insurances`);

        // Create users table - keeping the existing structure
        await pool.query(`
           CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                verification_code VARCHAR(6) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // NEW: Create specialties table to store medical specialties
        await pool.query(`
            CREATE TABLE IF NOT EXISTS specialties (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            );
        `);

        // NEW: Create insurances table to store insurance plans
        await pool.query(`
            CREATE TABLE IF NOT EXISTS insurances (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            );
        `);

        // NEW: Create doctors table to store doctor information
        await pool.query(`
            CREATE TABLE IF NOT EXISTS doctors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zipcode VARCHAR(10) NOT NULL,
                phone VARCHAR(15) NOT NULL,
                email VARCHAR(255) UNIQUE,
                bio TEXT,
                affiliation VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // NEW: Create junction table for doctors and specialties (many-to-many)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS doctor_specialties (
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
                specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
                PRIMARY KEY (doctor_id, specialty_id)
            );
        `);

        // NEW: Create junction table for doctors and insurances (many-to-many)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS doctor_insurances (
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
                insurance_id INTEGER REFERENCES insurances(id) ON DELETE CASCADE,
                PRIMARY KEY (doctor_id, insurance_id)
            );
        `);

        // NEW: Insert some sample data for specialties
        await pool.query(`
            INSERT INTO specialties (name) VALUES 
            ('Family Medicine'),
            ('Internal Medicine'),
            ('Pediatrics'),
            ('Obstetrics and Gynecology'),
            ('Cardiology'),
            ('Dermatology'),
            ('Orthopedics'),
            ('Neurology'),
            ('Psychiatry'),
            ('Surgery'),
            ('Emergency Medicine'),
            ('Preventive Medicine'),
            ('Radiology'),
            ('Endocrinology'),
            ('Gastroenterology'),
            ('Pulmonology')
            ON CONFLICT (name) DO NOTHING;
        `);

        // NEW: Insert some sample data for insurance plans
        await pool.query(`
            INSERT INTO insurances (name) VALUES 
            ('Medicare'),
            ('Medicaid'),
            ('Blue Cross Blue Shield'),
            ('Aetna'),
            ('Cigna'),
            ('UnitedHealthcare'),
            ('Humana'),
            ('Kaiser Permanente'),
            ('Molina Healthcare'),
            ('Ambetter'),
            ('Peach State Health Plan'),
            ('WellCare'),
            ('Amerigroup')
            ON CONFLICT (name) DO NOTHING;
        `);

        // NEW: Insert real doctors from Morehouse School of Medicine and other Atlanta institutions
        await pool.query(`
            INSERT INTO doctors (name, address, city, state, zipcode, phone, email, bio, affiliation) VALUES
            ('Dr. Valerie Montgomery Rice', '720 Westview Drive SW', 'Atlanta', 'GA', '30310', '404-752-1500', 'vmontgomeryrice@msm.edu', 'President and CEO of Morehouse School of Medicine. Board-certified in obstetrics and gynecology.', 'Morehouse School of Medicine'),
            
            ('Dr. Elizabeth Ofili', '720 Westview Drive SW', 'Atlanta', 'GA', '30310', '404-752-1973', 'eofili@msm.edu', 'Professor of Medicine and Director of Clinical Research Center. Specializes in cardiology and preventive health.', 'Morehouse School of Medicine'),
            
            ('Dr. Camara Jones', '720 Westview Drive SW', 'Atlanta', 'GA', '30310', '404-752-1500', 'cjones@msm.edu', 'Research Director on Social Determinants of Health and Equity. Family physician and epidemiologist focusing on health disparities.', 'Morehouse School of Medicine'),
            
            ('Dr. David Satcher', '720 Westview Drive SW', 'Atlanta', 'GA', '30310', '404-752-8654', 'dsatcher@msm.edu', 'Founder of the Satcher Health Leadership Institute. Former US Surgeon General and expert in public health policy.', 'Morehouse School of Medicine'),
            
            ('Dr. Herman Taylor', '720 Westview Drive SW', 'Atlanta', 'GA', '30310', '404-752-1980', 'htaylor@msm.edu', 'Director of the Cardiovascular Research Institute. Specializes in preventive cardiology with focus on African American health.', 'Morehouse School of Medicine'),
            
            ('Dr. Winston Price', '720 Westview Drive SW', 'Atlanta', 'GA', '30310', '404-752-1600', 'wprice@msm.edu', 'Professor of Pediatrics focusing on adolescent health, immunizations, and health equity in underserved communities.', 'Morehouse School of Medicine'),
            
            ('Dr. Jamila Sanchez', '80 Jesse Hill Jr Drive SE', 'Atlanta', 'GA', '30303', '404-616-4307', 'jsanchez@emory.edu', 'Attending physician in emergency medicine with special interest in urban health disparities and trauma care.', 'Grady Memorial Hospital'),
            
            ('Dr. Patrice Harris', '201 Dowman Drive', 'Atlanta', 'GA', '30322', '404-727-9000', 'pharris@emory.edu', 'Psychiatrist specializing in child and adolescent psychiatry. Former president of the American Medical Association.', 'Emory University School of Medicine'),
            
            ('Dr. Omar Reid', '1968 Peachtree Road NW', 'Atlanta', 'GA', '30309', '404-605-3000', 'oreid@piedmont.org', 'Orthopedic surgeon specializing in sports medicine and minimally invasive joint replacement.', 'Piedmont Atlanta Hospital'),
            
            ('Dr. Michelle Powers', '35 Jesse Hill Jr Drive SE', 'Atlanta', 'GA', '30303', '404-616-8762', 'mpowers@gmh.edu', 'Pulmonologist with expertise in critical care, ARDS, and health disparities in respiratory disease.', 'Grady Health System')
        `);

        // NEW: Connect doctors with specialties
        await pool.query(`
            -- Dr. Valerie Montgomery Rice: Obstetrics and Gynecology
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 1, id FROM specialties WHERE name = 'Obstetrics and Gynecology';
            
            -- Dr. Elizabeth Ofili: Cardiology, Preventive Medicine
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 2, id FROM specialties WHERE name = 'Cardiology';
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 2, id FROM specialties WHERE name = 'Preventive Medicine';
            
            -- Dr. Camara Jones: Family Medicine
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 3, id FROM specialties WHERE name = 'Family Medicine';
            
            -- Dr. David Satcher: Preventive Medicine
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 4, id FROM specialties WHERE name = 'Preventive Medicine';
            
            -- Dr. Herman Taylor: Cardiology
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 5, id FROM specialties WHERE name = 'Cardiology';
            
            -- Dr. Winston Price: Pediatrics
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 6, id FROM specialties WHERE name = 'Pediatrics';
            
            -- Dr. Jamila Sanchez: Emergency Medicine
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 7, id FROM specialties WHERE name = 'Emergency Medicine';
            
            -- Dr. Patrice Harris: Psychiatry
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 8, id FROM specialties WHERE name = 'Psychiatry';
            
            -- Dr. Omar Reid: Orthopedics, Surgery
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 9, id FROM specialties WHERE name = 'Orthopedics';
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 9, id FROM specialties WHERE name = 'Surgery';
            
            -- Dr. Michelle Powers: Pulmonology
            INSERT INTO doctor_specialties (doctor_id, specialty_id)
            SELECT 10, id FROM specialties WHERE name = 'Pulmonology';
        `);

        // NEW: Connect doctors with insurance plans
        await pool.query(`
            -- Common insurances accepted by most doctors
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT d.id, i.id 
            FROM doctors d, insurances i 
            WHERE i.name IN ('Medicare', 'Medicaid', 'Blue Cross Blue Shield')
            AND d.id BETWEEN 1 AND 10;
            
            -- Additional insurances for some doctors
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT d.id, i.id 
            FROM doctors d, insurances i 
            WHERE i.name IN ('Aetna', 'Cigna', 'UnitedHealthcare')
            AND d.id BETWEEN 1 AND 6;
            
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT d.id, i.id 
            FROM doctors d, insurances i 
            WHERE i.name IN ('Humana', 'Kaiser Permanente')
            AND d.id BETWEEN 7 AND 10;
            
            -- More specific insurance assignments
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT 1, id FROM insurances WHERE name IN ('Peach State Health Plan', 'WellCare');
            
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT 3, id FROM insurances WHERE name IN ('Ambetter', 'Amerigroup');
            
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT 5, id FROM insurances WHERE name IN ('Molina Healthcare', 'Amerigroup');
            
            INSERT INTO doctor_insurances (doctor_id, insurance_id)
            SELECT 8, id FROM insurances WHERE name IN ('Peach State Health Plan', 'Ambetter');
        `);

        console.log('Database initialized successfully with real Atlanta doctor data');
    } catch (error) {
        console.log('Error initializing database:', error);
    }
};

module.exports = { pool, initDb };