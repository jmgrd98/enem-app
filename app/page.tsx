'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useUserScore } from "@/context/UserScoreContext";
import { UserButton, useUser } from "@clerk/nextjs"; // Import useUser from Clerk
import axios from 'axios';
import { useState, useEffect } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { useRouter } from 'next/navigation'; // Import useRouter from next/navigation

export default function Home() {
  const { score, incrementScore, resetScore } = useUserScore();
  const router = useRouter(); // Initialize the useRouter hook

  const { isSignedIn } = useUser(); // Use Clerk's useUser to check authentication state

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string | null>>({});
  
  const fetchQuestion = async (index: number, year: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.enem.dev/v1/exams/${year}/questions/${index}`);
      setQuestion(response.data);
      setSelectedAnswer(selectedAnswers[index] || null);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion(currentIndex, selectedYear);
  }, [currentIndex, selectedYear]);

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

  const handleLoginClick = () => {
    router.push('/sign-in'); // Redirect to the /sign-in page
  };

  return (
    <>
      <main className="flex flex-col items-center p-12">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-10">Gerador de Questão Enem</h1>
          {isSignedIn ? <UserButton /> : <Button onClick={handleLoginClick}>Login</Button>}
        </div>

        <div className="flex flex-col gap-5 items-center">
          <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={selectedYear.toString()}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(2024 - 2009 + 1)].map((_, i) => {
                const year = 2024 - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center">
            <Button variant="secondary" onClick={handlePreviousQuestion} disabled={loading || currentIndex === 1}>
              <FaArrowLeft />
            </Button>

            <Button variant="secondary" onClick={handleNextQuestion} disabled={loading}>
              <FaArrowRight />
            </Button>
          </div>

          {question && (
            <>
              <div className="mt-8 p-4 border rounded shadow w-full flex flex-col gap-3">
                <h2 className="text-xl font-semibold">Questão {question.index}</h2>
                <p className="font-bold">Ano: {question.year.toString()}</p>
                <p className="font-bold">Disciplina: {question.discipline}</p>
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
