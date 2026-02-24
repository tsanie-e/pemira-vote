SELECT id, email, password_hash
FROM admins
WHERE email = ?
LIMIT 1;


SELECT id, token, status, created_at, used_at
FROM tokens
ORDER BY created_at DESC;

INSERT INTO tokens (token, status)
VALUES (?, 'active');


SELECT c.id, c.name, c.photo, COUNT(v.id) AS total_votes
FROM candidates c
LEFT JOIN votes v ON v.candidate_id = c.id
GROUP BY c.id, c.name, c.photo
ORDER BY c.id ASC;


SELECT status, COUNT(*) AS total
FROM tokens
GROUP BY status;

SELECT is_ended, ended_at
FROM election_settings
WHERE id = 1
LIMIT 1;

SELECT v.id, t.token, c.id AS candidate_id, c.name AS candidate_name, v.created_at
FROM votes v
INNER JOIN tokens t ON t.id = v.token_id
INNER JOIN candidates c ON c.id = v.candidate_id
ORDER BY v.created_at DESC;

UPDATE election_settings
SET is_ended = 1,
    ended_at = CURRENT_TIMESTAMP
WHERE id = 1;

UPDATE tokens
SET status = 'used',
    used_at = COALESCE(used_at, CURRENT_TIMESTAMP)
WHERE status = 'active';

SELECT is_ended
FROM election_settings
WHERE id = 1
LIMIT 1;

SELECT id, token, status
FROM tokens
WHERE token = ? AND status = 'active'
LIMIT 1;

SELECT id
FROM candidates
WHERE id = ?
LIMIT 1;

INSERT INTO votes (token_id, candidate_id)
VALUES (?, ?);

UPDATE tokens
SET status = 'used',
    used_at = CURRENT_TIMESTAMP
WHERE id = ?;
