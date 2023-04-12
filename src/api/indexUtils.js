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

export function csvToJsonByManufacturer(csvString) {
  const lines = csvString.split('\r\n');
  const output = [];
  const headers = lines[0].split(',');
  let previousManufacturer = initPrevManufacturer(headers[0]);
  let previousModel = initPrevModel(headers[1], headers[3]);
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(',');
    // eslint-disable-next-line no-prototype-builtins
    if (previousManufacturer.hasOwnProperty(headers[0])) {
      // there are items in manufacturer
      if (previousManufacturer[headers[0]] === currentLine[0]) {
        // manufacturer is the same
        if (previousModel[headers[1]] === currentLine[1]) {
          // marketingname is the same
          previousModel[headers[3]].push(currentLine[3]);
        } else {
          // other marketingname
          previousManufacturer.Models.push(previousModel);
          previousModel = initPrevModel(headers[1], headers[3]);
          previousModel[headers[1]] = currentLine[1];
          previousModel[headers[3]].push(currentLine[3]);
        }
      } else {
        // other manufacturer
        previousManufacturer.Models.push(previousModel);
        output.push(previousManufacturer);
        previousManufacturer = initPrevManufacturer(headers[0]);
        previousModel = initPrevModel(headers[1], headers[3]);
        previousManufacturer[headers[0]] = currentLine[0];
        previousModel[headers[1]] = currentLine[1];
        previousModel[headers[3]].push(currentLine[3]);
      }
    } else {
      // first iteration
      previousManufacturer[headers[0]] = currentLine[0];
      previousModel[headers[1]] = currentLine[1];
      previousModel[headers[3]].push(currentLine[3]);
    }
  }
  previousManufacturer.Models.push(previousModel);
  output.push(previousManufacturer);
  return output;
}

function initPrevManufacturer(brand) {
  const prevManu = {};
  prevManu[brand] = '';
  prevManu.Models = [];
  return prevManu;
}

function initPrevModel(marketing, model) {
  const prevModel = {};
  prevModel[marketing] = '';
  prevModel[model] = [];
  return prevModel;
}
