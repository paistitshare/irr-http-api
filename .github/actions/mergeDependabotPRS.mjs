import { Octokit } from 'octokit';
import core from '@actions/core';
// import { GitHub, context } from '@actions/github';

const sleep = (timeMs) => {
  return new Promise((resolve) => {
    return setTimeout(() => {
      resolve();
    }, timeMs);
  });
};

const run = async () => {
  const octokit = new Octokit({
    auth: process.env.ACTION_SECRET
  });
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const { data: prsMetadata } = await octokit.rest.pulls.list({ owner, repo });

  prsMetadata
    .filter(({ user, head }) => user.login === 'dependabot[bot]' && head.ref.startsWith('dependabot/'))
    .forEach(async ({ number }) => {
      // const { createOAuthAppAuth } = require('@octokit/auth-oauth-app');
      // const perUserOctokit = new Octokit({
      //   authStrategy: createOAuthAppAuth,
      //   auth: userAuthenticationFromWebFlow.token,
      // });
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: number,
        event: 'APPROVE',
      });
      await octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: number,
      });
      // OR
      // curl --request GET \
      //   --url "https://api.github.com/octocat" \
      //   --header "Authorization: Bearer YOUR-TOKEN" \
      //   --header "X-GitHub-Api-Version: 2022-11-28"

      // const token = core.getInput('github-token')
      // const number = core.getInput('number')
      // const repoString = core.getInput('repo')

      // let repoObject
      // if (repoString) {
      //   const [owner, repo] = repoString.split('/')
      //   repoObject = { owner, repo }
      // } else {
      //   repoObject = context.repo
      // }

      // const octokit = new GitHub(token)

      // await octokit.pulls.createReview({
      //   ...repoObject,
      //   pull_number: number,
      //   event: 'APPROVE'
      // })

      // wait until other PRs are rebased
      await sleep(5000);
    });
};

void run().catch(error => core.setFailed(error.message));
