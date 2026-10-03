# Plataforma Reino — login com Google
Data: 03/10/2026, 18:22 (Brasília).
Referência: LOGIN/GOOGLE/REINO/20261003-35DA6E6. Referência baseada no commit; último número sequencial dos protocolos anteriores não verificado.

## Entregas
- [x] Botão Entrar com Google integrado à tela de login do hub.
- [x] Botão exibido somente quando o provedor Google estiver habilitado.
- [x] Retorno à plataforma e preservação do destino interno permitido.
- [x] Proteção do fragmento de autenticação durante a inicialização do aplicativo.
- [x] Mensagem de erro e possibilidade de tentar novamente.
- [x] Verificação de sintaxe e testes simulados: provedor ativo/inativo, chamada OAuth, retorno e erro.
- [x] Código confirmado na página publicada.
- [ ] Credenciais Google Cloud configuradas e provedor ativado.
- [ ] Teste completo com uma conta Google real.

## Motivo
Simplificar a entrada na plataforma com uma conta Google.

## Pendência confirmada
O endpoint público de configuração do Supabase retornou external.google=false. As ferramentas disponíveis nesta sessão não oferecem configuração de provedores Auth nem criação de credenciais Google Cloud. Nenhuma credencial Google foi fornecida.

## Configuração para concluir
1. Criar/configurar um cliente OAuth do tipo aplicação Web no Google Cloud, com público adequado aos usuários da plataforma e escopos openid, email e profile.
2. Origem autorizada: https://khassiooluver1988-droid.github.io
3. URI de redirecionamento Google: https://baiwbuezoazfjbyqwnlv.supabase.co/auth/v1/callback
4. Inserir Client ID e Client Secret no provedor Google do Supabase e habilitá-lo. O segredo fica somente no servidor.
5. Autorizar no Supabase o retorno: https://khassiooluver1988-droid.github.io/plataforma-reino-online/index.html (incluindo os retornos internos necessários, limitados a esse domínio e caminho).
6. Validar com uma conta Google real: consentimento, retorno ao hub, perfil, sessão e acesso ao curso.

## Evidências
Commits: 2a6b5d3852855c2643df5188434024b41fe1ff9c e 35da6e6a0d35978cfa957af8bd648a17022ba2ec.
Documentação: https://supabase.com/docs/guides/auth/social-login/auth-google

Status final: integração preparada e publicada; login Google ainda não ativo.
