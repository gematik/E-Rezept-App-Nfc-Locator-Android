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

import axios from 'axios';
import {getAuthState, updateRemoteRepository} from './gitHubUtils';

const express = require('express');
const app = express();
const session = require('express-session');
const helmet = require('helmet')
const MongoStore = require('connect-mongo');
const uri = `mongodb://${process.env.dbUser}:${process.env.dbPassword}@${process.env.dbHost}:${process.env.dbLocalPort}/${process.env.dbName}?directConnection=true&retryWrites=true&writeConcern=majority`;

app.use(helmet());
app.use(
    session({
      store: MongoStore.create({
        mongoUrl: uri,
      }),
      secret: process.env.sessionSecret,
      resave: false,
      name: process.env.sessionName,
      saveUninitialized: true,
      cookie: {
        secure: false
      }
    }),
);
app.use(express.json());
app.disable('x-powered-by');
/*
The app/website requests a request token from GitHub to authenticate the user. The token is sent to "AppURL"/gitHub/callback.
The app uses this token in order to exchange it for an authentication token/ access token, which is later used to get the name of the user.
The access token is stored in the session.

After the authentication process the app is redirecting to a subpage in order to upload the stored phone data to GitHub.
 */
app.get('/callback', async (req, res) => {
  const requestToken = req.query.code;

  // auth token in session speichern
  const config = { headers: { accept: 'application/json' } };
  const url = `https://github.com/login/oauth/access_token`;
  try {
    const { data } = await axios.post(url, {
      client_id: process.env.gitHubAppClientID,
      client_secret: process.env.gitHubAppSecret,
      code: requestToken
    }, config);
    req.session.token = data.access_token;
  } catch (e) {
    console.log(e)
  }

  // redirect to save cached formdata
  res.redirect(`${process.env.nfcLocatorURL}/save-auth-status`);
});

/*
This endpoint ("AppURL"/gitHub/save-phone-data) is used to upload the saved phone data to GitHub.
 */
app.post('/save-phone-data', async (req, res) => {
  try {
    await updateRemoteRepository(req.session.token, req.body);
    res.status(201).send('nfc position data transferred successfully.');
  } catch (e) {
    res.status(400).send('nfc position data transfer failed with error: \n' + e);
  }
});

app.get('/auth-state', async (req, res) => {
  res.json(await getAuthState(req.session.token));
});

module.exports = app;
