require('dotenv').config()
const axios = require('axios')
const moment = require('moment')

const GITHUBTOKEN = process.env.GITHUBTOKEN
const OPENAIKEY = process.env.OPENAIKEY

const githubApi = axios.create({
  baseURL: 'https://api.github.com/',
  headers: {
    Authorization: `token ${GITHUBTOKEN}`,
  },
})

async function fetchRepositories() {
  const { data: repos } = await githubApi.get('user/repos')
  return repos
}

async function fetchCommits(repo, date) {
  try {
    const { data: commits } = await githubApi.get(
      `repos/${repo.owner.login}/${repo.name}/commits`,
      {
        params: {
          since: date.startOf('day').toISOString(),
          until: date.endOf('day').toISOString(),
        },
      },
    )
    return commits
  } catch (error) {
    if (error.response.status === 409) {
      console.error(`No commits found for repository: ${repo.name}`)
      return []
    }
    throw error
  }
}

async function generateBulletPoints(summary) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Turn the following summary into bullet points:\n${summary}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAIKEY}`,
        },
      },
    )

    const output = response.data.choices[0].message.content.trim()
    const bulletPoints = output.split('\n')
    return bulletPoints
  } catch (error) {
    console.error('Error generating bullet points:', error.message)
    return []
  }
}

async function WDIDY() {
  const yesterday = moment().subtract(3, 'day')
  const repos = await fetchRepositories()

  let summary = ''

  for (const repo of repos) {
    const commits = await fetchCommits(repo, yesterday)
    if (commits.length > 0) {
      summary += `In repository ${repo.name}, you made ${commits.length} commit(s):\n`
      for (const commit of commits) {
        summary += `- ${commit.commit.message}\n`
      }
    }
  }

  if (summary) {
    const bulletPoints = await generateBulletPoints(summary)
    console.log('WDIDY:\n')
    for (const point of bulletPoints) {
      console.log(`- ${point}`)
    }
  } else {
    console.log("You didn't make any commits yesterday.")
  }
}

WDIDY().catch((error) => {
  console.error('An error occurred:', error.message)
})
