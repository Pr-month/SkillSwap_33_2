import { AppDataSource } from '../config/db.config';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import {
  skillsCategoriesData as fullCategoriesData,
  skillDescriptions,
  categoryImages,
  skillTitles,
} from './skillData';

async function seedSkills() {
  console.log('🚀 Запуск сидирования навыков для всех 42 подкатегорий...');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Подключено к БД');

    const skillRepository = AppDataSource.getRepository(Skill);
    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(Category);

    // Очистка существующих навыков
    await skillRepository.query('TRUNCATE TABLE "skill" CASCADE');
    console.log('🧹 Старые навыки удалены');

    // Получаем всех пользователей
    const allUsers = await userRepository.find();
    console.log(`👥 Найдено ${allUsers.length} пользователей`);

    // Получаем все категории с родителями
    const allCategories = await categoryRepository.find({
      relations: ['parent'],
    });

    // Создаем маппинг: название субкатегории -> объект Category
    const categoryMap = new Map<string, Category>();

    allCategories.forEach((category) => {
      categoryMap.set(category.name, category);
    });

    console.log('📊 Загружено категорий:', categoryMap.size);

    const skillsCreated: Skill[] = [];
    const skillsPerUser = new Map<string, number>();

    // Для каждого пользователя создаем навыки
    for (const user of allUsers) {
      let userSkillsCount = 0;

      // Каждый пользователь создает 2-5 навыков
      const maxSkills = Math.min(5, Math.floor(Math.random() * 4) + 2);

      // Собираем уже использованные субкатегории для этого пользователя
      const usedSubcategories = new Set<string>();

      for (let i = 0; i < maxSkills; i++) {
        // Выбираем случайную родительскую категорию
        const parentCategories = Object.keys(fullCategoriesData);
        const randomParent =
          parentCategories[Math.floor(Math.random() * parentCategories.length)];

        // Выбираем случайную субкатегорию из этой родительской
        const subcategories =
          fullCategoriesData[randomParent as keyof typeof fullCategoriesData];
        let randomSubcategory: string;

        // Пытаемся выбрать уникальную субкатегорию для пользователя
        let attempts = 0;
        do {
          randomSubcategory =
            subcategories[Math.floor(Math.random() * subcategories.length)];
          attempts++;
          if (attempts > 10) break; // Защита от бесконечного цикла
        } while (usedSubcategories.has(randomSubcategory) && attempts <= 10);

        usedSubcategories.add(randomSubcategory);

        // Находим категорию в БД
        const category = categoryMap.get(randomSubcategory);

        if (!category) {
          console.warn(`⚠️ Категория не найдена: ${randomSubcategory}`);
          continue;
        }

        // Получаем описание
        const description =
          skillDescriptions[
            randomSubcategory as keyof typeof skillDescriptions
          ] || 'Практический опыт и индивидуальный подход к обучению.';

        // Получаем варианты заголовков
        const titleOptions = skillTitles[
          randomSubcategory as keyof typeof skillTitles
        ] || [`Навык в ${randomSubcategory}`];
        const randomTitle =
          titleOptions[Math.floor(Math.random() * titleOptions.length)];

        // Выбираем изображения для этого навыка (3-5 штук)
        const parentImages =
          categoryImages[randomParent as keyof typeof categoryImages] || [];
        const shuffledImages = [...parentImages].sort(
          () => Math.random() - 0.5,
        );
        const selectedImages = shuffledImages.slice(
          0,
          Math.floor(Math.random() * 3) + 3,
        );

        // Создаем навык
        const skill = skillRepository.create({
          title: randomTitle,
          description: description,
          category: category,
          owner: user,
          images: selectedImages,
        });

        await skillRepository.save(skill);
        skillsCreated.push(skill);
        userSkillsCount++;

        console.log(`✅ ${user.name}: ${randomTitle} (${randomSubcategory})`);
      }

      skillsPerUser.set(user.id, userSkillsCount);
    }

    // Статистика по категориям
    const categoryStats = new Map<string, number>();
    skillsCreated.forEach((skill) => {
      const catName = skill.category.name;
      categoryStats.set(catName, (categoryStats.get(catName) || 0) + 1);
    });

    console.log('\n🎉 Сидирование навыков завершено!');
    console.log(
      '══════════════════════════════════════════════════════════════════',
    );
    console.log(`📊 ДЕТАЛЬНАЯ СТАТИСТИКА:`);
    console.log(`   Всего навыков создано: ${skillsCreated.length}`);
    console.log(`   Пользователей: ${allUsers.length}`);
    console.log(
      `   Субкатегорий использовано: ${categoryStats.size} из ${categoryMap.size}`,
    );

    console.log('\n📈 Навыков по пользователям:');
    const avgSkills = (skillsCreated.length / allUsers.length).toFixed(2);
    console.log(`   В среднем: ${avgSkills} навыка на пользователя`);

    console.log('\n🏷️  Навыков по категориям (топ-10):');
    const sortedStats = Array.from(categoryStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedStats.forEach(([category, count], index) => {
      console.log(`   ${index + 1}. ${category}: ${count} навыков`);
    });

    console.log(
      '══════════════════════════════════════════════════════════════════',
    );

    // Выводим примеры созданных навыков
    console.log('\n🔍 ПРИМЕРЫ СОЗДАННЫХ НАВЫКОВ:');
    console.log('════════════════════════════════════════');
    const sampleSkills = skillsCreated.slice(0, 5);
    sampleSkills.forEach((skill, index) => {
      console.log(`${index + 1}. "${skill.title}"`);
      console.log(`   Категория: ${skill.category.name}`);
      console.log(`   Владелец: ${skill.owner.name}`);
      console.log(`   Описание: ${skill.description.substring(0, 80)}...`);
      console.log(`   Изображений: ${skill.images.length}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Ошибка при сидировании навыков:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Подключение закрыто');
  }
}

seedSkills().catch((error) => {
  console.error('❌ Необработанная ошибка:', error);
  process.exit(1);
});
