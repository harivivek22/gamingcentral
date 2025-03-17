"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import Papa from "papaparse"

interface Movie {
  title: string
  releaseDate: Date
  director: string
  cast: string
  musicDirector: string
  productionHouse: string
}

export default function OrderOfMoviesPage() {
  const [gameState, setGameState] = useState<"start" | "playing" | "result">("start")
  const [movies, setMovies] = useState<Movie[]>([])
  const [playerOrder, setPlayerOrder] = useState<(Movie | null)[]>([null, null, null])
  const [timer, setTimer] = useState(30)
  const [score, setScore] = useState(1000)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState("")

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/arrangemovies-9U0YLeWUMSIOOnmXSP8KzDMmoOVeHv.csv",
      )
      if (!response.ok) throw new Error("Failed to load CSV file")

      const csvText = await response.text()

      return new Promise<Movie[]>((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const allMovies = results.data
              .filter((movie: any) => movie.year && movie.month && movie.date && movie.Title)
              .map((movie: any) => ({
                title: movie.Title,
                releaseDate: new Date(`${movie.year}-${movie.month}-${movie.date}`),
                director: movie.Director,
                cast: movie.Cast,
                musicDirector: movie["Music Director"],
                productionHouse: movie["Production House"],
              }))

            let startIndex = Number.parseInt(localStorage.getItem("movieIndex") || "0")

            if (startIndex >= allMovies.length - 2) {
              startIndex = 0
              localStorage.setItem("movieIndex", "0")
            }

            const selectedMovies = allMovies.slice(startIndex, startIndex + 3)

            localStorage.setItem("movieIndex", (startIndex + 3).toString())

            resolve(selectedMovies)
          },
          error: (error) => {
            reject(error)
          },
        })
      })
    } catch (error) {
      console.error("Error loading movies:", error)
      alert("Failed to load movie data")
      return []
    }
  }, [])

  const startGame = useCallback(async () => {
    const fetchedMovies = await fetchMovies()
    setMovies(fetchedMovies)
    setGameState("playing")
    setPlayerOrder([null, null, null])
    setTimer(30)
    setScore(1000)
    setIsCorrect(null)
    setFeedbackMessage("")
  }, [fetchMovies])

  const checkOrder = useCallback(() => {
    const correctOrder = [...movies].sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime())
    return JSON.stringify(playerOrder.map((m) => m?.title)) === JSON.stringify(correctOrder.map((m) => m.title))
  }, [movies, playerOrder])

  const handleDrop = useCallback((movie: Movie, index: number) => {
    setPlayerOrder((prev) => {
      const newOrder = [...prev]
      // If the movie is already in another position, remove it from there
      const existingIndex = newOrder.findIndex((m) => m?.title === movie.title)
      if (existingIndex !== -1) {
        newOrder[existingIndex] = null
      }
      newOrder[index] = movie
      return newOrder
    })
  }, [])

  const submitOrder = useCallback(() => {
    // Check if all positions are filled and no duplicates
    const isValid = playerOrder.every((m) => m !== null) && new Set(playerOrder.map((m) => m?.title)).size === 3

    if (!isValid) {
      setFeedbackMessage("Please place all three movies in different positions!")
      setTimeout(() => setFeedbackMessage(""), 2000)
      return
    }

    const correct = checkOrder()
    setIsCorrect(correct)
    if (correct) {
      setGameState("result")
    } else {
      setFeedbackMessage("Wrong order! Try again!")
      setTimeout(() => setFeedbackMessage(""), 2000)
      setPlayerOrder([null, null, null])
    }
  }, [checkOrder, playerOrder])

  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setGameState("result")
            return 0
          }
          return prev - 1
        })
        setScore((prev) => Math.max(0, prev - 33))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState])

  const MovieBox = ({
    movie,
    isDraggable,
    onDragStart,
  }: { movie: Movie | null; isDraggable: boolean; onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void }) => (
    <div
      className={`w-full sm:w-32 h-16 sm:h-20 bg-white shadow-lg rounded-lg flex items-center justify-center cursor-move
      transform transition-all duration-200 ease-in-out
      ${isDraggable ? "hover:scale-105 hover:shadow-xl" : ""}
      border-2 sm:border-4 border-gray-300`}
      style={{
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
        transform: "perspective(1000px) rotateX(5deg)",
      }}
      draggable={isDraggable}
      onDragStart={onDragStart}
    >
      <span className="text-sm sm:text-lg font-bold text-center px-2 break-words">{movie?.title || ""}</span>
    </div>
  )

  if (gameState === "start") {
    return (
      <div className="min-h-screen bg-[#54CAEC] flex flex-col">
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-black text-center">Order of Movies</h1>
          <p className="text-lg sm:text-xl mb-8 text-black text-center">Arrange movies by their release date.</p>
          <Button
            onClick={startGame}
            className="bg-[#E5E000] text-black hover:bg-yellow-400 text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6"
          >
            Start Game
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  if (gameState === "playing") {
    return (
      <div className="min-h-screen bg-[#54CAEC] flex flex-col">
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="mb-4 flex justify-between w-full max-w-xs sm:max-w-md">
            <div className="text-xl sm:text-2xl font-bold text-black">Time: {timer}s</div>
            <div className="text-xl sm:text-2xl font-bold text-black">Score: {score}</div>
          </div>
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`w-full sm:w-36 h-20 sm:h-24 border-2 sm:border-4 ${
                  playerOrder[index] ? "border-blue-500" : "border-dashed border-gray-400"
                } 
                  rounded-lg flex items-center justify-center bg-gray-100`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const movieTitle = e.dataTransfer.getData("text/plain")
                  const movie =
                    movies.find((m) => m.title === movieTitle) || playerOrder.find((m) => m?.title === movieTitle)
                  if (movie) handleDrop(movie, index)
                }}
              >
                {playerOrder[index] ? (
                  <MovieBox
                    movie={playerOrder[index]}
                    isDraggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", playerOrder[index]!.title)
                    }}
                  />
                ) : (
                  <span className="text-sm sm:text-base text-gray-400">Drop here</span>
                )}
              </div>
            ))}
          </div>
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4">
            {movies
              .filter((movie) => !playerOrder.some((m) => m?.title === movie.title))
              .map((movie) => (
                <MovieBox
                  key={movie.title}
                  movie={movie}
                  isDraggable={true}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", movie.title)}
                />
              ))}
          </div>
          {feedbackMessage && <p className="text-red-500 mb-4 text-center">{feedbackMessage}</p>}
          <Button
            onClick={submitOrder}
            disabled={playerOrder.some((m) => m === null)}
            className="bg-[#E5E000] text-black hover:bg-yellow-400 text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6"
          >
            Submit Order
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#54CAEC] flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-black text-center">
          {isCorrect ? "Congratulations!" : "Time's Up!"}
        </h1>
        <p className="text-lg sm:text-xl mb-8 text-black text-center">
          {isCorrect
            ? `Your score: ${score}`
            : `Correct order: ${movies
                .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime())
                .map((m) => m.title)
                .join(" → ")}`}
        </p>
        <Button
          onClick={startGame}
          className="bg-[#E5E000] text-black hover:bg-yellow-400 mb-4 text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6"
        >
          Play Again
        </Button>
        <Link href="/">
          <Button
            variant="outline"
            className="bg-game2-bg text-black hover:bg-game2-hover text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6"
          >
            Back to Home
          </Button>
        </Link>
      </main>
      <Footer />
    </div>
  )
}

