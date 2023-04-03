# ChatGPT 4 Prompt
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
