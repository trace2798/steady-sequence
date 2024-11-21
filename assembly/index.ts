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
export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}
