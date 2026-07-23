// Quiz scoring logic — extracted from onboardingTemplate.js for maintainability
// Spec v1.2 Section 34 / Section 7.1

export function calculateQuizScore(correctAnswers, totalQuestions) {
  if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return 1;
  if (!Number.isFinite(correctAnswers) || correctAnswers <= 0) return 1;
  const boundedCorrect = Math.min(correctAnswers, totalQuestions);
  return Math.max(1, Math.round((boundedCorrect / totalQuestions) * 10));
}

export function isPassed(score, passingScore = 8) {
  return Number.isFinite(score) && score >= passingScore;
}