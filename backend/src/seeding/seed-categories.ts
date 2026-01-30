import { Category } from '../categories/entities/category.entity';
import { AppDataSource } from '../config/db.config';
import { skillsCategoriesData as skillsCategories } from './skillData';

async function seedCategoriesTree() {
  try {
    await AppDataSource.initialize();
    console.log('✅ DataSource инициализирован');

    const categoryRepository = AppDataSource.getRepository(Category);

    // Проверяем, есть ли уже данные в таблице категорий
    const existingCategoriesCount = await categoryRepository.count();

    if (existingCategoriesCount > 0) {
      console.log('📊 Таблица категорий уже содержит данные:');
      console.log(`   Количество записей: ${existingCategoriesCount}`);

      // Можно вывести статистику существующих данных
      const allCategories = await categoryRepository.find({
        relations: ['parent'],
      });

      const parentCount = allCategories.filter((c) => c.parent === null).length;
      const childCount = allCategories.filter((c) => c.parent !== null).length;

      console.log(`   Родительских категорий: ${parentCount}`);
      console.log(`   Дочерних категорий: ${childCount}`);

      console.log('\n⚠️  Seed не выполнен. Таблица уже содержит данные.');
      console.log('   Если нужно перезаписать данные:');
      console.log('   1. Удалите записи вручную');
      console.log('   2. Или запустите: TRUNCATE TABLE category CASCADE;');

      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      console.log('🔌 Подключение закрыто');
      return; // Прерываем выполнение
    }

    console.log('📭 Таблица категорий пуста. Начинаем сидирование...');

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
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Подключение закрыто');
    }
  }
}

seedCategoriesTree().catch((error) => {
  console.error('❌ Необработанная ошибка:', error);
  process.exit(1);
});
