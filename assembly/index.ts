import { http, models } from "@hypermode/modus-sdk-as";
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

  // // Define a simple response structure for the page content
  // @json
  // class WikipediaPageContent {
  //   extract: string | null = null;
  // }

  // // Deserialize the page content
  const pageData = pageResponse.json<WikipediaPageContent>();

  // // Return the extract/summary, or a default message if it's missing
  return pageData.source || "No summary available for this page.";
  // return pageKey;
}

export function generateTrivia(prompt: string): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");
  // const systemInstruction = `You are a professional trivia question generator. Your task is to create engaging, accurate, and well-crafted trivia questions from the provided content.

  // REQUIREMENTS:
  // 1. Generate exactly 5 unique trivia questions
  // 2. Questions must be directly based on the provided content
  // 3. Include a mix of difficulties (easy, medium, hard)
  // 4. Cover different aspects of the content
  // 5. Avoid obvious or superficial questions
  // 6. Questions should be in a conversational tone
  // 7. Questions should be in English
  // 8. Majority of the questions should be from the plot
  // 9. Together with the actual question, you also give 4 possible answers to choose from.

  // QUESTION GUIDELINES:
  // - Make questions specific and unambiguous
  // - Ensure answers are factually correct and verifiable from the source
  // - Include brief explanations for complex answers
  // - Categorize questions (e.g., Plot, Characters, Production, History, Technical)
  // - Vary question types (who, what, when, where, why, how)

  // FORMAT:
  // Return only valid JSON matching this structure:
  // {
  //   "questions": [
  //     {
  //       "question": "Clear, specific question text",
  //       "answer": "Precise, accurate answer",
  //       "difficulty": "easy|medium|hard",
  //       "category": "Category name",
  //       "explanation": "Optional explanation for complex answers"
  //     }
  //   ],
  //   "source": "Brief description of source content",
  //   "metadata": {
  //     "totalQuestions": 5,
  //     "categories": ["array of unique categories used"],
  //     "generatedAt": "ISO timestamp"
  //   }
  // }

  // IMPORTANT:
  // - No multiple choice questions
  // - No true/false questions
  // - Questions must require specific knowledge from the content
  // - Do not create questions about information not present in the source
  // - Ensure answers are direct and concise`;
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
        "explanation": "Optional explanation for correct answer"
      }
    ],
    "source": "Brief description of source content",
    "metadata": {
      "totalQuestions": 5,
      "categories": ["array of unique categories used"],
      "generatedAt": "ISO timestamp"
    }
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

  input.temperature = 0.5; // Slightly higher for more creative questions
  input.maxTokens = 2000; // Ensure enough space for detailed responses
  input.topP = 0.9; // Keep good variety while maintaining quality
  input.presencePenalty = 0.2; // Encourage some diversity in questions
  input.frequencyPenalty = 0.3; // Avoid repetitive patterns

  const output = model.invoke(input);

  return output.choices[0].message.content.trim();
}

export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}
