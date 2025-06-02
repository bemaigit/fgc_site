-- Script para atualizar senha do usuário
-- Usuário: w.betofoto@hotmail.com
-- ID: 0ae569d4-e20f-4a44-bde3-ef29b05e112f
-- Nova senha: C@ntafgc1104 (bcrypt hash será usado)

-- Supondo que a tabela Account armazena as senhas
UPDATE "Account"
SET password = '$2a$10$oGkD73lCSXI/5JD3.fOsBOrntPLBRvUYWYTr0TxbyPvDBhpw5Ujxe'  -- Hash bcrypt para 'C@ntafgc1104'
WHERE "userId" = '0ae569d4-e20f-4a44-bde3-ef29b05e112f';

-- Alternativamente, você pode querer atualizar por email (se 'User' e 'Account' estiverem relacionadas)
-- UPDATE "Account" a
-- SET password = '$2a$10$oGkD73lCSXI/5JD3.fOsBOrntPLBRvUYWYTr0TxbyPvDBhpw5Ujxe'
-- FROM "User" u
-- WHERE a."userId" = u.id AND u.email = 'w.betofoto@hotmail.com';
