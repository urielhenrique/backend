SELECT id, email, "emailVerified", "emailVerificationToken" FROM "Usuario" WHERE email LIKE 'testuser_%' ORDER BY id DESC LIMIT 1;
