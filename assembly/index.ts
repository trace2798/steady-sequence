import { http, models, postgresql } from "@hypermode/modus-sdk-as";
import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";

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
  difficulty: string = "";
  category: string = "";
}


@json
class TriviaMetadata {
  totalQuestions: i32 = 0;
  categories: string[] = [];
  generatedAt: string = "";
}


@json
class TriviaResponse {
  questions: TriviaQuestion[] = [];
  source: string = "";
  metadata: TriviaMetadata = new TriviaMetadata();
}

export function generateTrivia(prompt: string): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const systemInstruction = `You are a professional trivia question generator. Your task is to create engaging, accurate, and well-crafted trivia questions with multiple-choice answers from the provided content.
  REQUIREMENTS:
  1. Generate exactly 5 unique trivia questions
  2. Questions must be directly based on the provided content
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
  - All questions must include 4 answer options
  - Ensure answers are direct and concise
  - Do not create questions about information not present in the source
  - Ensure distractors are plausible and relevant`;

  const input = model.createInput([
    new SystemMessage(systemInstruction),
    new UserMessage(`Generate trivia questions from this content: ${prompt}`),
  ]);

  input.temperature = 0.5;
  // input.maxTokens = 3000;
  input.topP = 0.9;
  input.presencePenalty = 0.2;
  input.frequencyPenalty = 0.3;

  const output = model.invoke(input);
  console.log(output.choices[0].message.content.trim());
  return output.choices[0].message.content.trim();
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
  const query = `select * from "User" where stack_auth_id = $1`;
  console.log(query);
  const params = new postgresql.Params();
  params.push(userId);
  const response = postgresql.query<User>("triviadb", query, params);
  console.log(response.rows[0].name);
  if (response.rows.length === 0) {
    const insertQuery = `
    insert into "User" (stack_auth_id, email, name)
    values ($1, $2, $3)
    on conflict (stack_auth_id) do nothing
  `;
    const insertParams = new postgresql.Params();
    insertParams.push(userId);
    insertParams.push(email);
    insertParams.push(name);

    const insertResponse = postgresql.execute(
      "triviadb",
      insertQuery,
      insertParams,
    );
    console.log(insertResponse.rowsAffected.toString());
    return `Hello, ${userId}, ${name}, ${email}!`;
  }

  return response.rows[0].id.toString();
}

export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}
