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

export const Constants = {
  AUTH_STATUS_KEY: 'auth-status',
  SAVED_PHONE_DATA_KEY: 'saved-phone-data',
  GET_GITHUB_DEVICE_LIST_TYPE: 'getGitHubDeviceList',
  GET_GOOGLE_DEVICE_LIST_TYPE: 'getGoogleDeviceList',
  GET_AUTH_STATE_TYPE: 'getAuthState',
  REPO_OWNER: 'TillPlewe',
  REPO_NAME: 'test',
  PATH_TO_FILE: 'nfc_pos.json',
  PROJECT_URL: 'https://github.com/gematik/NfcLocalization-Android',
  PRIVACY_URL: 'https://www.gematik.de/datenschutz',
} as const;
