-- admin 계정 삭제
DELETE FROM users WHERE id = 1 AND username = 'admin';

-- 삭제 확인
SELECT id, username, name, role, tenant_id FROM users ORDER BY id;
