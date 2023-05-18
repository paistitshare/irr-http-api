import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import * as core from '@actions/core';

const run = async () => {
  const {
    GITHUB_TOKEN,
    APPROVER_APP_ID,
    APPROVER_APP_PRIVATE_KEY,
    APPROVER_APP_INSTALLATION_ID,
    // ORG_FULL_GITHUB_TOKEN
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
    // auth: ORG_FULL_GITHUB_TOKEN
  });
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const { data: prsMetadata } = await ghActionsOctokit.rest.pulls.list({ owner, repo });

  prsMetadata
    .filter(({ user, head, draft, state }) => {
      return user.login === 'dependabot[bot]' && head.ref.startsWith('dependabot/') &&
        draft === false && state === 'open';
    })
    .forEach(async ({ number }) => await approveAndMergePR({
      ghActionsOctokit,
      approverAppOctokit,
      prNumber: number,
      owner,
      repo
    }));
};

const retryUntilResolved = async (asyncCallback, failedOperationMessage) => {
  return new Promise(async (resolve, reject) => {
    const RETRY_INTERVAL = 3000
    const MAX_ATTEMPTS = 5;
    let currentAttempt = 1;

    if (await asyncCallback()) {
      core.info('first attempt');
      resolve();
    }

    const intervalId = setInterval(async () => {
      if (await asyncCallback()) {
        clearInterval(intervalId);
        resolve();
      }

      if (++currentAttempt >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        reject(failedOperationMessage);
      }

      core.info(`attempt number: ${currentAttempt}`);
    }, RETRY_INTERVAL);
  });
};

const isPRRebased = async (octokit, owner, repo, prNumber) => {
  const { data: { mergeable_state, rebaseable } } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  core.info(`isPRRebased: { mergeable_state: ${mergeable_state}, rebaseable: ${rebaseable} }`);

  return mergeable_state === 'clean' && rebaseable === true;
};

const approveAndMergePR = async ({
  ghActionsOctokit,
  approverAppOctokit,
  prNumber,
  owner,
  repo
}) => {
  let shouldSkipProcess = false;
  const { data: { html_url, mergeable, mergeable_state, merged, rebaseable } } = await ghActionsOctokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  core.info(JSON.stringify({ mergeable, mergeable_state, rebaseable }));

  if (merged) {
    return;
  }

  if (!mergeable && !await isPRRebased(ghActionsOctokit, owner, repo, prNumber)) {
    // Add comment to PR "@dependabot rebase"
    await approverAppOctokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: 'COMMENT',
      body: '@dependabot rebase',
    });

    // Retry until PR is rebased (PR is mergeable) or rebase did not succeed after n attempts
    await retryUntilResolved(
      async () => await isPRRebased(ghActionsOctokit, owner, repo, prNumber),
      'Failed to rebase PR'
    ).catch((error) => {
      core.error(error);
      shouldSkipProcess = true;
    });
  }

  if (shouldSkipProcess) {
    core.info(`Skipping process for PR #${prNumber} (${html_url})`);
    return;
  }

  // Approve PR as github-actions user
  await ghActionsOctokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: number,
    event: 'APPROVE',
  });

  // Approve PR as specific user
  await approverAppOctokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: number,
    event: 'APPROVE',
  });
  await ghActionsOctokit.rest.pulls.merge({
    owner,
    repo,
    pull_number: number,
  });
  core.info(`Merged PR #${prNumber} (${html_url})`);
};

void run().catch(error => core.setFailed(error.message));
