import { http, models, postgresql } from "@hypermode/modus-sdk-as";
import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import { JSON } from "json-as";

export function generateText(instruction: string, prompt: string): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
  ]);

  input.temperature = 0.7;
  const output = model.invoke(input);

  return output.choices[0].message.content.trim();
}


@json
class Quote {

  @alias("q")
  quote!: string;


  @alias("a")
  author!: string;
}

export function getRandomQuote(): Quote {
  const request = new http.Request("https://zenquotes.io/api/random");
  const response = http.fetch(request);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch quote. Received: ${response.status} ${response.statusText}`,
    );
  }

  return response.json<Quote[]>()[0];
}


@json
class Movie {
  id: number = 0;
  title: string = "";
  release_date: string = "";
  overview: string = "";
  vote_average: number = 0;
  backdrop_path: string = "";
  poster_path: string = "";
  tagline: string = "";
}


@json
class ApiResponse {
  results: Array<Movie> = [];
}
export function getTopMovies(): Movie[] {
  const url =
    "https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1";
  const request = new http.Request(url);
  const response = http.fetch(request);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch movie data. Received: ${response.status} ${response.statusText}`,
    );
  }
  const data = response.json<ApiResponse>();
  return data.results;
}

export function getMovieInfo(name: string): Movie[] {
  const url = `https://api.themoviedb.org/3/search/movie?query=${name}&include_adult=false&language=en-US&page=1`;
  const request = new http.Request(url);
  const response = http.fetch(request);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch movie data. Received: ${response.status} ${response.statusText}`,
    );
  }
  const data = response.json<ApiResponse>();
  if (data.results.length === 0) {
    throw new Error(`No movie found for the name: ${name}`);
  }
  return data.results; // Return the first movie// Return the first movie
}

export function getMovieById(id: number): Movie {
  const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US`;
  const request = new http.Request(url);
  const response = http.fetch(request);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch movie data. Received: ${response.status} ${response.statusText}`,
    );
  }
  const data = response.json<Movie>();
  return data;
}


@json
class WikipediaPage {
  id: number = 0;
  key: string = "";
  title: string = "";
  excerpt: string = "";
  matched_title: string | null = null;
  description: string | null = null;
}


@json
class WikipediaSearchResponse {
  pages: Array<WikipediaPage> = [];
}


@json
class License {
  url: string = "";
  title: string = "";
}


@json
class WikipediaPageContent {
  id: number = 0;
  key: string = "";
  title: string = "";
  content_model: string = "";
  license: License = new License(); // Nested type for "license"
  source: string = ""; // Raw wikitext content
}
export function getWikipediaInfo(name: string): string {
  // Step 1: Search for the Wikipedia page key
  const searchUrl =
    "https://api.wikimedia.org/core/v1/wikipedia/en/search/page?q=" +
    encodeURIComponent(name);
  const searchRequest = new http.Request(searchUrl);
  const searchResponse = http.fetch(searchRequest);

  if (!searchResponse.ok) {
    throw new Error(
      "Failed to fetch search results. Received: " +
        searchResponse.status.toString() +
        " " +
        searchResponse.statusText,
    );
  }

  // Deserialize the JSON response into a WikipediaSearchResponse class
  const searchData = searchResponse.json<WikipediaSearchResponse>();
  console.log(searchData.pages[0].key);
  // Check if the `pages` field exists and has results
  if (searchData.pages.length === 0) {
    throw new Error('No Wikipedia page found for "' + name + '"');
  }

  // Select the most relevant page (e.g., the first result)
  const pageKey = searchData.pages[0].key;

  // // Step 2: Fetch the full content of the page using the key
  const pageUrl =
    "https://api.wikimedia.org/core/v1/wikipedia/en/page/" +
    encodeURIComponent(pageKey);
  const pageRequest = new http.Request(pageUrl);
  const pageResponse = http.fetch(pageRequest);

  if (!pageResponse.ok) {
    throw new Error(
      "Failed to fetch Wikipedia page content. Received: " +
        pageResponse.status.toString() +
        " " +
        pageResponse.statusText,
    );
  }

  const pageData = pageResponse.json<WikipediaPageContent>();

  return pageData.source || "No summary available for this page.";
}


@json
class TriviaQuestion {
  question: string = "";
  options: string[] = [];
  answer: string = "";
  difficulty: string = "easy";
  category: string = "";
}


@json
class TriviaData {
  questions: TriviaQuestion[] = [];
}

export function generateTrivia(prompt: string): TriviaQuestion[] {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const systemInstruction = `You are a professional trivia question generator. Your task is to create engaging, accurate, and well-crafted trivia questions with multiple-choice answers from the provided content.
  REQUIREMENTS:
  1. Generate exactly 2 (two) trivia questions
  2. Question must be directly based on the provided content
  3. Include a mix of difficulties (easy, medium, hard)
  4. Cover different aspects of the content
  5. Avoid obvious or superficial questions
  6. Questions should be in a conversational tone
  7. Questions should be in English
  8. Majority of the questions should be from the plot
  9. Provide 4 possible answer choices for each question, including 1 correct answer and 3 plausible distractors

  QUESTION GUIDELINES:
  - Make questions specific and unambiguous
  - Ensure answers are factually correct and verifiable from the source
  - Include brief explanations for the correct answers
  - Categorize questions (e.g., Plot, Characters, Production, History, Technical)
  - Vary question types (who, what, when, where, why, how)

  FORMAT:
  Return only valid JSON matching this structure:
  {
    "questions": [
      {
        "question": "Clear, specific question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "answer": "Correct option text",
        "difficulty": "easy|medium|hard",
        "category": "Category name",
      }
    ]
  }

  IMPORTANT:
  - Question must include 4 answer options
  - DO NOT INCLUDE ANY EXTRA TEXT OR COMMENTS
  - Ensure answers are direct and concise
  - Do not create questions about information not present in the source
  - Ensure distractors are plausible and relevant`;

  const input = model.createInput([
    new SystemMessage(systemInstruction),
    new UserMessage(`Generate trivia questions from this content: ${prompt}`),
  ]);
  console.log(prompt);
  input.temperature = 0.5;
  // input.maxTokens = 3000;
  input.topP = 0.9;
  input.presencePenalty = 0.2;
  input.frequencyPenalty = 0.3;
  input.responseFormat = ResponseFormat.Json;

  const output = model.invoke(input);
  // const triviaData = JSON.parse(output.choices[0].message.content.trim());
  // console.log(triviaData);
  console.log(output.choices[0].message.content);
  // console.log(output.choices[0].message.content.trim());
  // const triviaQuestions = JSON.stringify<TriviaData>(
  //   JSON.parse(output.choices[0].message.content.trim()),
  // );

  // return triviaQuestions;
  const triviaData = JSON.parse<TriviaData>(
    output.choices[0].message.content.trim(),
  );

  // Return the `questions` array directly
  return triviaData.questions;
}


@json
class Game {
  id: i64 = 0;
  movie_id: i32 = 0;
  movie_title: string = "";
  created_at: string = ""; // ISO date string
  status: string = "";
  player_id: i32 = 0;
  score: i32 = 0;
}


@json
class Question {
  id: i64 = 0;
  game_id: i32 = 0;
  question_text: string = "";
  options: string[] = [];
  correct_answer: string = "";
  difficulty: string = "";
  category: string = "";
  player_answer: string = "";
  is_correct: bool = false;
}

export function createGameAndInsertQuestions(
  movieId: string,
  movieTitle: string,
  questions: TriviaQuestion[],
): string {
  console.log(movieTitle);
  // Insert game into the database
  const insertGameQuery = `
    INSERT INTO game (movie_id, movie_title, status, score)
    VALUES ($1, $2, 'ongoing', 0)
    RETURNING id;
  `;

  const gameParams = new postgresql.Params();
  gameParams.push(movieId);
  gameParams.push(movieTitle);

  const gameResult = postgresql.query<Game>(
    "triviadb",
    insertGameQuery,
    gameParams,
  );
  const gameId = gameResult.rows[0].id;
  // Insert questions into the database
  const insertQuestionQuery = `
    INSERT INTO question (game_id, question_text, options, correct_answer, difficulty, category)
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  for (let i = 0; i < questions.length; i++) {
    const q: TriviaQuestion = questions[i];

    const questionParams = new postgresql.Params();
    questionParams.push(gameId);
    questionParams.push(q.question); // Map to question_text
    questionParams.push(JSON.stringify(q.options));
    questionParams.push(q.answer); // Map to correct_answer
    questionParams.push(q.difficulty || null);
    questionParams.push(q.category || null);

    postgresql.execute("triviadb", insertQuestionQuery, questionParams);
  }

  return gameId.toString();
}

