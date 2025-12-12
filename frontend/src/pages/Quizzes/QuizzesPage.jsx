import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AccessTime, CheckCircle, RestartAlt } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { quizApi } from '../../api';
import { useGamification } from '../../context/GamificationContext';

const encouragements = [
  { min: 90, text: 'Legendary! Exams fear you now.' },
  { min: 75, text: 'Great job! Keep the streak alive.' },
  { min: 50, text: 'Solid effort—review the tricky spots.' },
  { min: 0, text: "Every boss needs a rematch. You've got this!" },
];

const QuizzesPage = () => {
  const theme = useTheme();
  const gamification = useGamification();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', notes: '', num_questions: 5, time_limit: 120 });
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const quizzesQuery = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data } = await quizApi.list();
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => quizApi.createFromNotes(payload),
    onSuccess: ({ data }) => {
      setActiveQuiz({ ...data.quiz, questions: data.quiz.questions || [] });
      setQuizResult(null);
      setForm((prev) => ({ ...prev, notes: '', title: '' }));
      queryClient.invalidateQueries(['quizzes']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId) => quizApi.remove(quizId),
    onSuccess: () => queryClient.invalidateQueries(['quizzes']),
  });

  const handleGenerate = (event) => {
    event.preventDefault();
    generateMutation.mutate(form);
  };

  const handleTakeQuiz = async (quizId) => {
    const { data } = await quizApi.questions(quizId);
    setActiveQuiz({ ...data.quiz, questions: data.questions });
    setQuizResult(null);
  };

  const handleSubmitQuiz = async (quizPayload) => {
    const { data } = await quizApi.submit(activeQuiz.id, quizPayload);
    setQuizResult(data);
    gamification.recordQuizCompletion({ score: data.score, questionCount: activeQuiz.questions.length });
    queryClient.invalidateQueries(['quizzes']);
  };

  return (
    <Box position="relative">
      {generateMutation.isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.45)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 3,
          }}
        >
          <LoadingState label="Generating your quiz..." />
        </Box>
      )}
      <Stack spacing={4}>
        <Typography variant="h4" fontWeight={700}>
          Quiz arena
        </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Generate from notes
              </Typography>
              {generateMutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {generateMutation.error.response?.data?.error || 'Generation failed'}
                </Alert>
              )}
              <Stack spacing={2} component="form" onSubmit={handleGenerate}>
                <TextField
                  label="Quiz title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
                <TextField
                  label="Paste your notes"
                  multiline
                  minRows={6}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  required
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Questions"
                    type="number"
                    value={form.num_questions}
                    onChange={(e) => setForm((prev) => ({ ...prev, num_questions: Number(e.target.value) }))}
                    inputProps={{ min: 3, max: 15 }}
                  />
                  <TextField
                    label="Time limit (s)"
                    type="number"
                    value={form.time_limit}
                    onChange={(e) => setForm((prev) => ({ ...prev, time_limit: Number(e.target.value) }))}
                  />
                </Stack>
                <Button type="submit" variant="contained" disabled={generateMutation.isLoading}>
                  {generateMutation.isLoading ? 'Generating...' : 'Generate quiz'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Your quizzes
              </Typography>
              {quizzesQuery.isLoading ? (
                <LoadingState label="Fetching quizzes..." />
              ) : quizzesQuery.data?.length ? (
                <Stack spacing={2}>
                  {quizzesQuery.data.map((quiz) => (
                    <Box
                      key={quiz.id}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                        borderRadius: 2,
                        p: 2,
                        transition: 'border-color 0.2s ease',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      }}
                    >
                      <Typography fontWeight={600}>{quiz.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(quiz.created_at).toLocaleString()}
                      </Typography>
                      <Stack direction="row" spacing={1.5} mt={1.5}>
                        <Button size="small" variant="outlined" onClick={() => handleTakeQuiz(quiz.id)}>
                          Take quiz
                        </Button>
                        <Button size="small" color="error" onClick={() => deleteMutation.mutate(quiz.id)}>
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState title="No quizzes yet" description="Generate your first quiz." />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

        {activeQuiz && (
          <QuizRunner quiz={activeQuiz} onSubmit={handleSubmitQuiz} result={quizResult} resetQuiz={() => setActiveQuiz(null)} />
        )}
      </Stack>
    </Box>
  );
};

const QuizRunner = ({ quiz, onSubmit, result, resetQuiz }) => {
  const theme = useTheme();
  const [responses, setResponses] = useState({});
  const [feedback, setFeedback] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit || 0);
  const [timerEnabled, setTimerEnabled] = useState(Boolean(quiz.time_limit));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setResponses({});
    setFeedback({});
    setTimeLeft(quiz.time_limit || 0);
    setTimerEnabled(Boolean(quiz.time_limit));
  }, [quiz]);

  useEffect(() => {
    if (!timerEnabled || !timeLeft || result) return undefined;
    const ticker = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(ticker);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerEnabled, timeLeft, result]);

  const handleSelect = (question, option) => {
    setResponses((prev) => ({ ...prev, [question.id]: option }));
    if (question.correct_answer) {
      setFeedback((prev) => ({
        ...prev,
        [question.id]: option === question.correct_answer ? 'correct' : 'wrong',
      }));
    }
  };

  const handleSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    const payload = Object.entries(responses).map(([questionId, answer]) => ({
      question_id: Number(questionId),
      answer,
    }));
    await onSubmit({ answers: payload, duration_seconds: quiz.time_limit ? quiz.time_limit - timeLeft : 0 });
    setSubmitting(false);
  };

  const answeredCount = Object.keys(responses).length;
  const progress = quiz.questions.length ? answeredCount / quiz.questions.length : 0;
  const encouragement =
    encouragements.find((item) => (result?.score || 0) >= item.min)?.text || encouragements[encouragements.length - 1].text;

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" mb={2}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              {quiz.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Instant feedback, XP on completion, and timer pressure if you want it.
            </Typography>
          </div>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              control={<Switch checked={timerEnabled} onChange={(event) => setTimerEnabled(event.target.checked)} />}
              label="Timer"
            />
            {timerEnabled && (
              <Chip icon={<AccessTime />} label={`${timeLeft}s`} color={timeLeft < 10 ? 'warning' : 'default'} />
            )}
          </Stack>
        </Stack>

        <LinearProgress variant="determinate" value={progress * 100} sx={{ height: 10, borderRadius: 5, mb: 3 }} />

        <Stack spacing={3}>
          {quiz.questions?.map((question, index) => (
            <Box
              key={question.id}
              sx={{
                border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography fontWeight={600} mb={1}>
                Q{index + 1}. {question.question_text}
              </Typography>
              <Stack spacing={1}>
                {question.options.map((option) => {
                  const state = feedback[question.id];
                  const isSelected = responses[question.id] === option;
                  const isCorrect = question.correct_answer === option;
                  let bg = alpha(theme.palette.text.primary, 0.04);
                  if (isSelected && state === 'correct') bg = alpha(theme.palette.success.main, 0.2);
                  if (isSelected && state === 'wrong') bg = alpha(theme.palette.error.main, 0.2);
                  if (!isSelected && state === 'wrong' && isCorrect) bg = alpha(theme.palette.success.main, 0.15);
                  return (
                    <Button
                      key={option}
                      variant="contained"
                      onClick={() => handleSelect(question, option)}
                      sx={{
                        justifyContent: 'flex-start',
                        bgcolor: bg,
                        color: 'text.primary',
                        '&:hover': { bgcolor: bg },
                      }}
                    >
                      {option}
                    </Button>
                  );
                })}
              </Stack>
              {feedback[question.id] && (
                <Chip
                  sx={{ mt: 1 }}
                  label={feedback[question.id] === 'correct' ? 'Correct!' : `Answer: ${question.correct_answer}`}
                  color={feedback[question.id] === 'correct' ? 'success' : 'warning'}
                />
              )}
            </Box>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={3}>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || result}>
            {submitting ? 'Scoring...' : 'Submit answers'}
          </Button>
          <Button variant="text" startIcon={<RestartAlt />} onClick={resetQuiz}>
            Exit quiz
          </Button>
        </Stack>

        {result && (
          <Box mt={4}>
            <AnimatedSummary score={result.score} encouragement={encouragement} totalQuestions={quiz.questions.length} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const AnimatedSummary = ({ score, encouragement, totalQuestions }) => {
  const theme = useTheme();
  return (
    <Card sx={{ mt: 2, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}` }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <CircularProgress variant="determinate" value={score} size={96} thickness={5} color={score > 70 ? 'success' : 'warning'} />
          <div>
            <Typography variant="h5" fontWeight={700}>
              Score {score}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {encouragement}
            </Typography>
            <Chip sx={{ mt: 1 }} icon={<CheckCircle />} label={`${totalQuestions} questions`} color="primary" />
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuizzesPage;
