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

import {ActionTree} from 'vuex/types';
import axios from 'axios';

export const state = () => ({});

export type IRootState = ReturnType<typeof state>;

// export const mutations: MutationTree<IRootState> = {};

export const actions: ActionTree<IRootState, IRootState> = {
  async getGoogleDeviceList() {
    try {
      const res = await axios.get('/intern-api/googleDeviceList', { responseType: 'json' });
      return res.data;
    } catch (e) {
      console.log(e);
    }
  },
  async getGitHubDeviceList() {
    try {
      const res = await axios.get('/intern-api/gitHubDeviceList', { responseType: 'json' });
      return res.data;
    } catch (e) {
      console.log(e);
    }
  },
  async getAuthState() {
    try {
      const res = await axios.get('/github/auth-state', { responseType: 'json' });
      return res.data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  async savePhoneData(_, phoneData) {
    try {
      const res = await axios.post('/github/save-phone-data', phoneData);
      return res.data;
    } catch (e) {
      console.log('An Error occurred while saving the Data:' + e);
      throw e;
    }
  },
};
