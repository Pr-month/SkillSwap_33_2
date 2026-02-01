import { AppDataSource } from '../config/db.config';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { GenderOption, UserRole } from '../users/enums';
import { usersData } from './usersData';
import { Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
  console.log('🚀 Запуск сидирования 50 пользователей...');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Подключено к БД');

    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(Category);

    // Очистка (опционально)
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
    console.log('🧹 Старые пользователи удалены');

    // Получаем все дочерние категории (подкатегории)
    const allSubcategories = await categoryRepository.find({
      where: { parent: { id: Not(IsNull()) } },
      relations: ['parent'],
    });

    console.log(`📚 Загружено ${allSubcategories.length} подкатегорий`);

    if (allSubcategories.length === 0) {
      console.error(
        '❌ Нет доступных подкатегорий. Сначала запустите seed-categories!',
      );
      process.exit(1);
    }

    // Создаем мап для быстрого доступа к категориям
    const categoriesMap = new Map<string, Category>();
    allSubcategories.forEach((cat) => categoriesMap.set(cat.name, cat));

    for (const [index, userData] of usersData.entries()) {
      // Генерация email
      const emailBase =
        userData.name
          .toLowerCase()
          // Заменяем пробелы на точки
          .replace(/\s+/g, '.')
          // Транслитерация
          .replace(/[а-яё]/g, (char) => {
            const mapping: Record<string, string> = {
              а: 'a',
              б: 'b',
              в: 'v',
              г: 'g',
              д: 'd',
              е: 'e',
              ё: 'e',
              ж: 'zh',
              з: 'z',
              и: 'i',
              й: 'y',
              к: 'k',
              л: 'l',
              м: 'm',
              н: 'n',
              о: 'o',
              п: 'p',
              р: 'r',
              с: 's',
              т: 't',
              у: 'u',
              ф: 'f',
              х: 'h',
              ц: 'ts',
              ч: 'ch',
              ш: 'sh',
              щ: 'sch',
              ы: 'y',
              э: 'e',
              ю: 'yu',
              я: 'ya',
              ь: '',
              ъ: '',
            };
            return mapping[char] || '';
          })
          // Удаляем все, что не латинская буква или точка
          .replace(/[^a-z.]/g, '')
          // Удаляем возможные множественные точки
          .replace(/\.+/g, '.')
          // Удаляем точку в начале или конце
          .replace(/^\.|\.$/g, '') ||
        // Если после всех преобразований строка пустая, используем fallback
        'user';

      const email = `${emailBase}@skillswap.test`;

      // Устанавливаем пароль пароль (email)
      const setPassword = await bcrypt.hash(
        email,
        parseInt(process.env.HASH_SALT || '10'),
      );

      // Роль
      const role = userData._id === 'user_001' ? UserRole.ADMIN : UserRole.USER;

      // Преобразование пола
      const gender =
        userData.gender.toLowerCase() === 'male'
          ? GenderOption.MALE
          : userData.gender.toLowerCase() === 'female'
            ? GenderOption.FEMALE
            : GenderOption.FEMALE;

      // Выбираем 2-4 случайные категории для wantToLearn
      const wantToLearnCategories: Category[] = [];
      const numCategoriesToLearn = Math.floor(Math.random() * 3) + 2; // 2-4 категории

      // Используем wantsToLearn из userData как основу, если есть
      if (userData.wantsToLearn && userData.wantsToLearn.length > 0) {
        // Берем первую категорию из wantsToLearn
        const firstWantedCategoryName = userData.wantsToLearn[0].subcategory;
        const categoryFromData = categoriesMap.get(firstWantedCategoryName);
        if (categoryFromData) {
          wantToLearnCategories.push(categoryFromData);
        }
      }

      // Добираем случайные категории до нужного количества
      const availableCategories = [...allSubcategories]
        .filter((cat) => !wantToLearnCategories.some((w) => w.id === cat.id))
        .sort(() => Math.random() - 0.5);

      const additionalCategories = availableCategories.slice(
        0,
        numCategoriesToLearn - wantToLearnCategories.length,
      );

      wantToLearnCategories.push(...additionalCategories);

      // Создание пользователя
      const user = userRepository.create({
        name: userData.name,
        email,
        password: setPassword,
        about: userData.description,
        birthdate: new Date(userData.birthdayDate),
        city: userData.city,
        gender,
        avatar: userData.image,
        role,
        wantToLearn: wantToLearnCategories,
      });

      await userRepository.save(user);

      const roleIcon = role === UserRole.ADMIN ? '👑' : '👤';
      console.log(
        `${roleIcon} ${index + 1}. ${userData.name} - хочет научиться: ${wantToLearnCategories.map((c) => c.name).join(', ')}`,
      );
    }

    console.log('\n🎉 Сидирование завершено!');
    console.log('════════════════════════════════════════');
    console.log('🔐 Тестовые учетные данные:');
    console.log('Администратор:');
    console.log('  Email: alexander.ivanov@skillswap.test');
    console.log('  Пароль: alexander.ivanov@skillswap.test');
    console.log('\nПользователи:');
    console.log('  Email: имя.фамилия@skillswap.test');
    console.log('  Пароль: совпадает с email');
    console.log('════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seedUsers().catch((error) => {
  console.error('❌ Необработанная ошибка:', error);
  process.exit(1);
});
