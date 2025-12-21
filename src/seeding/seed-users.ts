import { AppDataSource } from '../config/db.config';
import { User } from '../users/entities/user.entity';
import { GenderOption, UserRole } from '../users/enums';
import { usersData } from './usersData';

async function seedUsers() {
  console.log('🚀 Запуск сидирования 50 пользователей...');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Подключено к БД');

    const userRepository = AppDataSource.getRepository(User);

    // Очистка (опционально)
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
    console.log('🧹 Старые пользователи удалены');

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
      const setPassword = email;

      // Роль
      const role = userData._id === 'user_001' ? UserRole.ADMIN : UserRole.USER;

      // Преобразование пола
      const gender =
        userData.gender.toLowerCase() === 'male'
          ? GenderOption.MALE
          : userData.gender.toLowerCase() === 'female'
            ? GenderOption.FEMALE
            : GenderOption.FEMALE;

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
      });

      await userRepository.save(user);

      const roleIcon = role === UserRole.ADMIN ? '👑' : '👤';
      console.log(`${roleIcon} ${index + 1}. ${userData.name}`);
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
