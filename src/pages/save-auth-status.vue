<!--
  - Copyright 2016, European Community
  - Copyright 2023, gematik GmbH
  -
  - Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
  - European Commission – subsequent versions of the EUPL (the "Licence").
  - You may not use this work except in compliance with the Licence.
  -
  - You find a copy of the Licence in the "Licence" file or at
  - https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
  -
  - Unless required by applicable law or agreed to in writing,
  - software distributed under the Licence is distributed on an "AS IS" basis,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
  - In case of changes by gematik find details in the "Readme" file.
  -
  - See the Licence for the specific language governing permissions and limitations under the Licence.
  -->

<template></template>

<script>
import {Constants} from '../constants';

export default {
  name: 'SaveAuthStatus',
  async created() {
    // to refuse work during ssr, make window object check. This scope only works in frontend.
    if (typeof window !== 'undefined') {
      try {
        // refuse going to GitHub again for the incoming save requests
        localStorage.setItem(Constants.AUTH_STATUS_KEY, '1');

        // before we go to GitHub (for the token), we saved the phone data to storage, we read&save them here.
        const savedPhoneData = localStorage.getItem(Constants.SAVED_PHONE_DATA_KEY);
        const parsedSavedPhoneData = JSON.parse(savedPhoneData);
        await this.$store.dispatch('savePhoneData', parsedSavedPhoneData);

        // remove previously added phone data
        localStorage.removeItem(Constants.SAVED_PHONE_DATA_KEY);

        this.$router.push('/?isSuccess=true');
      } catch (e) {
        this.$router.push('/?isSuccess=false');
      }
    }
  },
};
</script>
