import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import ExerciseScreen from './components/ExerciseScreen';
import { AppState, ProficiencyLevel, ExerciseData } from './types';
import { generateExerciseContent, generateSpeech } from './services/geminiService';
import { ArrowPathIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    screen: 'setup',
    config: {
      level: null,
      topic: null,
      exerciseCount: 3,
    },
    currentExerciseIndex: 0,
    exercises: [],
    userAnswers: {},
    scores: [],
    audioUrl: null,
  });

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generate a single exercise
  const loadNextExercise = async (level: ProficiencyLevel, topic: string) => {
    setLoading(true);
    setError(null);
    setLoadingMessage('AI is crafting your conversation...');
    
    try {
      // 1. Generate Content
      const content = await generateExerciseContent(level, topic);
      
      setLoadingMessage('Synthesizing natural speech voices...');
      // 2. Generate Audio
      const audioUrl = await generateSpeech(content.dialogue);

      setState((prev) => ({
        ...prev,
        exercises: [...prev.exercises, content],
        audioUrl: audioUrl, // Update current audio URL
        screen: 'exercise'
      }));

    } catch (e: any) {
      console.error(e);
      setError("We encountered an issue generating the exercise. Please check your connection or API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (level: ProficiencyLevel, topic: string, count: number) => {
    setState(prev => ({
        ...prev,
        config: { level, topic, exerciseCount: count },
        scores: [],
        exercises: [], // Clear previous
        currentExerciseIndex: 0,
        screen: 'loading' // Intermediate state before first load
    }));

    // Load the first one immediately
    await loadNextExercise(level, topic);
  };

  const handleNextExercise = async (results: { correct: number, total: number }) => {
    // Record Score
    const newScores = [...state.scores, results.correct === results.total]; // Or detailed score
    // Actually let's store percentage or raw? Let's store raw correct count for now to simple pass/fail boolean in this simplified logic, 
    // or better, let's just store the object {correct, total}
    // For simplicity in types, I used boolean[], let's stick to simple pass (>= 50%) or just track it elsewhere.
    // Refactoring types on the fly is messy, let's abuse the state slightly or fix it.
    // Let's store Pass/Fail for boolean[]
    const passed = (results.correct / results.total) >= 0.5;

    // Clean up previous audio URL to prevent memory leaks
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    const nextIndex = state.currentExerciseIndex + 1;

    if (nextIndex < state.config.exerciseCount) {
        // Prepare next
        setState(prev => ({
            ...prev,
            scores: [...prev.scores, passed],
            currentExerciseIndex: nextIndex,
            screen: 'loading', // Show loading while fetching next
            audioUrl: null
        }));
        // Fetch next
        if (state.config.level && state.config.topic) {
            await loadNextExercise(state.config.level, state.config.topic);
        }
    } else {
        // Finish
        setState(prev => ({
            ...prev,
            scores: [...prev.scores, passed],
            screen: 'results',
            audioUrl: null
        }));
    }
  };

  const handleRestart = () => {
     setState({
        screen: 'setup',
        config: { level: null, topic: null, exerciseCount: 3 },
        currentExerciseIndex: 0,
        exercises: [],
        userAnswers: {},
        scores: [],
        audioUrl: null
     });
  };

  // Render Logic
  if (state.screen === 'setup') {
    return <SetupScreen onStart={handleStart} />;
  }

  if (state.screen === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        {error ? (
           <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
               <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-2xl">!</span>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Oops!</h3>
               <p className="text-slate-600 mb-6">{error}</p>
               <button 
                onClick={handleRestart}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
               >
                   Try Again
               </button>
           </div>
        ) : (
            <div className="text-center">
                <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-8"></div>
                <h2 className="text-2xl font-bold text-slate-800 animate-pulse">{loadingMessage}</h2>
                <p className="text-slate-500 mt-2">Generating personalized content for <span className="font-semibold text-indigo-600">{state.config.level}</span></p>
                <div className="mt-8 flex justify-center space-x-2">
                    <SparklesIcon className="w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
                    <SparklesIcon className="w-6 h-6 text-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <SparklesIcon className="w-6 h-6 text-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        )}
      </div>
    );
  }

  if (state.screen === 'exercise' && state.exercises[state.currentExerciseIndex] && state.audioUrl) {
    return (
      <ExerciseScreen
        key={state.currentExerciseIndex} // Force remount on new exercise
        data={state.exercises[state.currentExerciseIndex]}
        audioUrl={state.audioUrl}
        exerciseIndex={state.currentExerciseIndex}
        totalExercises={state.config.exerciseCount}
        onNext={handleNextExercise}
      />
    );
  }

  if (state.screen === 'results') {
    const passedCount = state.scores.filter(s => s).length;
    const total = state.scores.length;
    const percentage = Math.round((passedCount / total) * 100);

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center max-w-lg w-full border border-slate-100">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrophyIcon className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Homework Complete!</h2>
          <p className="text-slate-500 mb-8 text-lg">Here is how you performed on <span className="font-semibold text-indigo-600">{state.config.level}</span> level.</p>
          
          <div className="bg-slate-50 rounded-2xl p-8 mb-8">
            <div className="text-5xl font-black text-indigo-600 mb-2">{percentage}%</div>
            <div className="text-slate-400 font-medium">Accuracy</div>
            <div className="mt-4 flex justify-center gap-2">
                {state.scores.map((pass, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${pass ? 'bg-green-500' : 'bg-red-400'}`}></div>
                ))}
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all hover:shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-6 h-6" />
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
