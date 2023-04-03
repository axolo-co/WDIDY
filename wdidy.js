const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

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

function getLastWorkingDay() {
  const today = moment()
  let lastWorkingDay

  switch (today.day()) {
    case 1: // Monday
      lastWorkingDay = today.clone().subtract(3, 'days')
      break
    case 0: // Sunday
      lastWorkingDay = today.clone().subtract(2, 'days')
      break
    case 6: // Saturday
      lastWorkingDay = today.clone().subtract(1, 'day')
      break
    default: // Weekdays (Tuesday - Friday)
      lastWorkingDay = today.clone().subtract(1, 'day')
      if (lastWorkingDay.day() === 0) {
        lastWorkingDay.subtract(2, 'days')
      } else if (lastWorkingDay.day() === 6) {
        lastWorkingDay.subtract(1, 'day')
      }
      break
  }

  // Return an object containing the start and end dates
  return {
    start: lastWorkingDay.clone().startOf('day'),
    end: lastWorkingDay.clone().endOf('day'),
  }
}

async function fetchRepositories() {
  const activeRepositories = 30
  const perPage = 100 // Number of repositories to return per page (max 100)
  const { data: repos } = await githubApi.get(`user/repos?per_page=${perPage}`)
  // Sort the repositories by updated_at in descending order
  const sortedRepos = repos.sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  )
  // Return only the first activeRepositories repositories
  const activeRepos = sortedRepos.slice(0, activeRepositories)
  // Check if there are more active repositories on the next page
  if (activeRepos.length < activeRepositories && repos.length === perPage) {
    // If there are more repositories on the next page, recursively fetch the next page
    const nextActiveRepos = await fetchRepositories(page + 1)
    // Concatenate the active repositories from the next page with the current active repositories
    return activeRepos.concat(
      nextActiveRepos.slice(0, activeRepositories - activeRepos.length),
    )
  }
  return activeRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
}

async function fetchCommits(repo, startDate, endDate) {
  try {
    const { data: commits } = await githubApi.get(
      `repos/${repo.owner.login}/${repo.name}/commits`,
      {
        params: {
          since: startDate.toISOString(),
          until: endDate.toISOString(),
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
            content: `Help me prepare my standup of thing I did, I need to know in a few bullets points what I was up to recently and on which repository from this list of commits from Github.\n\n${summary}`,
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
  console.log('WDIDY:\n')
  const { start, end } = getLastWorkingDay()
  const repos = await fetchRepositories()

  let summaryData = []

  for (const repo of repos) {
    const commits = await fetchCommits(repo, start, end)
    if (commits.length > 0) {
      const commitMessages = commits.map((commit) => commit.commit.message)
      summaryData.push({
        repository: repo.name,
        commitCount: commits.length,
        commitMessages: commitMessages,
      })
    }
  }

  const summary = JSON.stringify(summaryData, null, 2)

  if (summary !== '[]') {
    const bulletPoints = await generateBulletPoints(summary)
    for (const point of bulletPoints) {
      console.log(`${point}`)
    }
  } else {
    console.log("You didn't make any commits yesterday.")
  }
}

WDIDY().catch((error) => {
  console.error('An error occurred:', error.message)
})
