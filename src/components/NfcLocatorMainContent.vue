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
  <div class="bx--grid bx--grid--full-width">
    <div class="bx--row">
      <div class="bx--col-lg-2 bx--col-md-2"></div>
      <div id="drawColumn" class="bx--col-lg-5 bx--col-md-5">
        <div class="phone-container" @mousedown="startDrawing" @mousemove="continueDrawing"
             @mouseup="stopDrawing">
          <img id="img" src="../assets/Phone.svg" alt=""/>
          <div
              v-show="dataBaseMarking.show"
              id="dataBaseMarking"
              class="dataBaseBox"
              :style="{
              left: dataBaseMarking.pos.x0 * img.width + 'px',
              top: dataBaseMarking.pos.y0 * img.height + 'px',
              width: dataBaseMarking.pos.width * img.width + 'px',
              height: dataBaseMarking.pos.height * img.height + 'px',
            }"
          >
            <p>Existing Entry</p>
          </div>
          <div
              class="phone-layer"
              :style="{ cursor: mouse.drawEnabled ? 'crosshair' : 'default' }"
              @mousedown="startDrawing"
              @mouseup="stopDrawing"
          >
            <div
                v-show="marking.showMarking"
                id="marking"
                class="markingBox"
                :style="{
                left: marking.pos.x0 + 'px',
                top: marking.pos.y0 + 'px',
                width: marking.pos.width + 'px',
                height: marking.pos.height + 'px',
              }"
            >
              <cv-button
                  v-show="marking.showRemoveMarking"
                  style="float: right"
                  kind="ghost"
                  :icon="Close16"
                  @click="onClickRemoveMarking"
              >Löschen</cv-button
              >
            </div>
          </div>
        </div>
      </div>
      <div class="bx--col-lg-2 bx--col-md-2"></div>
      <div class="bx--col-lg-5 bx--col-md-5">
        <cv-column class="column-padding-large">
          <h1 class="h1-text-style">NFC-Position hinzufügen</h1>
          <body class="body-text-style top-padding-medium">
          Mit dem NFC-Locator kannst Du die Position von NFC-Antennen in Androidgeräten in der Open-Source Lib der
          gematik manuell eintragen. Diese Informationen helfen Nutzer:innen, die sich mit einer NFC-Karte an einem
          Smartphone authentifizieren wollen.
          <br />
          <br />
          gematik übernimmt keine Haftung für die Richtigkeit der Angaben.
          </body>
          <cv-button
              style="float: right"
              class="top-padding-medium"
              kind="ghost"
              :icon="LogoGithub16"
              @click="onClickGoToGitHub"
          >Zum Projekt</cv-button
          >
        </cv-column>

        <cv-column class="column-padding-large">
          <cv-tag label="Schritt-1"></cv-tag>
          <h2 class="h2-text-style top-padding-small">Gerät wählen</h2>
          <v-select
              v-model="nfcPosData.manufacturer"
              class="top-padding-medium"
              :options="googleResponse"
              :reduce="(option) => option['Retail Branding']"
              label="Retail Branding"
              @input="findOptionsForList"
          >
            <template #header>
              <p class="header-text-style">Hersteller</p>
            </template>
            <template #open-indicator="">
              <span></span>
            </template>
            <template #no-options> Bitte warten Sie einen Moment, bis die Liste geladen wurde. </template>
          </v-select>
          <v-select
              v-model="marketingName.chosen"
              class="top-padding-medium"
              :clearable="false"
              :options="marketingName.options"
              label="Marketing Name"
              @input="setModelData"
          >
            <template #header>
              <p class="header-text-style">Modell</p>
            </template>
            <template #open-indicator="">
              <span></span>
            </template>
            <template #no-options> Bitte füllen Sie "Hersteller" zuerst aus. </template>
          </v-select>
        </cv-column>

        <cv-column class="column-padding-large">
          <cv-tag label="Schritt-2"></cv-tag>
          <h2 class="h2-text-style top-padding-small">Position markieren</h2>
          <div class="top-padding-medium"></div>
          <cv-button
              kind="tertiary"
              :icon="WatsonHealthContourDraw16"
              :disabled="marking.pos.width !== 0 || marking.pos.height !== 0"
              @click="onClickDraw"
          >Zeichnen</cv-button
          >
        </cv-column>

        <cv-column>
          <cv-button
              style="float: right"
              kind="primary"
              :icon="Save16"
              :disabled="
              nfcPosData.manufacturer === '' ||
              nfcPosData.marketingName === '' ||
              (marking.pos.width === 0 && marking.pos.height === 0)
            "
              @click="onClickSave"
          >Speichern</cv-button
          >
        </cv-column>
      </div>
      <div class="bx--col-lg-2 bx--col-md-2">
        <Transition name="slide-fade">
          <cv-inline-notification
              v-if="notification.show"
              style="float: right"
              :kind="notification.kind"
              :title="notification.title"
              :sub-title="notification.subTitle"
              :hide-close-button="false"
              :low-contrast="true"
              @close="notification.show = false"
          ></cv-inline-notification>
        </Transition>
      </div>
    </div>
    <div class="bx--row">
      <div class="bx--col top-padding-medium">
        <img src="../assets/logoGematik.svg" alt="" />
      </div>
    </div>
  </div>
</template>

<script>
import {Close16, LogoGithub16, Save16, WatsonHealthContourDraw16} from '@carbon/icons-vue';
import {Constants} from '../constants';

export default {
  name: 'NfcLocatorMainContent',
  components: {
    Close16,
    LogoGithub16,
    Save16,
    WatsonHealthContourDraw16,
  },
  data() {
    return {
      Close16,
      LogoGithub16,
      Save16,
      WatsonHealthContourDraw16,
      img: {
        width: 0,
        height: 0,
      },
      mouse: {
        currentPos: {
          x: 0,
          y: 0,
        },
        startPos: {
          x: 0,
          y: 0,
        },
        drawEnabled: false,
        isDrawing: false,
      },
      marking: {
        showMarking: false,
        showRemoveMarking: false,
        pos: {
          x0: 0,
          y0: 0,
          width: 0,
          height: 0,
        },
      },
      nfcPosData: {
        manufacturer: '',
        marketingName: '',
        modelNames: [],
        nfcPos: {
          x0: 0,
          y0: 0,
          x1: 0,
          y1: 0,
        },
      },
      dataBaseMarking: {
        show: false,
        pos: {
          x0: 0,
          y0: 0,
          width: 0,
          height: 0,
        },
      },
      notification: {
        title: '',
        subTitle: '',
        kind: '',
        show: false,
      },
      googleResponse: [],
      gitHubResponse: [],
      marketingName: {
        options: [],
        chosen: [],
      },
    };
  },
  created() {
    // save the warning for the action we do in the save-auth-status file
    if (typeof window !== 'undefined' && this.$route.query.isSuccess) {
      this.showNotification(JSON.parse(this.$route.query.isSuccess));
    }
  },
  mounted() {
    this.getAuthState();
    this.getGoogleDeviceList();
    this.getGitHubDeviceList();
  },
  methods: {
    // Draw
    startDrawing(event) {
      if (this.mouse.drawEnabled) {
        this.mouse.isDrawing = true;
        this.mouse.currentPos = {
          x: event.offsetX,
          y: event.offsetY,
        };
        this.marking.pos.x0 = this.mouse.currentPos.x;
        this.marking.pos.y0 = this.mouse.currentPos.y;
        this.marking.showMarking = true;
      }
    },
    stopDrawing() {
      if (this.mouse.drawEnabled) {
        this.checkNfcPositions();
        this.getNfcPos();
        this.mouse.isDrawing = false;
        this.marking.showRemoveMarking = true;
        this.mouse.drawEnabled = false;
      }
    },
    continueDrawing(event) {
      if (this.mouse.drawEnabled) {
        this.mouse.currentPos = {
          x: event.offsetX,
          y: event.offsetY,
        };
        if (this.mouse.isDrawing) {
          this.marking.pos.width = this.mouse.currentPos.x - this.marking.pos.x0;
          this.marking.pos.height = this.mouse.currentPos.y - this.marking.pos.y0;
        }
      }
    },
    getImgSize() {
      const img = document.getElementById('img');
      const rect = img.getBoundingClientRect();
      this.img = {
        width: rect.width,
        height: rect.height,
      };
    },
    getNfcPos() {
      this.getImgSize();
      this.nfcPosData.nfcPos = {
        x0: this.normalize(1 - (this.marking.pos.x0 + this.marking.pos.width) / this.img.width),
        y0: this.normalize(this.marking.pos.y0 / this.img.height),
        x1: this.normalize(1 - this.marking.pos.x0 / this.img.width),
        y1: this.normalize((this.marking.pos.y0 + this.marking.pos.height) / this.img.height),
      };
    },
    normalize(x) {
      if (x > 1) return 1;
      if (x < 0) return 0;
      return x;
    },
    checkNfcPositions() {
      if (this.marking.pos.width < 0) {
        const x0 = this.marking.pos.x0;
        const width = this.marking.pos.width;
        this.marking.pos.x0 = x0 + width;
        this.marking.pos.width = -width;
      }
      if (this.marking.pos.height < 0) {
        const y0 = this.marking.pos.y0;
        const height = this.marking.pos.height;
        this.marking.pos.y0 = y0 + height;
        this.marking.pos.height = -height;
      }
    },
    checkForDataBaseEntry() {
      let foundMatch = false;
      this.gitHubResponse.find((entry) => {
        if (
            entry.manufacturer.toUpperCase() === this.nfcPosData.manufacturer.toUpperCase() &&
            entry.modelNames.some( model => this.nfcPosData.modelNames.includes(model))
        ) {
          this.getImgSize();
          const x0 = 1 - entry.nfcPos.x1;
          const y0 = entry.nfcPos.y0;
          const width = entry.nfcPos.x1 - entry.nfcPos.x0;
          const height = entry.nfcPos.y1 - entry.nfcPos.y0;
          this.dataBaseMarking.pos = {
            x0,
            y0,
            width,
            height,
          };
          foundMatch = true;
          return true;
        } else {
          return false;
        }
      });
      this.dataBaseMarking.show = foundMatch;
    },
    // Button functions
    onClickGoToGitHub() {
      window.open(Constants.PROJECT_URL);
    },
    onClickDraw() {
      this.mouse.drawEnabled = true;
    },
    onClickRemoveMarking() {
      this.marking.pos = {
        x0: 0,
        y0: 0,
        width: 0,
        height: 0,
      };
      this.nfcPosData.nfcPos = {
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 0,
      };
      this.marking.showMarking = false;
      this.marking.showRemoveMarking = false;
    },
    async getGoogleDeviceList() {
      try {
        this.googleResponse = await this.$store.dispatch(Constants.GET_GOOGLE_DEVICE_LIST_TYPE);
      } catch (e) {
        console.log(e);
      }
    },
    async getGitHubDeviceList() {
      try {
        this.gitHubResponse = await this.$store.dispatch(Constants.GET_GITHUB_DEVICE_LIST_TYPE);
      } catch (e) {
        console.log(e);
      }
    },
    async getAuthState() {
      try {
        const res = await this.$store.dispatch(Constants.GET_AUTH_STATE_TYPE);
        if (!res) {
          localStorage.removeItem(Constants.AUTH_STATUS_KEY);
        }
        console.log(res);
      } catch (e) {
        console.log(e);
      }
    },
    // List functions
    findOptionsForList() {
      this.resetChosenOptions();
      const searchObj = this.googleResponse.find((obj) => obj['Retail Branding'] === this.nfcPosData.manufacturer);
      this.marketingName.options = searchObj?.Models ?? [];
    },
    resetChosenOptions() {
      this.marketingName.chosen = '';
      this.dataBaseMarking.show = false;
      this.nfcPosData.marketingName = '';
      this.nfcPosData.modelNames = [];
    },
    // Save functions
    setModelData() {
      this.nfcPosData.marketingName = this.marketingName.chosen?.['Marketing Name'] ?? '';
      this.nfcPosData.modelNames = this.marketingName.chosen?.Model ?? [];
      this.checkForDataBaseEntry();
    },
    showNotification(isSuccess) {
      if (isSuccess) {
        this.notification = {
          show: true,
          title: 'NFC-Position hinzugefügt',
          subTitle: 'Vielen Dank für Ihren Beitrag!',
          kind: 'success',
        };
      } else {
        this.notification = {
          show: true,
          title: 'NFC-Position nicht hinzugefügt',
          subTitle: 'Es ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu und versuchen es dann noch einmal.',
          kind: 'error',
        };
      }

      setTimeout(() => {
        this.notification.show = false;
      }, 5000);

      this.$router.push('/');
    },
    async onClickSave() {
      // session speichert daten - mit parameter auth true false
      if (!localStorage.getItem(Constants.AUTH_STATUS_KEY)) {
        localStorage.setItem(Constants.SAVED_PHONE_DATA_KEY, JSON.stringify(this.nfcPosData));
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.gitHubAppClientID}`;
        return;
      }
      try {
        await this.$store.dispatch('savePhoneData', this.nfcPosData);
        this.showNotification(true);
      } catch (e) {
        this.showNotification(false);
      }
    },
  },
};
</script>

<style lang="scss">
@import '../styles/carbon-utils';

.top-padding-medium {
  padding-top: $spacing-05;
}

.top-padding-small {
  padding-top: $spacing-03;
}

.column-padding-large {
  padding-bottom: $spacing-10;
}

.h1-text-style {
  font-family: 'IBM Plex Sans', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 36px;
  line-height: 54px;
}

.h2-text-style {
  font-family: 'IBM Plex Sans', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 24px;
  line-height: 36px;
}

.body-text-style {
  font-family: 'IBM Plex Sans', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0.16px;
}

.header-text-style {
  font-family: 'IBM Plex Sans', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.32px;
}

.markingBox {
  box-sizing: border-box;
  position: absolute;
  border: 8px solid #bae6ff;
  border-radius: 16px;
  background: rgba(134, 158, 248, 0.1);
}

.dataBaseBox {
  box-sizing: border-box;
  position: absolute;
  border: 8px solid #fcf4d6;
  border-radius: 16px;
  background: rgba(255, 255, 224, 0.1);
}

.phone-container {
  position: relative;
  width: min-content;

  .phone-layer {
    position: absolute;
    inset: 0;
  }
}

.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.5s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
