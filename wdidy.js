const { Octokit } = require('@octokit/rest')
const openai = require('openai')

const token = 'your_personal_access_token_here'
const octokit = new Octokit({ auth: token })

async function main() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const commits = []
  const repos = await octokit.repos.listForAuthenticatedUser()
  for (const repo of repos.data) {
    const repoCommits = await octokit.repos.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      since: yesterdayStr,
    })
    commits.push(...repoCommits.data)
  }

  const commitInfo = { repos: {}, count: 0 }
  for (const commit of commits) {
    const repoName = commit.repository.name
    if (!(repoName in commitInfo.repos)) {
      commitInfo.repos[repoName] = []
    }
    commitInfo.repos[repoName].push(commit.commit.message)
    commitInfo.count += 1
  }

  openai.apiKey = 'your_api_key_here'
  const summaryPrompt = `Yesterday, I made ${commitInfo.count} commits to ${
    Object.keys(commitInfo.repos).length
  } repositories. Here's a summary:`
  const summary = await generateBulletPoints(summaryPrompt)
  console.log(summary)

  for (const repoName in commitInfo.repos) {
    console.log(`\n${repoName}:`)
    for (const message of commitInfo.repos[repoName]) {
      const bulletPointPrompt = `${message} `
      const bulletPoint = await generateBulletPoints(bulletPointPrompt)
      console.log(`- ${bulletPoint}`)
    }
  }
}

async function generateBulletPoints(prompt) {
  const completions = await openai.complete({
    engine: 'text-davinci-002',
    prompt: prompt,
    maxTokens: 1024,
    n: 1,
    stop: null,
    temperature: 0.5,
  })
  return completions.choices[0].text.trim()
}

main().catch(console.error)
