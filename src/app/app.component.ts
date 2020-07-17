import { Component, ViewChild, ElementRef } from '@angular/core';
import * as config from './config.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  title = 'map-generator';

  /*
  ********************************************************
                      STRANGE LANDS
  ********************************************************

  "The [insert adjective] [synonym for 'land'] of [name]"

  Examples:
  - "The enchanted kingdom of Duzâ"
  - "The dark realm of Fézöda"
  - "The scorching lands of Led Ödyeânc"

  - mostly water = 'scattered islands', 'nautical'
  - mostly land = 'plains', 'steppes', 'prairies'
  - mostly lava = 'volcanic fields'

  all = 'mystic', 'vast', 'remote', 'hidden', 'secret', 'arcane', 'forgotten'
  forest = 'enchanted', 'lush', 'rich', 'thriving', 'idyllic', 'heavenly', 
  desert = 'scorching', 'lonely', 'barren', 'boiling', 'sweltering', 'dusty'
  snow = 'frozen', 'frigid', 'polar', 'icy', 'snowy', 'glacial'
  hell = 'desolated', 'grim', 'stark', 'noxious', 'dark', 'dreary', 'sunless'

  Synonymns for 'LAND': lands, realm, country, kingdom, nation, empire, territory, commonwealth, republic

  */

  // Configurable Variables
  cityNums;
  landStructureNums;
  font;
  oceanSeeds;
  rate;
  respawnMin;
  cycleNums;
  delayNum;
  waterColor;
  shades = [];
  naturalStructures = [];
  structureSize;
  textColor;
  cityNames = [];
  landSynonyms = [];
  allAdjectives = [];
  adjectives = [];

  // Hardcoded Variable
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D;
  grid = [];
  cells = [];
  terrain = ['forest', 'desert', 'snow', 'hell'];
  length = 5;
  rowLength = 100 // 45
  colLength = 150; // 80
  water = '0';
  land = '1';
  structure = '@';
  cycle = 0;
  disableRandomize = false;
  realmName = '';
  realmTitle = '';
  // allAdjectives = ['mystic', 'vast', 'remote', 'hidden', 'secret', 'arcane', 'forgotten'];

  ngOnInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Get Config data
    this.cityNums = config['default']['cityNums'];
    this.font = config['default']['font'];
    this.oceanSeeds = config['default']['oceanSeeds'];
    this.rate = config['default']['aliveRate'];
    this.respawnMin = config['default']['respawnMin'];
    this.cycleNums = config['default']['cycleNum'];
    this.delayNum = config['default']['delayNum'];
    this.cityNames = config['default']['cityNames'];
    this.landSynonyms = config['default']['landSynonyms'];
    this.allAdjectives = config['default']['allAdjectives'];

    this.randomize();
  }

  async randomize() {
    this.disableRandomize = true;

    // Choose random terrain and get config data
    let randomTerrain = this.terrain[Math.floor(Math.random() * this.terrain.length)];
    this.getConfigData(randomTerrain);

    this.reset();

    this.realmName = this.generateCityName(this.cityNames[Math.floor(Math.random() * this.cityNames.length)]);
    this.realmTitle = this.generateRealmTitle(this.realmName);

    for (let i = 0; i < 4; i++) {
      await this.start();
    }

    for (let k = 0; k < this.landStructureNums; k++) {
      await this.addNaturalFeature();
    }

    for (let j = 0; j < this.cityNums; j++) {
      await this.addCity();
    }

    this.disableRandomize = false;
  }

  getConfigData(terrain: string) {
    this.waterColor = config['default']['terrain'][terrain]['water'];
    this.shades = config['default']['terrain'][terrain]['shades'];
    this.naturalStructures = config['default']['terrain'][terrain]['naturalStructures'];
    this.structureSize = config['default']['terrain'][terrain]['structureSize'];
    this.landStructureNums = config['default']['terrain'][terrain]['numOfStructure'];
    this.textColor = config['default']['terrain'][terrain]['textColor'];
    this.adjectives = config['default']['terrain'][terrain]['adjectives'].concat(this.allAdjectives);
  }

  async start() {
    for (let i = 0; i < this.cycleNums; i++) {
      this.cycle++;
      await this.delay(this.delayNum);
      await this.traverseCells();

      if (i === 0) {
        // this.rate = 2;
        this.respawnMin = 5;
      }
      if (i === 1) {
        // this.rate = 3;
        this.respawnMin = 6;
      }

      this.renderGrid();
    }
  }

  reset() {
    this.cycle = 0;
    this.realmName = '';
    this.realmTitle = '';

    // Initialize grid
    for (let i = 0; i < this.rowLength; i++) {
      this.grid[i] = [];
      this.cells[i] = [];
      for (let j = 0; j < this.colLength; j++) {
        let obj = {
          x: i,
          y: j,
          value: this.land
        }
        this.grid[i][j] = this.land;
        this.cells[i][j] = obj;

        // this.ctx.fillStyle = 'white';

        let forest = ['#00BC00', '#00cc00', '#00DC00'];
        let desert = ['#ffe680', '#ffeb99', '#fff0b3'];
        let snow = ['#ffffff', '#f2f2f2', '#e6e6e6'];
        let mars = ['#ff8000', '#ff8c1a', '#ff9933'];
        let hell = ['#404040', '#4d4d4d', '#595959'];

        this.ctx.fillStyle = this.shades[Math.floor(Math.random() * this.shades.length)];

        this.ctx.clearRect(j * this.length, i * this.length, this.length, this.length)
        this.ctx.fillRect(j * this.length, i * this.length, this.length, this.length);
      }
    }

    this.randomOceans(this.oceanSeeds);

    this.renderGrid();
  }

  renderGrid() {
    for (let i = 0; i < this.rowLength; i++) {
      for (let j = 0; j < this.colLength; j++) {
        this.grid[i][j] = this.cells[i][j].value;

        if (this.cells[i][j].value !== this.land) {
          if (this.cells[i][j].value === this.water) {
            // this.ctx.fillStyle = '#6666ff';
            // this.ctx.fillStyle = '#66c2ff';
            // this.ctx.fillStyle = '#0099ff';

            this.ctx.fillStyle = this.waterColor;

            // this.ctx.fillStyle = '#ff6600';
          }

          this.ctx.clearRect(j * this.length, i * this.length, this.length, this.length);
          this.ctx.fillRect(j * this.length, i * this.length, this.length, this.length);
        }
      }
    }
  }

  traverseCells() {
    for (let l = 0; l < this.rowLength; l++) {
      for (let m = 0; m < this.colLength; m++) {
        let alive = 0;

        // FIND LIVE NEIGHBORS
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {

            // Modified for edge cases
            if ((l + i) !== -1 &&
              (m + j) !== -1 &&
              (l + i) !== this.rowLength &&
              (m + j) !== this.colLength &&
              (this.cells[l + i][m + j].value === this.water)) {
              alive++;
            }
          }
        }

        let randomNum = Math.random();

        if ((alive === this.rate) && randomNum > 0.5) {
          this.updateCell(this.cells[l][m].x, this.cells[l][m].y, this.water);
        }
        else if (alive >= this.respawnMin) {
          this.updateCell(this.cells[l][m].x, this.cells[l][m].y, this.water);
        }
      }
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateCell(x: number, y: number, value: string) {
    let obj = {
      x: x,
      y: y,
      value: value
    };

    this.cells[x][y] = obj;
  }

  addCity() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let citySizes = ['16px'];

    let name = this.generateCityName(this.cityNames[Math.floor(Math.random() * this.cityNames.length)]);
    let randomStructure = '📍';

    if (this.cells[randomRow][randomCol].value === this.land && randomCol <= 85 && randomRow > 10 && this.checkNeighbors(randomRow, randomCol)) {
      this.ctx.fillStyle = this.textColor;
      this.ctx.font = `bold ${citySizes[Math.floor(Math.random() * citySizes.length)]} ${this.font}`;
      this.ctx.textAlign = "start";
      this.ctx.fillText(`${randomStructure}${name}`, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.updateCell(randomRow, randomCol, this.structure);
    }
    else {
      this.addCity();
    }
  }

  addWaterStructure() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let waterStructures = ['🏝'];

    let randomNum = Math.floor(Math.random() * waterStructures.length);
    let randomStructure = waterStructures[randomNum];

    if (this.cells[randomRow][randomCol].value !== this.land) {
      this.ctx.fillStyle = 'black';
      this.ctx.font = "16px Ariel";
      this.ctx.fillText(`${randomStructure}`, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
    }
    else {
      this.addWaterStructure();
    }
  }

  addNaturalFeature() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    // let natural = ['🌵', '🌴']; // for desert
    let natural = ['🌲', '🌳']; // for forest
    // let natural = ['🗻']; // for snow
    // let natural = ['🌋']; // for hell
    // let natural = ['🌸', '🌺', '🌼', '🍄', '🌲', '🌳'];

    let randomStructure = this.naturalStructures[Math.floor(Math.random() * this.naturalStructures.length)];

    if (this.cells[randomRow][randomCol].value === this.land && randomCol <= 145 && randomRow > 5) {
      this.ctx.fillStyle = 'black';
      this.ctx.font = `${this.structureSize} Ariel`;
      this.ctx.fillText(randomStructure, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.updateCell(randomRow, randomCol, this.structure);
    }
    else {
      this.addNaturalFeature();
    }
  }

  generateCityName(city: string) {
    let vowels = ['a', 'e', 'i', 'o', 'u'];
    let specialVowelsA = ['a', 'â'];
    let specialVowelsE = ['e', 'é'];
    let specialVowelsI = ['i', 'î'];
    let specialVowelsO = ['o', 'ö'];
    let specialVowelsU = ['u', 'ü'];
    let consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
    let generatedName = '';
    for (let i of city) {
      if (vowels.includes(i.toLowerCase())) {
        switch (i) {
          case 'a':
            generatedName += specialVowelsA[Math.floor(Math.random() * specialVowelsA.length)];
            break;
          case 'A':
            generatedName += specialVowelsA[Math.floor(Math.random() * specialVowelsA.length)].toUpperCase();
            break;
          case 'e':
            generatedName += specialVowelsE[Math.floor(Math.random() * specialVowelsE.length)];
            break;
          case 'E':
            generatedName += specialVowelsE[Math.floor(Math.random() * specialVowelsE.length)].toUpperCase();
            break;
          case 'i':
            generatedName += specialVowelsI[Math.floor(Math.random() * specialVowelsI.length)];
            break;
          case 'I':
            generatedName += specialVowelsI[Math.floor(Math.random() * specialVowelsI.length)].toUpperCase();
            break;
          case 'o':
            generatedName += specialVowelsO[Math.floor(Math.random() * specialVowelsO.length)];
            break;
          case 'O':
            generatedName += specialVowelsO[Math.floor(Math.random() * specialVowelsO.length)].toUpperCase();
            break;
          case 'u':
            generatedName += specialVowelsU[Math.floor(Math.random() * specialVowelsU.length)];
            break;
          case 'U':
            generatedName += specialVowelsU[Math.floor(Math.random() * specialVowelsU.length)].toUpperCase();
            break;
        }
      }
      else if (consonants.includes(i.toLowerCase())) {
        let randChar = consonants[Math.floor(Math.random() * consonants.length)];
        if (i === i.toUpperCase()) {
          generatedName += randChar.toUpperCase();
        }
        else {
          generatedName += randChar;
        }
      }
      else {
        generatedName += ' ';
      }
    }
    return generatedName;
  }

  generateRealmTitle(realm: string) {
    let adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    let landSyn = this.landSynonyms[Math.floor(Math.random() * this.landSynonyms.length)];

    let result = `The ${adjective} ${landSyn} of "${realm}"`;
    return result;
  }

  checkNeighbors(x: number, y: number) {
    for (let i = -3; i < 10; i++) {
      for (let j = -3; j < 10; j++) {

      }
    }

    return true;
  }

  randomOceans(loops: number) {
    try {
      for (let i = 0; i < loops; i++) {
        let randomX = Math.floor(Math.random() * this.rowLength);
        let randomY = Math.floor(Math.random() * this.colLength);

        if (this.cells[randomX][randomY].value === this.land) {
          this.updateCell(randomX, randomY, this.water);
          this.updateCell(randomX - 1, randomY, this.water);
          this.updateCell(randomX + 1, randomY, this.water);
          this.updateCell(randomX, randomY - 1, this.water);
          this.updateCell(randomX, randomY + 1, this.water);
        }
      }
    }
    catch (ex) {
      this.randomOceans(loops);
    }
  }

  downloadMap() {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    let link = document.createElement('a');
    link.download = "generated_map.png";
    link.href = image;
    link.click();
  }

}
