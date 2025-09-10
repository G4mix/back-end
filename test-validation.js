const axios = require('axios');

async function testValidation() {
  try {
    console.log('🧪 Testando validação automática...\n');

    // Teste 1: Email inválido no signup
    console.log('1. Testando email inválido no signup...');
    try {
      await axios.post('http://localhost:3000/api/v1/auth/signup', {
        username: 'testuser',
        email: 'email-invalido',
        password: 'Test123!'
      });
      console.log('❌ ERRO: Email inválido foi aceito!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Email inválido rejeitado corretamente');
        console.log('   Resposta:', error.response.data);
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    }

    // Teste 2: Senha fraca no signup
    console.log('\n2. Testando senha fraca no signup...');
    try {
      await axios.post('http://localhost:3000/api/v1/auth/signup', {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      });
      console.log('❌ ERRO: Senha fraca foi aceita!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Senha fraca rejeitada corretamente');
        console.log('   Resposta:', error.response.data);
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    }

    // Teste 3: Título muito curto na criação de idea
    console.log('\n3. Testando título muito curto na criação de idea...');
    try {
      await axios.post('http://localhost:3000/api/v1/ideas', {
        title: 'Curto',
        description: 'Esta é uma descrição muito longa que deve passar na validação porque tem mais de 50 caracteres e menos de 700 caracteres como exigido pelo schema de validação.'
      }, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('❌ ERRO: Título curto foi aceito!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Título curto rejeitado corretamente');
        console.log('   Resposta:', error.response.data);
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    }

    // Teste 4: URL inválida em link pessoal
    console.log('\n4. Testando URL inválida em link pessoal...');
    try {
      await axios.post('http://localhost:3000/api/v1/users/links', {
        url: 'url-invalida'
      }, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('❌ ERRO: URL inválida foi aceita!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ URL inválida rejeitada corretamente');
        console.log('   Resposta:', error.response.data);
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    }

    console.log('\n🎉 Testes de validação concluídos!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testValidation();
