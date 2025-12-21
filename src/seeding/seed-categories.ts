import { IsNull, Not } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { AppDataSource } from '../config/db.config';

const skillsCategories = {
  'Бизнес и карьера': [
    'Управление командой',
    'Маркетинг и реклама',
    'Продажи и переговоры',
    'Личный бренд',
    'Резюме и собеседование',
    'Тайм-менеджмент',
    'Проектное управление',
    'Предпринимательство',
  ],
  'Творчество и искусство': [
    'Рисование и иллюстрация',
    'Фотография',
    'Видеомонтаж',
    'Музыка и звук',
    'Актёрское мастерство',
    'Креативное письмо',
    'Арт-терапия',
    'Декор и DIY',
  ],
  'Иностранные языки': [
    'Английский',
    'Французский',
    'Испанский',
    'Немецкий',
    'Китайский',
    'Японский',
    'Подготовка к экзаменам (IELTS, TOEFL)',
  ],
  'Образование и развитие': [
    'Личностное развитие',
    'Навыки обучения',
    'Когнитивные техники',
    'Скорочтение',
    'Навыки преподавания',
    'Коучинг',
  ],
  'Дом и уют': [
    'Уборка и организация',
    'Домашние финансы',
    'Приготовление еды',
    'Домашние растения',
    'Ремонт',
    'Хранение вещей',
  ],
  'Здоровье и лайфстайл': [
    'Йога и медитация',
    'Питание и ЗОЖ',
    'Ментальное здоровье',
    'Осознанность',
    'Физические тренировки',
    'Сон и восстановление',
    'Баланс жизни и работы',
  ],
} as const;

async function seedCategoriesTree() {
  // const AppDataSource = new DataSource({
  //   type: 'postgres',
  //   host: process.env.POSTGRES_HOST || 'localhost',
  //   port: parseInt(process.env.POSTGRES_PORT || '5432'),
  //   username: process.env.POSTGRES_USER || 'postgres',
  //   password: process.env.POSTGRES_PASSWORD || 'postgres',
  //   database: process.env.POSTGRES_DB || 'skillswap',
  //   entities: [Category],
  //   synchronize: false,
  // });

  try {
    await AppDataSource.initialize();
    console.log('✅ DataSource инициализирован');

    const categoryRepository = AppDataSource.getRepository(Category);

    // Очистка старых данных (опционально, удалит всё каскадом)
    await categoryRepository.delete({ id: Not(IsNull()) });

    const createdParentCategories: Map<string, Category> = new Map();

    // 1. Создаём родительские категории
    for (const parentCategoryName of Object.keys(skillsCategories)) {
      console.log(`Создаю родительскую категорию: ${parentCategoryName}`);

      const parentCategory = categoryRepository.create({
        name: parentCategoryName,
        parent: null, // Явно указываем null
      });

      await categoryRepository.save(parentCategory);
      createdParentCategories.set(parentCategoryName, parentCategory);
      console.log(
        `✅ Создана: ${parentCategoryName} (ID: ${parentCategory.id})`,
      );
    }

    // 2. Создаём дочерние категории (подкатегории)
    for (const [parentName, subcategories] of Object.entries(
      skillsCategories,
    )) {
      const parentCategory = createdParentCategories.get(parentName);

      if (!parentCategory) {
        console.error(`❌ Родительская категория не найдена: ${parentName}`);
        continue;
      }

      console.log(`\nДобавляю подкатегории для: ${parentName}`);

      for (const subcategoryName of subcategories) {
        const childCategory = categoryRepository.create({
          name: subcategoryName,
          parent: parentCategory, // Указываем родителя
        });

        await categoryRepository.save(childCategory);
        console.log(`   ✅ ${subcategoryName}`);
      }
    }

    console.log('\n🎉 Сидирование дерева категорий завершено!');

    // Выводим статистику
    const allCategories = await categoryRepository.find({
      relations: ['parent', 'children'],
    });

    const parentCount = allCategories.filter((c) => c.parent === null).length;
    const childCount = allCategories.filter((c) => c.parent !== null).length;

    console.log(`📊 Статистика:`);
    console.log(`   Родительских категорий: ${parentCount}`);
    console.log(`   Дочерних категорий: ${childCount}`);
    console.log(`   Всего: ${allCategories.length}`);
  } catch (error) {
    console.error('❌ Ошибка при сидировании:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Подключение закрыто');
  }
}

seedCategoriesTree().catch((error) => {
  console.error('❌ Необработанная ошибка:', error);
  process.exit(1);
});
