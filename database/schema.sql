CREATE DATABASE IF NOT EXISTS pemira_voting
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pemira_voting;

DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS election_settings;

CREATE TABLE tokens (
  id INT NOT NULL AUTO_INCREMENT,
  token VARCHAR(8) NOT NULL,
  status ENUM('active', 'used') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tokens_token (token),
  KEY idx_tokens_status (status),
  KEY idx_tokens_created_at (created_at),
  CONSTRAINT chk_token_pin_format CHECK (token REGEXP '^(?:[0-9]{6}|[0-9]{8})$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE election_settings (
  id TINYINT NOT NULL,
  is_ended TINYINT(1) NOT NULL DEFAULT 0,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_election_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE candidates (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  photo VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE votes (
  id INT NOT NULL AUTO_INCREMENT,
  token_id INT NOT NULL,
  candidate_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_votes_token_id (token_id),
  KEY idx_votes_candidate_id (candidate_id),
  KEY idx_votes_created_at (created_at),
  CONSTRAINT fk_votes_token FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_votes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tokens (token, status) VALUES
  ('123456', 'active'),
  ('87654321', 'active'),
  ('111111', 'used');

INSERT INTO admins (email, password_hash) VALUES
  ('adminpemira@gmail.com', '$2b$10$5WbwKLeyFuKyTiLhfHPKKelgg92dgShxqb5c1bE6tA67fUofB/18m');

INSERT INTO election_settings (id, is_ended, ended_at) VALUES
  (1, 0, NULL);

INSERT INTO candidates (name, photo) VALUES
  ('Nayla Almaqhfira R.', '/assets/paslon1.jpeg'),
  ('Daffadin Nabil S.', '/assets/paslon2.jpeg'),
  ('Naila Zhafira I.', '/assets/paslon3.jpeg');
