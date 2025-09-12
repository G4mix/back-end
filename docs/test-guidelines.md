Para todo e qualquer teste que for modificado deve-se seguir as seguintes regras

0 - As regras aqui são absolutas devem ser sempre seguidas para realizar testes;
1 - Todos os testes devem seguir o Arrange, Act, Assert;
2 - Os mocks devem ser a principio pegos do global e devem ser modificados de acordo com o resultado necessário;
3 - Sempre deve deixar apenas o servidor principal de pé nunca subir mais de um servidor de teste;
4 - Os testes devem cobrir 100% das linhas das features relacionadas a ele se o request for para /v1/signup deve cobrir 100% das linhas que forem chamadas nele;
5 - Todos os testes devem passar;
6 - Para gerar tokens sempre deve usar o helper test-tokens.ts;
7 - Em caso de problemas sempre deve avaliar se tem algum helper que possa ajudar já pronto antes de inventar;
8 - Nunca falsificar resultados alterando o código real para que o teste passe, apenas concertar se for uma falha real do código;
9 - Nunca fazer requisições para banco de dados, ou serviços externos, sempre fazer mock disso;
10 - No jest.setup tem os mocks qualquer mock pode ser manipulado através dele das importações de lá, lide com isso da melhor forma possível;
11 - Os mocks devem ser feitos apenas nas seguintes injeções que são as interações diretas que devem ser mockadas, os testes devem funcionar mockando apenas essas injeções:
- @inject('SESClient') private ses: SESClient;
- @inject('S3Client') private s3: S3Client;
- @inject('PostgresqlClient') private prisma: PrismaClient;
- No axios quando necessário, e deve usar os mocks existentes no setup de testes lá tem alguns já;
12 - Cada branch, function, line e statement deve estar 100% na pasta coverage;
13 - Os mocks devem ser apenas dos principais já citados e nos 3 primeiros citados: SESClient, S3Client, PostgresqlClient, o mock deve ser feito fazendo um import { container } from 'tsyringe' no topo do arquivo e importando do container as any para então realizar o mock.

Objetivo final: Quero 100% de cobertura na minha aplicação de acordo com a regra 12, fazendo apenas requisições sem ter que criar um teste para um arquivo específico. Os que não forem necessário serem testados eu tiro do coverage.