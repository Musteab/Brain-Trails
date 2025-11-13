import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { quizApi } from '../../api';

const QuizzesPage = () => {
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
      setActiveQuiz(data.quiz);
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

  const handleSubmitQuiz = async (responses) => {
    const { data } = await quizApi.submit(activeQuiz.id, { answers: responses });
    setQuizResult(data);
    queryClient.invalidateQueries(['quizzes']);
  };

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700}>
        Quiz studio
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
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
              <Typography variant="h6" fontWeight={600} mb={2}>
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
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        p: 2,
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
        <QuizRunner quiz={activeQuiz} onSubmit={handleSubmitQuiz} result={quizResult} />
      )}
    </Stack>
  );
};

const QuizRunner = ({ quiz, onSubmit, result }) => {
  const [responses, setResponses] = useState({});

  const handleChange = (questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = Object.entries(responses).map(([questionId, answer]) => ({
      question_id: Number(questionId),
      answer,
    }));
    onSubmit(payload);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} mb={2}>
          {quiz.title}
        </Typography>
        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          {quiz.questions?.map((question) => (
            <Box key={question.id}>
              <Typography fontWeight={600}>{question.question_text}</Typography>
              <RadioGroup
                value={responses[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
              >
                {question.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </Box>
          ))}
          <Button type="submit" variant="contained">
            Submit answers
          </Button>
        </Stack>
        {result && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Score: {result.score}%
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizzesPage;
