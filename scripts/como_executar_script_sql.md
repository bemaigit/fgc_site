# Instruções para Executar o Script SQL

## Opção 1: Usando o pgAdmin

1. Abra o pgAdmin e conecte-se ao banco de dados do projeto
2. Selecione o banco de dados correto
3. Clique com o botão direito e selecione "Query Tool"
4. Cole o conteúdo do arquivo `create_ranking_tables.sql`
5. Clique em "Execute" (ou pressione F5)

## Opção 2: Usando o terminal (com Docker)

```bash
# Acesse o container do PostgreSQL
docker exec -it [nome_do_container_postgres] bash

# Dentro do container, conecte-se ao banco de dados
psql -U [usuario] -d [nome_do_banco]

# Cole o conteúdo do script SQL ou execute-o com:
\i /caminho/para/create_ranking_tables.sql
```

## Opção 3: Usando o Docker diretamente

```bash
# Execute o script diretamente no container
docker exec -i [nome_do_container_postgres] psql -U [usuario] -d [nome_do_banco] < scripts/create_ranking_tables.sql
```

Substitua `[nome_do_container_postgres]`, `[usuario]` e `[nome_do_banco]` pelos valores corretos do seu ambiente.

## Verificação

Após executar o script, você pode verificar se as tabelas foram criadas corretamente com:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('RankingModality', 'RankingCategory');
```
