import { http } from "@hypermode/modus-sdk-as";

@json
class Quote {
  @alias("q")
  quote!: string;

  @alias("a")
  author!: string;
}

// this function makes a request to an API that returns data in JSON format, and
// returns an object representing the data
export function getRandomQuote(): Quote {
  const request = new http.Request("https://zenquotes.io/api/random");

  const response = http.fetch(request);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch quote. Received: ${response.status} ${response.statusText}`,
    );
  }

  // the API returns an array of quotes, but we only want the first one
  return response.json<Quote[]>()[0];
}
