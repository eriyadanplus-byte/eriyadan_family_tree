-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'editor', 'contributor', 'viewer') DEFAULT 'viewer',
  status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  generation INT NOT NULL,
  is_late BOOLEAN DEFAULT false,
  birth_year INT,
  death_year INT,
  role ENUM('super_admin', 'editor', 'contributor', 'viewer') DEFAULT 'viewer',
  profile_photo_url VARCHAR(500),
  gender ENUM('male', 'female', 'other'),
  dob DATE,
  dod DATE,
  location VARCHAR(255),
  bio TEXT,
  instagram VARCHAR(255),
  linkedin VARCHAR(255),
  twitter VARCHAR(255),
  whatsapp VARCHAR(20),
  father_id INT,
  mother_id INT,
  spouse_id INT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (father_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (mother_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (spouse_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  child_id INT NOT NULL,
  type ENUM('father', 'mother', 'spouse') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_relationship (parent_id, child_id, type)
);

-- Insert seed data (admin user)
INSERT IGNORE INTO members (id, full_name, mobile_number, email, generation, is_late, role, location, bio)
VALUES (1, 'Adeline H. Eriyadan', '+447123456789', 'admin@eriyaden.com', 7, false, 'super_admin', 'London, UK', 'A passionate genealogist dedicated to preserving our family legacy.');

INSERT IGNORE INTO users (member_id, email, password, role, status)
VALUES (1, 'admin@eriyaden.com', '$2a$10$hash_here', 'super_admin', 'active');

SELECT 'Database setup complete!' as message;
