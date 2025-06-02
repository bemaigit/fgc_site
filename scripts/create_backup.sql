\o '/home/usuario/fgc_deploy/fgc_02/backup_15_maio_2025.sql'
\echo '-- Backup do banco FGC - 15 de Maio de 2025'
\echo '-- Este arquivo contém comandos SQL para restaurar os dados'
\echo ''

-- Exportar dados da tabela AthleteProfile com o novo campo gender
\echo '-- Dados da tabela AthleteProfile'
SELECT 'INSERT INTO "AthleteProfile" ("id", "athleteId", "biography", "achievements", "socialMedia", "websiteUrl", "gender", "createdAt", "updatedAt") VALUES ('
       || quote_literal(id) || ', '
       || quote_literal(athleteId) || ', '
       || COALESCE(quote_literal(biography), 'NULL') || ', '
       || COALESCE(quote_literal(achievements), 'NULL') || ', '
       || COALESCE(quote_literal(socialMedia::text), 'NULL') || ', '
       || COALESCE(quote_literal(websiteUrl), 'NULL') || ', '
       || COALESCE(quote_literal(gender), 'NULL') || ', '
       || quote_literal(createdAt) || ', '
       || quote_literal(updatedAt) || ');'
FROM "AthleteProfile";

-- Verificação da estrutura atual da tabela AthleteProfile
\echo '-- Estrutura da tabela AthleteProfile'
\d "AthleteProfile"

-- Estatísticas sobre o campo gender
\echo '-- Estatísticas do campo gender'
SELECT gender, COUNT(*) 
FROM "AthleteProfile" 
GROUP BY gender;
