# WDIDY
Assuming developers write informative commits, WDIDY (What Did I Do Yesterday) streamlines standups by helping them quickly summarize their previous working day's tasks. With WDIDY, developers can easily track their daily progress and have a ready-made answer to the standup question.

![Wdidy screenshot](https://raw.githubusercontent.com/axolo-co/WDIDY/main/images/wdidyscreenshot.jpg)

# Why did we do WDIDY? 

Have you ever forgotten what you did yesterday at the moment you had to share it with your team? No more! WDIDY will help you answer this question in a few seconds by looking at the commit messages you made on your last working day.

## How did we do it?

WDIDY is a fun experiment, it was made entirely using ChatGPT 4.

## How does it work? 

WDIDY will look at your 30 most recent updated repositories, fetch the commits you've made that day and prompt ChatGPT 3.5 to resume them in bullet points.

## How to use it

1. ``npm install axios dotenv moment readline``
2. ``npm run wdidy``

You will be prompted to add your GitHub token and OpenAI API key. You can get them here:

=> Generate a GitHub token here: https://github.com/settings/tokens/new.

=> Generate an OpenAI key here: https://platform.openai.com/

# Contributing

If you have suggestions for improvements, first open an issue to discuss them. To get involved in this project, fork it and submit a pull request. We will evaluate its relevance to the project and, if helpful, merge it.

# ChatGPT 4 Prompt to come up with a first version of the script
```
Create a program called "WDIDY" that automatically generates bullet points of recent work done on GitHub repositories, using the GitHub API and OpenAI's GPT-3.5 language model. The program should follow the steps below:

1. Import the required libraries: axios, moment, and dotenv.
2. Load environment variables from a .env file using dotenv and store them in variables named GITHUBTOKEN and OPENAIKEY.
3. Define a function called getLastWorkingDay that returns an object containing the start and end dates of the last working day.
4. Define a function called fetchRepositories that fetches the user's repositories from GitHub API and returns the first 30 active repositories sorted by last updated date.
5. Define a function called fetchCommits that fetches the commits for a given repository and date range from GitHub API and returns them as an array.
6. Define a function called generateBulletPoints that uses OpenAI's GPT-3 language model to generate bullet points summarizing recent work done on GitHub repositories.
7. Define a function called WDIDY that orchestrates the above functions to fetch recent commits from the user's GitHub repositories and generate bullet points summarizing the work done on the last working day.
8. Call the WDIDY function and handle any errors that occur.

Note: The program assumes that the user has a valid GitHub token and OpenAI API key stored in environment variables named GITHUBTOKEN and OPENAIKEY, respectively.

```
