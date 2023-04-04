const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const axios = require('axios')
const moment = require('moment')
require('dotenv').config({ path: path.join(__dirname, '.env') })

function createGitHubApi() {
  return axios.create({
    baseURL: 'https://api.github.com/',
    headers: {
      Authorization: `token ${process.env.GITHUBTOKEN}`,
    },
  })
}

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
  const githubApi = createGitHubApi()
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

async function getUser() {
  try {
    const githubApi = createGitHubApi()
    const { data: user } = await githubApi.get(`user`)
    return user
  } catch (error) {
    console.error(`No user found for this token`)
  }
}

async function fetchCommits(repo, startDate, endDate, user) {
  try {
    const githubApi = createGitHubApi()
    const { data: commits } = await githubApi.get(
      `repos/${repo.owner.login}/${repo.name}/commits`,
      {
        params: {
          since: startDate.toISOString(),
          until: endDate.toISOString(),
        },
      },
    )
    const userCommits = commits.filter((commit) => commit?.author?.login === user?.login)
    return userCommits
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
          Authorization: `Bearer ${process.env.OPENAIKEY}`,
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

function getLineFromUser() {
  return new Promise((resolve, reject) => {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.on('line', (input) => {
      rl.close()
      resolve(input)
    })
  })
}

function saveEnvFile() {
  const envPath = path.join(__dirname, '.env')
  const envConfig = dotenv.parse(fs.readFileSync(envPath))
  Object.assign(envConfig, {
    GITHUBTOKEN: process.env.GITHUBTOKEN,
    OPENAIKEY: process.env.OPENAIKEY,
  })
  fs.writeFileSync(envPath, stringifyEnv(envConfig))
}

function stringifyEnv(envConfig) {
  let str = ''
  for (const key in envConfig) {
    str += `${key}=${envConfig[key]}\n`
  }
  return str
}

async function WDIDY() {
  console.log('\n_____ What Did I Do Yesterday: _____\n')
  if (!process.env.GITHUBTOKEN) {
    console.log('Please provide your GitHub token:')
    console.log('=> Generate a GitHub token here: https://github.com/settings/tokens/new')
    process.env.GITHUBTOKEN = await getLineFromUser()
    saveEnvFile()
  }
  if (!process.env.OPENAIKEY) {
    console.log('Please provide your OpenAI API key:')
    console.log('=> Generate an OpenAI key here: https://platform.openai.com/')
    process.env.OPENAIKEY = await getLineFromUser()
    saveEnvFile()
  }
  const { start, end } = getLastWorkingDay()
  console.log(`\nThe last working day was on ${start.format('dddd, MMMM Do YYYY')}:\n`)
  const user = await getUser()
  const repos = await fetchRepositories()

  let summaryData = []

  for (const repo of repos) {
    const commits = await fetchCommits(repo, start, end, user)
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
