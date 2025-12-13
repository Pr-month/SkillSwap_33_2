export enum ParentSkill {
  BUSINESS_CAREER = 'Бизнес и карьера',
  CREATIVITY_ART = 'Творчество и искусство',
  FOREIGN_LANGUAGES = 'Иностранные языки',
  EDUCATION_DEVELOPMENT = 'Образование и развитие',
  HOME_COMFORT = 'Дом и уют',
  HEALTH_LIFESTYLE = 'Здоровье и лайфстайл',
}

export enum BusinessCareerSubSkill {
  TEAM_MANAGEMENT = 'Управление командой',
  MARKETING_ADVERTISING = 'Маркетинг и реклама',
  SALES_NEGOTIATIONS = 'Продажи и переговоры',
  PERSONAL_BRAND = 'Личный бренд',
  CV_INTERVIEW = 'Резюме и собеседование',
  TIME_MANAGEMENT = 'Тайм-менеджмент',
  PROJECT_MANAGEMENT = 'Проектное управление',
  ENTREPRENEURSHIP = 'Предпринимательство',
}

export enum CreativityArtSubSkill {
  DRAWING_ILLUSTRATION = 'Рисование и иллюстрация',
  PHOTOGRAPHY = 'Фотография',
  VIDEO_EDITING = 'Видеомонтаж',
  MUSIC_SOUND = 'Музыка и звук',
  ACTING = 'Актёрское мастерство',
  CREATIVE_WRITING = 'Креативное письмо',
  ART_THERAPY = 'Арт-терапия',
  DECOR_DIY = 'Декор и DIY',
}

export enum ForeignLanguagesSubSkill {
  ENGLISH = 'Английский',
  FRENCH = 'Французский',
  SPANISH = 'Испанский',
  GERMAN = 'Немецкий',
  CHINESE = 'Китайский',
  JAPANESE = 'Японский',
  EXAM_PREPARATION = 'Подготовка к экзаменам (IELTS, TOEFL)',
}

export enum EducationDevelopmentSubSkill {
  PERSONAL_DEVELOPMENT = 'Личностное развитие',
  LEARNING_SKILLS = 'Навыки обучения',
  COGNITIVE_TECHNIQUES = 'Когнитивные техники',
  SPEED_READING = 'Скорочтение',
  TEACHING_SKILLS = 'Навыки преподавания',
  COACHING = 'Коучинг',
}

export enum HomeComfortSubSkill {
  CLEANING_ORGANIZATION = 'Уборка и организация',
  HOME_FINANCES = 'Домашние финансы',
  COOKING = 'Приготовление еды',
  HOUSEPLANTS = 'Домашние растения',
  REPAIR = 'Ремонт',
  STORAGE = 'Хранение вещей',
}

export enum HealthLifestyleSubSkill {
  YOGA_MEDITATION = 'Йога и медитация',
  NUTRITION_LIFESTYLE = 'Питание и ЗОЖ',
  MENTAL_HEALTH = 'Ментальное здоровье',
  MINDFULNESS = 'Осознанность',
  PHYSICAL_TRAINING = 'Физические тренировки',
  SLEEP_RECOVERY = 'Сон и восстановление',
  WORK_LIFE_BALANCE = 'Баланс жизни и работы',
}

export type SubSkill =
  | BusinessCareerSubSkill
  | CreativityArtSubSkill
  | ForeignLanguagesSubSkill
  | EducationDevelopmentSubSkill
  | HomeComfortSubSkill
  | HealthLifestyleSubSkill;

export const ParentToSubSkillsMap: Record<ParentSkill, SubSkill[]> = {
  [ParentSkill.BUSINESS_CAREER]: [
    BusinessCareerSubSkill.TEAM_MANAGEMENT,
    BusinessCareerSubSkill.MARKETING_ADVERTISING,
    BusinessCareerSubSkill.SALES_NEGOTIATIONS,
    BusinessCareerSubSkill.PERSONAL_BRAND,
    BusinessCareerSubSkill.CV_INTERVIEW,
    BusinessCareerSubSkill.TIME_MANAGEMENT,
    BusinessCareerSubSkill.PROJECT_MANAGEMENT,
    BusinessCareerSubSkill.ENTREPRENEURSHIP,
  ],
  [ParentSkill.CREATIVITY_ART]: [
    CreativityArtSubSkill.DRAWING_ILLUSTRATION,
    CreativityArtSubSkill.PHOTOGRAPHY,
    CreativityArtSubSkill.VIDEO_EDITING,
    CreativityArtSubSkill.MUSIC_SOUND,
    CreativityArtSubSkill.ACTING,
    CreativityArtSubSkill.CREATIVE_WRITING,
    CreativityArtSubSkill.ART_THERAPY,
    CreativityArtSubSkill.DECOR_DIY,
  ],
  [ParentSkill.FOREIGN_LANGUAGES]: [
    ForeignLanguagesSubSkill.ENGLISH,
    ForeignLanguagesSubSkill.FRENCH,
    ForeignLanguagesSubSkill.SPANISH,
    ForeignLanguagesSubSkill.GERMAN,
    ForeignLanguagesSubSkill.CHINESE,
    ForeignLanguagesSubSkill.JAPANESE,
    ForeignLanguagesSubSkill.EXAM_PREPARATION,
  ],
  [ParentSkill.EDUCATION_DEVELOPMENT]: [
    EducationDevelopmentSubSkill.PERSONAL_DEVELOPMENT,
    EducationDevelopmentSubSkill.LEARNING_SKILLS,
    EducationDevelopmentSubSkill.COGNITIVE_TECHNIQUES,
    EducationDevelopmentSubSkill.SPEED_READING,
    EducationDevelopmentSubSkill.TEACHING_SKILLS,
    EducationDevelopmentSubSkill.COACHING,
  ],
  [ParentSkill.HOME_COMFORT]: [
    HomeComfortSubSkill.CLEANING_ORGANIZATION,
    HomeComfortSubSkill.HOME_FINANCES,
    HomeComfortSubSkill.COOKING,
    HomeComfortSubSkill.HOUSEPLANTS,
    HomeComfortSubSkill.REPAIR,
    HomeComfortSubSkill.STORAGE,
  ],
  [ParentSkill.HEALTH_LIFESTYLE]: [
    HealthLifestyleSubSkill.YOGA_MEDITATION,
    HealthLifestyleSubSkill.NUTRITION_LIFESTYLE,
    HealthLifestyleSubSkill.MENTAL_HEALTH,
    HealthLifestyleSubSkill.MINDFULNESS,
    HealthLifestyleSubSkill.PHYSICAL_TRAINING,
    HealthLifestyleSubSkill.SLEEP_RECOVERY,
    HealthLifestyleSubSkill.WORK_LIFE_BALANCE,
  ],
};

export type TParentSkillSubSkills = {
  [K in ParentSkill]: SubSkill[];
};
