-- newgaon 사용자의 superadmin 권한 복구
UPDATE users SET role = 'superadmin' WHERE id = 2 AND username = 'newgaon';

-- 확인
SELECT id, username, name, role, tenant_id FROM users WHERE id = 2;
