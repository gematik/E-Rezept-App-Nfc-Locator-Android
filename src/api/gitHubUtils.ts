/*
 * Copyright 2016, European Community
 * Copyright 2023, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.
 */

import {Constants} from '../constants';

const {Octokit} = require('@octokit/rest');
const {createAppAuth} = require('@octokit/auth-app');

/*
getNfcPosJson uses octokit to get the nfc_pos.json from the passed repository and branch and converts it back into JSON format
 */
async function getNfcPosJson(octokit, owner, repo, path, ref) {
  try {
    const fileData = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    return JSON.parse(Buffer.from(fileData.data.content, 'base64').toString());
  } catch (e) {
    console.log('Error:\n' + e + '\noccurred, while loading the nfc json file.');
    throw e;
  }
}

/*
updateNfcPosJson gets the JSON file and the new phone data. The function is looking for an existing entry for the committed phone model.
If there is no entry, the function adds the phone data and sorts the list afterwards, otherwise the function averages the existing entry and the new phone data.
 */
function updateNfcPosJson(nfcPosJson, phoneData) {
  const nfcPosIndex = nfcPosJson.findIndex(
    (jsonData) =>
      jsonData.marketingName === phoneData.marketingName && jsonData.manufacturer === phoneData.manufacturer,
  );
  if (nfcPosIndex !== -1) {
    nfcPosJson[nfcPosIndex] = {
      manufacturer: phoneData.manufacturer,
      marketingName: phoneData.marketingName,
      modelNames: [...new Set(nfcPosJson[nfcPosIndex].modelNames.concat(phoneData.modelNames))],
      nfcPos: {
        x0: (phoneData.nfcPos.x0 + nfcPosJson[nfcPosIndex].nfcPos.x0) / 2,
        y0: (phoneData.nfcPos.y0 + nfcPosJson[nfcPosIndex].nfcPos.y0) / 2,
        x1: (phoneData.nfcPos.x1 + nfcPosJson[nfcPosIndex].nfcPos.x1) / 2,
        y1: (phoneData.nfcPos.y1 + nfcPosJson[nfcPosIndex].nfcPos.y1) / 2,
      },
    };
  } else {
    nfcPosJson.push(phoneData);
    // sort by manufacturer then by marketingname
    nfcPosJson.sort((a, b) => {
      if (a.manufacturer.toLowerCase() < b.manufacturer.toLowerCase()) {
        return -1;
      } else if (a.manufacturer.toLowerCase() === b.manufacturer.toLowerCase()) {
        if (a.marketingName.toLowerCase() < b.marketingName.toLowerCase()) {
          return -1;
        }
      }
    });
  }
  return nfcPosJson;
}

/*
findOrCreateBranch uses octokit to find a branch for the phone model. If successful the function returns the name of the branch,
otherwise it calls the createBranch-Function to create a new one.
 */
async function findOrCreateBranch(octokit, owner, repo, phoneData) {
  let response;
  let branchData;
  try {
    response = await octokit.rest.repos.listBranches({
      owner,
      repo,
    });
    branchData = response.data.find(
      (dataObj) =>
        dataObj.name ===
        'update-nfc-pos-for-' +
          (phoneData.manufacturer.replaceAll(' ', '-').replaceAll('()','') + '_' + phoneData.marketingName.replaceAll(' ', '-').replaceAll('()','')),
    );
  } catch (e) {
    console.log('Error:\n' + e + '\noccurred, while searching for an existing branch.');
    throw e;
  }
  if (branchData !== undefined) {
    return [false, 'refs/heads/' + branchData.name];
  } else {
    return [true, await createBranch(octokit, owner, repo, phoneData)];
  }
}

/*
createBranch uses octokit to search for the last commit to the main branch. From there it will create a new branch using the phone data to create a unique name
 */
async function createBranch(octokit, owner, repo, phoneData) {
  // new branch name
  const newBranchName = `refs/heads/update-nfc-pos-for-${
    phoneData.manufacturer.replaceAll(' ', '-') + '_' + phoneData.marketingName.replaceAll(' ', '-')
  }`;
  try {
    // fetch commits to get SHA sum of the last commit, from which we will branch out.
    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo,
    });
    const lastSHA = commits.data[0].sha;
    // create branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: newBranchName,
      sha: lastSHA,
    });
  } catch (e) {
    console.log('Error:\n' + e + '\noccurred, while creating a new branch.');
    throw e;
  }
  return newBranchName;
}

