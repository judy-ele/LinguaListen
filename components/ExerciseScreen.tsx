import React, { useState, useEffect } from 'react';
import { ExerciseData, Question, QuestionType, Option } from '../types';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ExerciseScreenProps {
  data: ExerciseData;
  audioUrl: string;
  exerciseIndex: number;
  totalExercises: number;
  onNext: (results: { correct: number; total: number }) => void;
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ 
  data, 
  audioUrl, 
  exerciseIndex, 
  totalExercises,
  onNext 
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [showTranscript, setShowTranscript] = useState(false);

  // Matching Question State helpers
  const [matchingSelections, setMatchingSelections] = useState<Record<string, Record<string, string>>>({}); 

  const handleAnswerChange = (questionId: string, value: any) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMatchingSelect = (questionId: string, item: string, match: string) => {
      if (submitted) return;
      setAnswers(prev => {
          const currentPairs = prev[questionId] || {};
          return {
              ...prev,
              [questionId]: { ...currentPairs, [item]: match }
          };
      });
  };

  // Helper to normalize strings for comparison (remove punctuation, lowercase)
  const normalizeAnswer = (text: string) => {
      if (typeof text !== 'string') return '';
      // Retain only letters and numbers
      return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const calculateScore = () => {
    let correctCount = 0;
    const newFeedback: Record<string, boolean> = {};

    data.questions.forEach((q) => {
      const userAnswer = answers[q.id];
      let isCorrect = false;

      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        isCorrect = userAnswer === q.correctAnswer;
      } else if (q.type === QuestionType.FILL_IN_THE_BLANK) {
         // Support multiple valid answers separated by |
         // Normalize both user answer and correct options to strip non-alphanumeric chars
         const validAnswers = (q.correctAnswer as string).split('|').map(normalizeAnswer);
         const userVal = normalizeAnswer(userAnswer || '');
         isCorrect = validAnswers.includes(userVal);
      } else if (q.type === QuestionType.MATCHING) {
        if (q.matches && userAnswer) {
             let allPairsCorrect = true;
             q.matches.forEach(pair => {
                 if (userAnswer[pair.item] !== pair.match) {
                     allPairsCorrect = false;
                 }
             });
             // Also check if all items are matched
             if (Object.keys(userAnswer).length !== q.matches.length) allPairsCorrect = false;
             isCorrect = allPairsCorrect;
        }
      }

      newFeedback[q.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setFeedback(newFeedback);
    return correctCount;
  };

  const handleSubmit = () => {
    calculateScore();
    setSubmitted(true);
  };

  const handleNext = () => {
    const correct = Object.values(feedback).filter(Boolean).length;
    onNext({ correct, total: data.questions.length });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </span>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
          {data.level}
        </span>
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-2">{data.topic}</h2>
      <p className="text-slate-500 mb-8">Listen to the conversation and answer the questions below.</p>

      {/* Audio Player */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl mb-10 text-white transition-all duration-300">
        <div className="flex flex-col items-center">
            <div className="mb-4 text-indigo-300 font-medium">Audio Conversation</div>
            <audio 
                controls 
                className="w-full h-12 rounded-lg" 
                src={audioUrl}
                style={{ filter: 'invert(0.9)' }} 
            >
                Your browser does not support the audio element.
            </audio>

            {/* Transcript Toggle */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-300 transition-colors focus:outline-none"
            >
              {showTranscript ? (
                <>
                  <EyeSlashIcon className="w-5 h-5" />
                  Hide Transcript
                </>
              ) : (
                <>
                  <EyeIcon className="w-5 h-5" />
                  See Transcript
                </>
              )}
            </button>

            {/* Transcript Content */}
            {showTranscript && (
              <div className="mt-6 w-full bg-slate-800 rounded-xl p-5 text-left border border-slate-700 animate-[fadeIn_0.3s_ease-in-out]">
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {data.dialogue.map((line, idx) => (
                    <div key={idx} className="flex gap-3 text-sm leading-relaxed">
                      <span className="font-bold text-indigo-400 shrink-0 w-20 text-right uppercase text-xs pt-1 tracking-wider">{line.speaker}</span>
                      <span className="text-slate-200 border-l border-slate-600 pl-3">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {data.questions.map((q, idx) => (
          <div key={q.id} className={`bg-white rounded-xl p-6 border-2 transition-colors ${
              submitted 
                ? feedback[q.id] 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                : 'border-slate-100 shadow-sm'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <h3 className="text-lg font-semibold text-black mt-1">{q.text}</h3>
            </div>

            {/* Question Content */}
            <div className="ml-11">
              
              {/* Multiple Choice */}
              {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label 
                        key={opt.id} 
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${answers[q.id] === opt.id 
                                ? 'bg-black border-black text-white' 
                                : 'bg-white border-slate-200 text-black hover:border-slate-400'
                            }
                            ${submitted && opt.id === q.correctAnswer ? '!bg-green-100 !border-green-500 !text-green-900' : ''}
                            ${submitted && answers[q.id] === opt.id && answers[q.id] !== q.correctAnswer ? '!bg-red-100 !border-red-500 !text-red-900' : ''}
                        `}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => handleAnswerChange(q.id, opt.id)}
                        disabled={submitted}
                        className="hidden"
                      />
                      <span className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center
                          ${answers[q.id] === opt.id ? 'border-white' : 'border-black'}
                          ${submitted && opt.id === q.correctAnswer ? '!border-green-900' : ''}
                      `}>
                          {answers[q.id] === opt.id && <div className={`w-2.5 h-2.5 rounded-full ${submitted && opt.id === q.correctAnswer ? 'bg-green-900' : 'bg-white'}`} />}
                      </span>
                      <span className="font-medium">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Fill in the Blank */}
              {q.type === QuestionType.FILL_IN_THE_BLANK && (
                <div className="mt-2">
                    <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={submitted}
                        placeholder="Type your answer here..."
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-black
                            ${submitted 
                                ? feedback[q.id] ? 'border-green-500 bg-green-50 !text-green-900' : 'border-red-500 bg-red-50 !text-red-900'
                                : 'border-slate-300'
                            }
                        `}
                    />
                    {submitted && !feedback[q.id] && (
                        <div className="mt-2 text-sm text-red-600">
                            Correct answer: <span className="font-bold">
                                {(q.correctAnswer as string).split('|').join(' or ')}
                            </span>
                        </div>
                    )}
                </div>
              )}

              {/* Matching */}
              {q.type === QuestionType.MATCHING && q.matches && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      {/* Items Column */}
                      <div className="space-y-2">
                          <p className="text-xs font-bold text-black uppercase">Items</p>
                          {q.matches.map((pair) => (
                              <div key={`item-${pair.item}`} className="h-12 flex items-center px-4 bg-white border border-slate-200 rounded-lg shadow-sm text-black font-medium">
                                  {pair.item}
                              </div>
                          ))}
                      </div>
                      
                      {/* Matches Selection Column */}
                      <div className="space-y-2">
                          <p className="text-xs font-bold text-black uppercase">Select Matches</p>
                          {q.matches.map((pair) => {
                             return (
                                 <div key={`match-select-${pair.item}`} className="h-12">
                                     <select
                                        className={`w-full h-full px-4 border rounded-lg bg-white text-black focus:ring-2 focus:ring-black focus:border-black
                                            ${submitted
                                                ? answers[q.id]?.[pair.item] === pair.match
                                                    ? 'border-green-500 bg-green-50 !text-green-900'
                                                    : 'border-red-500 bg-red-50 !text-red-900'
                                                : 'border-slate-300'
                                            }
                                        `}
                                        value={answers[q.id]?.[pair.item] || ''}
                                        onChange={(e) => handleMatchingSelect(q.id, pair.item, e.target.value)}
                                        disabled={submitted}
                                     >
                                         <option value="">Select a match...</option>
                                         {q.matches?.map(m => (
                                             <option key={m.match} value={m.match}>{m.match}</option>
                                         ))}
                                     </select>
                                 </div>
                             );
                          })}
                      </div>
                  </div>
              )}

              {/* Explanation/Feedback */}
              {submitted && (
                  <div className={`mt-4 p-4 rounded-lg text-sm flex items-start gap-3 ${feedback[q.id] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {feedback[q.id] 
                        ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                        : <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                      }
                      <div>
                          <p className="font-bold mb-1">{feedback[q.id] ? 'Correct!' : 'Incorrect'}</p>
                          <p>{q.explanation}</p>
                      </div>
                  </div>
              )}

            </div>
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20">
        <div className="max-w-4xl mx-auto flex justify-end">
          {!submitted ? (
             <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
             >
                 Submit Answers
             </button>
          ) : (
             <button
                onClick={handleNext}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
             >
                 {exerciseIndex + 1 < totalExercises ? 'Next Exercise' : 'View Results'}
                 <ArrowRightIcon className="w-5 h-5" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseScreen;