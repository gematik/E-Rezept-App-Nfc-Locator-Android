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

<template>
  <cv-header aria-label="NFC-Locator-Header">
    <cv-header-name prefix="gematik">NFC-Locator</cv-header-name>

    <template #header-global>
      <cv-header-global-action aria-label="Privacy" @click="openPrivacy">
        <document-security16></document-security16>
      </cv-header-global-action>
    </template>
  </cv-header>
</template>

<script type="module" lang="ts">
import {DocumentSecurity16} from "@carbon/icons-vue";
import {Constants} from '../constants';

export default {
  name: 'NfcLocatorHeader',
  components: {
    DocumentSecurity16,
  },
  data() {
    return {};
  },
  methods: {
    openPrivacy(){
      window.open(Constants.PRIVACY_URL);
    },
  },
};
</script>