/*
commitUpdatedObject uses octokit to find and update the file that needs to be updated.
 */
async function commitUpdatedObject(octokit, owner, repo, path, branchName, newNfcPosJson) {
  // get SHA sum of the file in target branch
  try {
    const { sha } = (
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branchName,
      })
    ).data;

    // And commit our changes to that branch
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch: branchName,
      message: branchName,
      sha,
      content: Buffer.from(JSON.stringify(newNfcPosJson, null, 2)).toString('base64'),
    });
  } catch (e) {
    console.log('Error:\n' + e + '\noccurred, while updating the nfc position file.');
    throw e;
  }
}

/*
createOrUpdatePullRequest uses octokit to create a PullRequest if it's needed,
otherwise (when an existing branch for the phone model was found) it will update the existing pull request by adding the name of the user as new Line to the description.
In the rare case (someone has not closed the branch after merch) that an existing branch was found, but no pull request exists, this function will be called again in order to create a pull request.
 */
async function createOrUpdatePullRequest(octokit, owner, repo, branchName, user, phoneData, needToCreatePullRequest) {
  if (needToCreatePullRequest) {
    try {
      // get the name of a default branch as it is not always a 'master' - in our case it is master.
      // eslint-disable-next-line camelcase
      const { default_branch } = (await octokit.rest.repos.get({ owner, repo })).data;
      // and create PR to merge into it
      await octokit.rest.pulls.create({
        owner,
        repo,
        title: `Merge ${branchName} into Master`,
        head: branchName,
        // eslint-disable-next-line camelcase
        base: default_branch,
        maintainer_can_modify: true,
        body: `@${user} updated the nfc position data for ${phoneData.manufacturer} - ${phoneData.marketingName}`,
      });
    } catch (e) {
      console.log('Error:\n' + e + '\noccurred, while creating a pull request.');
      throw e;
    }
  } else {
    try {
      const response = await octokit.rest.pulls.list({
        owner,
        repo,
      });
      const pullRequest = response.data.find((pullRequest) => pullRequest.title === `Merge ${branchName} into Master`);
      if (pullRequest !== undefined) {
        await octokit.rest.pulls.update({
          owner,
          repo,
          pull_number: pullRequest.number,
          body:
            pullRequest.body +
            `\n@${user} updated the nfc position data for ${phoneData.manufacturer} - ${phoneData.marketingName}`,
        });
      } else {
        // there was no matching pull request found -> create a pull request
        await createOrUpdatePullRequest(octokit, owner, repo, branchName, user, phoneData, true);
      }
    } catch (e) {
      console.log('Error:\n' + e + '\noccurred, while updating an existing pull request.');
      throw e;
    }
  }
}

/*
getUserName uses octokit oAuth to get the name of the user.
 */
async function getUserName(accessToken) {
  try {
    const octokit = new Octokit({
      auth: accessToken,
    });
    const {
      data: { login },
    } = await octokit.request('GET /user');
    return login;
  } catch (e) {
    console.log('Error:\n' + e + '\noccurred, while getting the user name.');
    throw e;
  }
}

/*
updateRemoteRepository calls the functions above in the right way commit the phone data to gitHub and create a pull request.
 */
export async function updateRemoteRepository(accessToken, phoneData) {
  const owner = Constants.REPO_OWNER;
  const repo = Constants.REPO_NAME;
  const path = Constants.PATH_TO_FILE;
  const userName = await getUserName(accessToken);
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.gitHubAppID,
      privateKey: process.env.gitHubAppPrivateKey,
      installationId: process.env.gitHubAppInstallationID,
    },
  });
  const [needCreatePullRequest, branchName] = await findOrCreateBranch(octokit, owner, repo, phoneData);
  const nfcPosJson = await getNfcPosJson(octokit, owner, repo, path, branchName);
  const newNfcPosJson = updateNfcPosJson(nfcPosJson, phoneData);
  await commitUpdatedObject(octokit, owner, repo, path, branchName, newNfcPosJson);
  await createOrUpdatePullRequest(octokit, owner, repo, branchName, userName, phoneData, needCreatePullRequest);
}

/*
checkAuthState uses octokit oAuth to check if the User is authenticated.
 */
export async function getAuthState(accessToken) {
  try {
    const octokit = new Octokit({
      auth: accessToken,
    });
    await octokit.request('GET /user');
    return true;
  } catch (e) {
    return false;
  }
}
