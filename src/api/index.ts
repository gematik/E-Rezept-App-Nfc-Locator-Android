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
import {csvToJsonByManufacturer} from './indexUtils';

const app = require('express')();

app.get('/googleDeviceList', async (req, res) => {
  const response = await axios.get(`https://storage.googleapis.com/play_public/supported_devices.csv`, {
    responseEncoding: 'utf16le',
  });
  const data = response.data.toString();
  const json = csvToJsonByManufacturer(data.replace(/^\uFEFF/gm, ''));
  res.json(json);
});

app.get('/gitHubDeviceList', async (req, res) => {
  const response = await axios.get(
      `https://raw.githubusercontent.com/gematik/NfcLocalization-Android/master/nfcChipsOutput/nfc_positions.json`,
      { responseEncoding: 'utf-8' },
  );
  const data = response.data;
  res.json(data);
});

module.exports = app;
