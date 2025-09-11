Para todo e qualquer teste que for modificado deve-se seguir as seguintes regras

1 - Todos os testes devem seguir o Arrange, Act, Assert;
2 - Os mocks devem ser a principio pegos do global e devem ser modificados de acordo com o resultado necessário;
3 - Sempre deve deixar apenas o servidor principal de pé nunca subir mais de um servidor de teste;
4 - Os testes devem cobrir 100% das linhas das features relacionadas a ele se o request for para /v1/signup deve cobrir 100% das linhas que forem chamadas nele;
5 - Todos os testes devem passar;
6 - Para gerar tokens sempre deve usar o helper test-tokens.ts;
7 - Em caso de problemas sempre deve avaliar se tem algum helper que possa ajudar já pronto antes de inventar;
8 - Nunca falsificar resultados alterando o código real para que o teste passe, apenas concertar se for uma falha real do código;
9 - Nunca fazer requisições para banco de dados, ou serviços externos, sempre fazer mock disso.

Objetivo final: Quero 100% de cobertura na minha aplicação fazendo apenas essas requisições sem ter que criar um teste para um arquivo específico, apenas fazendo as requisições dessa forma e claro deixando um pouco de lado os arquivos puramente pra tipagem, esses da pasta types nem precisam ser contados no coverage.