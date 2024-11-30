# Rec & Triv Backend

This is the backend repository for the Rec & Triv project.

Rec & Triv is a web application that offers personalized movie recommendations and engaging trivia games based on selected movies. Discover new films and test your knowledge all in one place! This is my official submission to the [Modus Hackathon 2024](https://hashnode.com/hackathons/hypermode), hosted in [Hashnode](https://hashnode.com).

Detail Article [Rec & Triv](https://shreyas-chaliha.hashnode.dev/rec-triv)


## Installation

Clone the Repository

```code
git clone https://github.com/trace2798/steady-sequence.git
```

Navigate to the Project Directory

```code
cd steady-sequence
```

## Set Up Environment Variables

Create a .env file in the root directory and add the following:

```code
MODUS_TMDB_API_KEY=""
MODUS_TMDB_API_TOKEN=""

MODUS_WIKIPEDIA_WIKI_API_TOKEN=""

MODUS_TRIVIADB_USERNAME=""
MODUS_TRIVIADB_PASSWORD=""

# Not required unless you want to use model not available in hypermode.
MODUS_TOGETHER_AI_API_TOKEN=""
```

Run the Application

```code
  modus dev
```

## Access the Application
Your local endpoint should be ready at:
• GraphQL (default): http://localhost:8686/graphql


License

This project is licensed under the MIT License.
