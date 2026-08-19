// Server-side quiz answer keys for the onboarding template.
// Mirrors src/lib/onboardingTemplate.js — used to verify quiz submissions in the backend
// instead of trusting client-supplied scores.

const QUIZ_KEYS = {
  ch1: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'c', 'a', 'c', 'b'] },
  ch2: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'c', 'b', 'b', 'b'] },
  ch3: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'b', 'b', 'b', 'a'] },
  ch4: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'b', 'a', 'c', 'b'] },
  ch5: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'c', 'b', 'c', 'b', 'b', 'b', 'b', 'b', 'b'] },
  ch6: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'a', 'a', 'b', 'b'] },
  ch7: { passing_score: 8, max_attempts: 3, correct_options: ['b', 'b', 'b', 'b', 'b'] },
  summary: { passing_score: 8, max_attempts: 3, correct_options: ['a', 'b', 'a', 'b', 'b', 'a', 'c', 'a', 'b', 'b', 'b', 'b', 'b', 'b', 'b'] },
};

// Same formula as src/lib/onboarding/scoring.js
function calculateScore(correct, total) {
  if (!Number.isFinite(total) || total <= 0) return 1;
  if (!Number.isFinite(correct) || correct <= 0) return 1;
  return Math.max(1, Math.round((Math.min(correct, total) / total) * 10));
}

// Grade a quiz submission server-side. Returns null when no answer key exists.
export function gradeQuiz(templateStageId, submittedAnswers) {
  const key = QUIZ_KEYS[templateStageId];
  if (!key) return null;

  const list = Array.isArray(submittedAnswers) ? submittedAnswers : [];
  const total = key.correct_options.length;
  let correct = 0;

  const answers = key.correct_options.map((correctOption, i) => {
    const a = list[i] && typeof list[i] === 'object' ? list[i] : {};
    const selected = typeof a.selected === 'string' ? a.selected : '';
    const isCorrect = selected === correctOption;
    if (isCorrect) correct++;
    return {
      question: String(a.question || ''),
      selected,
      correct: correctOption,
      is_correct: isCorrect,
      explanation: String(a.explanation || ''),
      learning_reference: String(a.learning_reference || ''),
    };
  });

  const score = calculateScore(correct, total);
  return {
    total,
    correct,
    score,
    passed: score >= key.passing_score,
    max_attempts: key.max_attempts,
    answers,
  };
}