-- Limpar documentos existentes
DELETE FROM "LegalDocuments";

-- Inserir documentos legais iniciais
INSERT INTO "LegalDocuments" ("id", "type", "title", "content", "isActive", "createdAt", "updatedAt")
VALUES
  (
    'legal-doc-lgpd',
    'lgpd',
    'Lei Geral de Proteção de Dados (LGPD)',
    E'A Federação Goiana de Ciclismo está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n\nBases Legais\n\nProcessamos dados pessoais com base em:\n- Consentimento do titular\n- Cumprimento de obrigação legal\n- Execução de contrato\n- Legítimo interesse\n\nDireitos do Titular\n\nConforme a LGPD, você tem direito a:\n1. Confirmação da existência de tratamento\n2. Acesso aos dados\n3. Correção de dados incompletos\n4. Anonimização ou bloqueio\n5. Portabilidade\n6. Eliminação\n7. Informação sobre compartilhamento\n8. Revogação do consentimento\n\nMedidas de Segurança\n\nImplementamos:\n- Criptografia de dados\n- Controles de acesso\n- Políticas de segurança\n- Treinamento de equipe\n\nEncarregado de Dados (DPO)\n\nNosso DPO pode ser contatado em: dpo@fgc.org.br\n\nRelatório de Impacto\n\nMantemos Relatório de Impacto à Proteção de Dados Pessoais, disponível mediante solicitação justificada.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'legal-doc-privacy',
    'privacy-policy',
    'Política de Privacidade',
    E'A Federação Goiana de Ciclismo (FGC) está comprometida com a proteção da sua privacidade.\n\nColeta de Dados\n\nColetamos os seguintes tipos de informações:\n- Informações de cadastro (nome, e-mail, telefone)\n- Dados de atleta (quando aplicável)\n- Informações de pagamento\n- Dados de uso do site\n\nUso das Informações\n\nUtilizamos seus dados para:\n- Gerenciar sua filiação\n- Processar inscrições em eventos\n- Enviar comunicações importantes\n- Melhorar nossos serviços\n\nProteção de Dados\n\nImplementamos medidas de segurança para proteger suas informações, incluindo:\n- Criptografia de dados sensíveis\n- Controle de acesso\n- Backups regulares\n- Monitoramento de segurança\n\nSeus Direitos\n\nVocê tem direito a:\n- Acessar seus dados\n- Corrigir informações incorretas\n- Solicitar exclusão de dados\n- Revogar consentimentos\n\nContato\n\nPara questões sobre privacidade: privacidade@fgc.org.br',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'legal-doc-terms',
    'terms-of-use',
    'Termos de Uso',
    E'Bem-vindo aos Termos de Uso da Federação Goiana de Ciclismo (FGC).\n\nAceitação dos Termos\n\nAo acessar e usar este site, você concorda com estes termos de uso.\n\nUso do Site\n\nO site deve ser usado para:\n- Filiação de atletas e clubes\n- Inscrição em eventos\n- Acesso a informações sobre competições\n- Consulta de rankings e resultados\n\nContas de Usuário\n\n- Você é responsável por manter a segurança de sua conta\n- Informações fornecidas devem ser precisas\n- A FGC pode suspender contas que violem os termos\n\nPagamentos\n\n- Taxas de filiação e inscrições são não-reembolsáveis\n- Pagamentos são processados por gateways seguros\n- Valores são em reais (BRL)\n\nPropriedade Intelectual\n\n- O conteúdo do site é propriedade da FGC\n- Uso não autorizado é proibido\n- Logomarcas e marcas registradas são protegidas\n\nContato\n\nPara dúvidas sobre os termos: termos@fgc.org.br',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
