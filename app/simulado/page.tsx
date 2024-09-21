'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useUserScore } from "@/context/UserScoreContext";
import { useSearchParams } from 'next/navigation';
import { UserButton, useUser } from "@clerk/nextjs";
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { FaArrowRight, FaArrowLeft, FaRedo } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Loader from "@/components/Loader/Loader";

export default function SimuladoPage() {
  const searchParams = useSearchParams();
  const selectedYear = Number(searchParams.get('year')) || 2023;
  const selectedTime = Number(searchParams.get('time')) || 0;

  const { score, incrementScore, decrementScore, resetScore } = useUserScore();
  const router = useRouter();
  const { isSignedIn } = useUser();

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string | null>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuestion(currentIndex, selectedYear);
    setTimeLeft(selectedTime * 60);
  }, [selectedYear, selectedTime]);

  // Update useEffect to listen for currentIndex changes
  useEffect(() => {
    fetchQuestion(currentIndex, selectedYear);
  }, [currentIndex, selectedYear]);

  const fetchQuestion = async (index: number, year: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.enem.dev/v1/exams/${year}/questions/${index}`);
      setQuestion(response.data);
      setSelectedAnswer(selectedAnswers[index] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      alert("Time's up!");
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft]);

  const handleAnswerClick = (letter: string) => {
    setSelectedAnswer(letter);

    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentIndex]: letter,
    }));

    const correctAnswer = question?.alternatives?.find((alt: any) => alt.isCorrect);
    if (correctAnswer && correctAnswer.letter === letter) {
      incrementScore();
    }
  };

  const handleNextQuestion = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handlePreviousQuestion = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 1));
  };

  const resetTimer = () => {
    setTimeLeft(0);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };

  return (
    <>
      <main className="flex flex-col items-center p-12">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-10">Simulado ENEM</h1>
          {isSignedIn ? <div className="w-20 h-20"><UserButton /></div> : <Button onClick={() => router.push('/sign-in')}>Login</Button>}
        </div>

        <div className="flex flex-col gap-5 items-center">

          <div className="flex gap-2 items-center">
            <Button variant="secondary" onClick={handlePreviousQuestion} disabled={loading || currentIndex === 1}>
              <FaArrowLeft />
            </Button>

            <Button variant="secondary" onClick={handleNextQuestion} disabled={loading}>
              <FaArrowRight />
            </Button>
          </div>

          <div className={loading ? "hidden" : "flex gap-5 w-full justify-start items-center"}>
            {!timeLeft ? (
              <Select onValueChange={(value) => router.push(`/simulado?page=2&time=${value}`)} defaultValue={selectedTime.toString()}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="border rounded px-3 py-2">
                {timeLeft > 0 && (
                  <div className="text-md font-semibold self-start">
                    Tempo: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            )}

            <FaRedo
              className={`cursor-pointer ${isAnimating ? 'animate-spin' : ''}`}
              onClick={resetTimer}
              style={{ transition: 'transform 0.5s' }}
            />
          </div>

          {loading ? (
            <div className="absolute m-auto flex justify-center items-center min-h-[50vh]">
              <Loader />
            </div>
          ) : question && (
            <>
              <div className="mt-8 p-4 border rounded shadow w-full flex flex-col gap-3">
                <h2 className="text-xl font-semibold">Questão {question.index}</h2>
                <p className="font-bold">Ano: {question.year.toString()}</p>
                <p className="font-bold">Disciplina: {question.discipline.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}</p>
                <p>{question.alternativesIntroduction}</p>
                <p>{question.context}</p>
              </div>

              <div className="mt-4 flex flex-col gap-3 w-full">
                <h3 className="text-lg font-semibold">Alternativas:</h3>
                {question.alternatives.map((alt: any) => {
                  return (
                    <Button
                      key={alt.letter}
                      variant={selectedAnswer === alt.letter ? 'secondary' : 'outline'}
                      onClick={() => handleAnswerClick(alt.letter)}
                    >
                      {alt.letter}: {alt.text}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}