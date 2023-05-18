import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import * as core from '@actions/core';

const sleep = (timeMs) => {
  return new Promise((resolve) => {
    return setTimeout(() => {
      resolve();
    }, timeMs);
  });
};

const run = async () => {
  const {
    GITHUB_TOKEN,
    APPROVER_APP_ID,
    APPROVER_APP_PRIVATE_KEY,
    APPROVER_APP_INSTALLATION_ID
  } = process.env;
  const ghActionsOctokit = new Octokit({
    auth: GITHUB_TOKEN
  });
  const approverAppOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: APPROVER_APP_ID,
      privateKey: APPROVER_APP_PRIVATE_KEY,
      installationId: APPROVER_APP_INSTALLATION_ID,
    }
  });
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const { data: prsMetadata } = await ghActionsOctokit.rest.pulls.list({ owner, repo });
  core.debug(JSON.stringify(prsMetadata, null, 2));

  prsMetadata
    .filter(({ user, head, merged }) => {
      return user.login === 'dependabot[bot]' && head.ref.startsWith('dependabot/') &&
        merged === false;
    })
    .forEach(async ({ number, html_url }) => await approveAndMergePR(ghActionsOctokit, approverAppOctokit, number, html_url));
};

const approveAndMergePR = async (ghActionsOctokit, approverAppOctokit, prNumber, prURL) => {
  // const prIsMerged = await ghActionsOctokit.rest.pulls.checkIfMerged({
  //   owner,
  //   repo,
  //   pull_number: prNumber,
  // });

  // if (prIsMerged) {
  //   return;
  // }

  // TODO: check if PR has merge conflicts
  // TODO: try resolving merge conflicts with chosen strategy from input (ours, theirs) or skip this PR

  // TODO: POLL until PR is rebased or rebase failed
  // await sleep(5000);

  // Approve PR as github-actions user
  await ghActionsOctokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    event: 'APPROVE',
  });

  // Approve PR as specific user
  await approverAppOctokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    event: 'APPROVE',
  });
  // await ghActionsOctokit.rest.pulls.merge({
  //   owner,
  //   repo,
  //   pull_number: prNumber,
  // });
  core.debug(`Merged PR #${prNumber} (${prURL})`);
};

void run().catch(error => core.setFailed(error.message));
