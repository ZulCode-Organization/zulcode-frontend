import { LanguageOption, OnboardingQuestion } from "./types";

export const LANGUAGES: LanguageOption[] = [
  { id: "javascript", name: "JavaScript", emoji: "🟨" },
  { id: "python", name: "Python", emoji: "🐍" },
  { id: "typescript", name: "TypeScript", emoji: "🔷" },
  { id: "java", name: "Java", emoji: "☕" },
  { id: "csharp", name: "C#", emoji: "🟪" },
  { id: "go", name: "Go", emoji: "🐹" },
];

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "how_heard",
    title: "Como você ouviu falar do ZulCode?",
    type: "single-choice",
    options: [
      { id: "instagram", label: "Instagram" },
      { id: "youtube", label: "Youtube" },
      { id: "friends_family", label: "Amigos/Família" },
      { id: "podcast", label: "Podcast" },
      { id: "facebook", label: "Facebook" },
      { id: "tiktok", label: "TikTok" },
      { id: "linkedin", label: "Linkedin" },
      { id: "other", label: "Outro" },
    ],
  },
  {
    id: "learn_goal",
    title: "O que você deseja aprender?",
    type: "single-choice",
    options: [
      { id: "programming_languages", label: "Linguagens de Programação" },
    ],
  },
  {
    id: "language_reason",
    title: "Porque você está aprendendo {{language}}?",
    type: "single-choice",
    options: [
      { id: "explore", label: "Explorar o que é programação" },
      { id: "career", label: "Impulsionar minha carreira" },
      { id: "education", label: "Apoiar minha educação" },
      { id: "creative", label: "Expandir habilidades criativas" },
      { id: "challenge", label: "Desafiar meu cérebro" },
      { id: "fun", label: "Só por diversão" },
      { id: "build_apps", label: "Construir meus próprios aplicativos" },
      { id: "other", label: "Outro" },
    ],
  },
  {
    id: "language_level",
    title: "Qual é o seu nível de {{language}} experiência?",
    type: "single-choice",
    options: [
      { id: "beginner", label: "Iniciante completo" },
      { id: "some_experience", label: "Alguma experiência, mas preciso de uma atualização" },
      { id: "confident", label: "Confiante nas minhas habilidades de programação" },
      { id: "expert", label: "Especialista em programação" },
    ],
  },
  {
    id: "commitment",
    title: "Quanto você está pronto para se comprometer?",
    type: "single-choice",
    options: [
      { id: "5min", label: "5 min por dia" },
      { id: "15min", label: "15 min por dia" },
      { id: "30min", label: "30 min por dia" },
      { id: "60min", label: "60 min por dia" },
    ],
  },
  {
    id: "learning_plan",
    title: "Como você gostaria de aprender?",
    type: "single-choice",
    options: [
      { id: "free", label: "Grátis" },
      { id: "pro", label: "ZulCode Pro" },
    ],
  },
];