export function findQuestionById(gameId: string): Question[] {
  const selectQuery = `SELECT * FROM question WHERE game_id = $1`;
  const selectParams = new postgresql.Params();
  selectParams.push(gameId);

  const result = postgresql.query<Question>(
    "triviadb",
    selectQuery,
    selectParams,
  );
  return result.rows;
}


@json
class User {
  id: i32 = 0;
  name!: string;
  email!: string;
  stack_auth_id!: string;
}

export function userProfile(
  userId: string,
  email: string,
  name: string,
): string {
  // Query to fetch the user by stack_auth_id
  const selectQuery = `SELECT * FROM "User" WHERE stack_auth_id = $1`;
  const selectParams = new postgresql.Params();
  selectParams.push(userId);

  // Execute the query
  const response = postgresql.query<User>(
    "triviadb",
    selectQuery,
    selectParams,
  );

  // If the user doesn't exist, insert a new user
  if (response.rows.length === 0) {
    const insertQuery = `
        INSERT INTO "User" (stack_auth_id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (stack_auth_id) DO NOTHING
      `;
    const insertParams = new postgresql.Params();
    insertParams.push(userId);
    insertParams.push(email);
    insertParams.push(name);

    // Execute the insert query
    postgresql.execute("triviadb", insertQuery, insertParams);

    // Re-query to fetch the newly inserted user
    const newResponse = postgresql.query<User>(
      "triviadb",
      selectQuery,
      selectParams,
    );

    if (newResponse.rows.length > 0) {
      return newResponse.rows[0].name;
    } else {
      throw new Error("Failed to retrieve newly inserted user.");
    }
  }

  // Return the user's name if found
  return response.rows[0].name;
}

export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}

