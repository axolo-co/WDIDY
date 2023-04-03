# WDIDY
What Did I do Yesterday is a simple script that will help developers answer the question for themself: what did I do yesterday?

# Why did we do WDIDY? 

Have you ever forgotten what you did yesterday at the moment you had to share it with your team? No more! WDIDY will help you answer this question in a few seconds.

## How did we do it?

WDIDY is a fun experiment, it was made entirely using ChatGPT 4.

## How to use it

1. Add a .env file in the cloned repository with: 

``
GITHUBTOKEN="YOUR_GITHUB_TOKEN" 
=> Generate a GitHub token here: https://github.com/settings/tokens/new.
OPENAIKEY="YOUR_OPENAI_KEY" 
=> Generate an OpenAI key here: https://platform.openai.com/
``

2. ``yarn add axios moment path dotenv``
3. ``yarn run widdy``

# Contributing

If you want to contribute to this project, simply fork it and submit a pull request. We will review it and merge it if it's good.

# ChatGPT 4 Prompt to come up with a first version of the script
Lets build simple script in Javascript that will be called WDIDY, this script will help developers answer the question for themself: 
WDIDY: "What did I do Yesterday"

With a github token for Auth, the script will look at all the repositories and commits they made yesterday. 
It will put everything in an object and then it will ask chat gpt to resume this in a bullet points manner. The prompt for generating bullet point should be something like "prompt: `Turn the following summary into bullet points separated by repository:\n\n${summary}`"

Can you help building this? 

More info: 
Use dotdotenv to import those two variables:
const GITHUBTOKEN = process.env.GITHUBTOKEN
const OPENAIKEY = process.env.OPENAIKEY
Use GPT 3 open ai to resume the bullet points
You should handle if a git repository as no commits and returns a 409 error

Here is some documentation on gpt 3.5, please adjust your answer to make it work with this: 
async function generateBulletPoints(summary) {
  const response = await openai.Completion.create({
    engine: 'davinci-codex',
    prompt: `Turn the following summary into bullet points:\n${summary}`,
    max_tokens: 100,
    n: 1,
    stop: null,
    temperature: 0.5,
  })

  return response.choices[0].text.trim().split('\n')
}
