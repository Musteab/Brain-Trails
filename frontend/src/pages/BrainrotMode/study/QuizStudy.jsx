/**
 * Quiz Study Component for Brainrot Mode
 * Quick quiz interface for brainrot studying
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  PlayArrow as StartIcon,
  Refresh as RestartIcon,
} from '@mui/icons-material';
import api from '../../../api/client';

export default function QuizStudy() {
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);

  // Fetch available quizzes
  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => api.get('/quizzes').then((res) => res.data),
  });

  // Fetch selected quiz with questions
  const { data: quiz } = useQuery({
    queryKey: ['quiz', selectedQuizId],
    queryFn: () => api.get(`/quizzes/${selectedQuizId}`).then((res) => res.data),
    enabled: !!selectedQuizId && started,
  });

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Shuffle answers
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const options = [
      { text: currentQuestion.correct_answer, isCorrect: true },
      ...(currentQuestion.incorrect_answers || []).map((a) => ({
        text: a,
        isCorrect: false,
      })),
    ];
    return options.sort(() => Math.random() - 0.5);
  }, [currentQuestion]);

  const handleAnswer = () => {
    setShowResult(true);
    if (shuffledOptions[selectedAnswer]?.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    if (currentIndex + 1 >= questions.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsComplete(false);
  };

  // Quiz selection
  if (!selectedQuizId || !started) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select a Quiz
        </Typography>
        <FormControl sx={{ minWidth: 300, mb: 2 }}>
          <InputLabel>Quiz</InputLabel>
          <Select
            value={selectedQuizId}
            label="Quiz"
            onChange={(e) => setSelectedQuizId(e.target.value)}
          >
            {quizzes.map((q) => (
              <MenuItem key={q.id} value={q.id}>
                {q.title} ({q.question_count || 0} questions)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedQuizId && (
          <Box>
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={() => setStarted(true)}
            >
              Start Quiz
            </Button>
          </Box>
        )}
        {quizzes.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No quizzes found. Create some in the Quizzes page!
          </Typography>
        )}
      </Box>
    );
  }

  // Quiz complete
  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Quiz Complete! 🎉
        </Typography>
        <Typography variant="h2" color={percentage >= 70 ? 'success.main' : 'warning.main'}>
          {percentage}%
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {score} / {questions.length} correct
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<RestartIcon />}
            onClick={handleRestart}
          >
            Try Again
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedQuizId('');
              setStarted(false);
              handleRestart();
            }}
          >
            Choose Another Quiz
          </Button>
        </Stack>
      </Box>
    );
  }

  // Loading
  if (!currentQuestion) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading questions...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Progress */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentIndex + 1} of {questions.length}
          </Typography>
          <Chip
            label={`Score: ${score}/${currentIndex + (showResult ? 1 : 0)}`}
            color="primary"
            size="small"
          />
        </Stack>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {/* Question */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>

          <RadioGroup
            value={selectedAnswer}
            onChange={(e) => !showResult && setSelectedAnswer(parseInt(e.target.value))}
          >
            {shuffledOptions.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index}
                control={<Radio />}
                disabled={showResult}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{option.text}</Typography>
                    {showResult && option.isCorrect && (
                      <CorrectIcon color="success" fontSize="small" />
                    )}
                    {showResult && selectedAnswer === index && !option.isCorrect && (
                      <WrongIcon color="error" fontSize="small" />
                    )}
                  </Box>
                }
                sx={{
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: showResult
                    ? option.isCorrect
                      ? 'success.main'
                      : selectedAnswer === index
                      ? 'error.main'
                      : 'divider'
                    : selectedAnswer === index
                    ? 'primary.main'
                    : 'divider',
                  bgcolor: showResult && option.isCorrect ? 'success.light' : 'transparent',
                }}
              />
            ))}
          </RadioGroup>
        </CardContent>

        {/* Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            {!showResult ? (
              <Button
                variant="contained"
                onClick={handleAnswer}
                disabled={selectedAnswer === null}
              >
                Check Answer
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                {currentIndex + 1 >= questions.length ? 'Finish' : 'Next Question'}
              </Button>
            )}
          </Stack>
        </Box>
      </Card>
    </Box>
  );
}
