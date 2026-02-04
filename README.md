💰 Digital Wallet API
Esta é uma API robusta de Carteira Digital desenvolvida com NestJS, focada em transações seguras, escalabilidade e alta observabilidade. O sistema permite a criação de usuários, gestão de saldo e transferências entre contas com proteção contra condições de corrida (Race Conditions).

🚀 Tecnologias Utilizadas
Runtime: Node.js v22/24

Framework: NestJS (v10+)

Banco de Dados: PostgreSQL 15

ORM: TypeORM (com suporte a Transações ACID)

Autenticação: JWT (JSON Web Token) + Passport

Documentação: Swagger / OpenAPI

Containerização: Docker & Docker Compose

Testes: Jest

🏗️ Diferenciais Técnicos (O que o avaliador deve observar)
1. Integridade Financeira com Pessimistic Locking
Para evitar o problema de "gasto duplo" (double-spending), implementamos Pessimistic Write Locks no banco de dados. Isso garante que, enquanto uma transação está sendo processada, as carteiras envolvidas ficam travadas para outras operações, mantendo a consistência do saldo.

2. Observabilidade e Registro
A aplicação utiliza um sistema de logs estruturado e um Global Exception Filter. Todos os erros são capturados, registrados no console do container e retornados de forma padronizada para o cliente, facilitando o rastreamento de bugs em produção.

3. Segurança e Auditoria
Hasheamento de senhas com Bcrypt.

Reversão de Transações: Caso uma fraude ou erro seja detectado, o sistema permite reverter a última transação, bloqueando automaticamente a carteira do pagador para auditoria.

🛠️ Como Executar
Pré-requisitos
Docker e Docker Compose instalados.

Passo a Passo
Clone o repositório:

Bash
git clone https://github.com/seu-usuario/teste-nest.git
cd teste-nest
Configure as variáveis de ambiente: A aplicação já vem configurada para rodar no Docker com os valores padrão. Se desejar alterar, edite o arquivo docker-compose.yml.

Suba os containers:

Bash
docker-compose up --build
A API estará disponível em http://localhost:3000.

Acesse a Documentação (Swagger): Abra o navegador em: http://localhost:3000/api/docs

🧪 Testes
A aplicação possui uma cobertura abrangente de testes unitários em todas as camadas (Controllers e Services).

Para rodar os testes unitários:

Bash
# Localmente
npm run test

# Verificando a cobertura (Coverage)
npm run test:cov