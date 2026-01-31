const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Criar admin padrao
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cantina.com' },
    update: {},
    create: {
      email: 'admin@cantina.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log('Admin criado:', admin.email);

  // Criar usuario de teste
  const userPassword = await bcrypt.hash('user123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'usuario@teste.com' },
    update: {},
    create: {
      email: 'usuario@teste.com',
      password: userPassword,
      name: 'Usuario Teste',
      phone: '(11) 99999-9999',
      role: 'CLIENTE',
    },
  });

  // Criar carrinho para usuario de teste
  await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log('Usuario de teste criado:', user.email);

  // Criar categorias
  const categoriesData = [
    { name: 'Lanches', description: 'Sanduiches, hamburgueres e salgados', sortOrder: 1 },
    { name: 'Bebidas', description: 'Refrigerantes, sucos e agua', sortOrder: 2 },
    { name: 'Doces', description: 'Sobremesas e guloseimas', sortOrder: 3 },
    { name: 'Refeicoes', description: 'Pratos executivos e marmitas', sortOrder: 4 },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories.push(category);
  }

  console.log('Categorias criadas:', categories.length);

  // Criar produtos com imagens
  const productsData = [
    // Lanches
    { name: 'X-Burguer', description: 'Pao, hamburguer, queijo, alface e tomate', price: 12.50, categoryIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
    { name: 'X-Bacon', description: 'Pao, hamburguer, queijo, bacon, alface e tomate', price: 15.00, categoryIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop' },
    { name: 'Coxinha', description: 'Coxinha de frango tradicional', price: 6.00, categoryIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop' },
    { name: 'Pastel de Carne', description: 'Pastel frito recheado com carne moida', price: 7.00, categoryIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop' },
    { name: 'Pao de Queijo', description: 'Pao de queijo mineiro (unidade)', price: 4.00, categoryIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop' },

    // Bebidas
    { name: 'Refrigerante Lata', description: 'Coca-Cola, Guarana ou Fanta (350ml)', price: 5.00, categoryIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop' },
    { name: 'Suco Natural', description: 'Laranja, limao ou maracuja (500ml)', price: 7.00, categoryIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=300&fit=crop' },
    { name: 'Agua Mineral', description: 'Agua mineral sem gas (500ml)', price: 3.00, categoryIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop' },
    { name: 'Cafe Expresso', description: 'Cafe expresso tradicional', price: 4.50, categoryIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop' },
    { name: 'Cha Gelado', description: 'Cha gelado de pessego ou limao', price: 5.50, categoryIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop' },

    // Doces
    { name: 'Brigadeiro', description: 'Brigadeiro tradicional', price: 3.00, categoryIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&h=300&fit=crop' },
    { name: 'Pudim', description: 'Fatia de pudim de leite', price: 6.00, categoryIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
    { name: 'Bolo de Chocolate', description: 'Fatia de bolo de chocolate', price: 7.00, categoryIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop' },
    { name: 'Sorvete', description: 'Bola de sorvete (chocolate, morango ou creme)', price: 5.00, categoryIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop' },

    // Refeicoes
    { name: 'PF Completo', description: 'Arroz, feijao, carne, salada e batata frita', price: 18.00, categoryIndex: 3, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop' },
    { name: 'PF Frango', description: 'Arroz, feijao, frango grelhado e salada', price: 16.00, categoryIndex: 3, imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop' },
    { name: 'Marmita Fitness', description: 'Arroz integral, frango, legumes e salada', price: 20.00, categoryIndex: 3, imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop' },
    { name: 'Salada Completa', description: 'Mix de folhas, tomate, cenoura, milho e frango', price: 15.00, categoryIndex: 3, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
  ];

  let productsCreated = 0;
  for (const prod of productsData) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: prod.name },
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          categoryId: categories[prod.categoryIndex].id,
          imageUrl: prod.imageUrl,
          isAvailable: true,
        },
      });
      productsCreated++;
    } else {
      // Atualizar imagem se produto ja existe
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: { imageUrl: prod.imageUrl },
      });
    }
  }

  console.log('Produtos criados:', productsCreated);

  // Criar contador de pedidos
  await prisma.counter.upsert({
    where: { id: 'order_counter' },
    update: {},
    create: { id: 'order_counter', value: 0 },
  });

  console.log('Contador de pedidos inicializado');

  console.log('\\n=================================');
  console.log('Seed concluido com sucesso!');
  console.log('=================================');
  console.log('\\nCredenciais de acesso:');
  console.log('Admin: admin@cantina.com / admin123');
  console.log('Usuario: usuario@teste.com / user123');
  console.log('=================================\\n');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
