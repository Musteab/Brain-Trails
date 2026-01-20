/**
 * useQuickActions - Action handlers for dashboard quick actions
 */
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../../../context/TimerContext';

export default function useQuickActions() {
  const navigate = useNavigate();
  const { startTimer } = useTimer();

  const startPomodoro = () => {
    startTimer?.({ duration: 25 * 60, type: 'pomodoro' });
  };

  const createNote = () => {
    navigate('/notes?new=true');
  };

  const reviewFlashcards = () => {
    navigate('/flashcards?mode=review');
  };

  const takeQuiz = () => {
    navigate('/quizzes');
  };

  const openNote = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  const startQuiz = (quizId) => {
    navigate(`/quizzes/${quizId}`);
  };

  const viewProgress = () => {
    navigate('/progress');
  };

  const viewAllNotes = () => {
    navigate('/notes');
  };

  return {
    startPomodoro,
    createNote,
    reviewFlashcards,
    takeQuiz,
    openNote,
    startQuiz,
    viewProgress,
    viewAllNotes,
  };
}
