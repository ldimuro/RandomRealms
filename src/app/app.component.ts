import { Component, ViewChild, ElementRef } from '@angular/core';
import * as config from './config.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  title = 'map-generator';

  // Configurable Variables
  cityNums;
  font;
  oceanSeeds;
  rate;
  respawnMin;
  cycleNums;
  delayNum;
  waterColor;
  shades = [];
  naturalStructures = [];
  landCreatures = [];
  oceanCreatures = [];
  structureSize;
  landCreatureSize;
  landStructureNums;
  landCreaturesNums;
  oceanCreaturesNums;
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
  city = '#';
  cycle = 0;
  disableRandomize = false;
  realmName = '';
  realmTitle = '';

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

  getConfigData(terrain: string) {
    this.waterColor = config['default']['terrain'][terrain]['water'];
    this.shades = config['default']['terrain'][terrain]['shades'];
    this.naturalStructures = config['default']['terrain'][terrain]['naturalStructures'];
    this.structureSize = config['default']['terrain'][terrain]['structureSize'];
    this.landStructureNums = config['default']['terrain'][terrain]['numOfStructure'];
    this.landCreatures = config['default']['terrain'][terrain]['landCreatures'];
    this.oceanCreatures = config['default']['terrain'][terrain]['oceanCreatures'];
    this.landCreaturesNums = config['default']['terrain'][terrain]['numOfLandCreatures'];
    this.oceanCreaturesNums = config['default']['terrain'][terrain]['numOfOceanCreatures'];
    this.textColor = config['default']['terrain'][terrain]['textColor'];
    this.adjectives = config['default']['terrain'][terrain]['adjectives'].concat(this.allAdjectives);
    this.landCreatureSize = config['default']['terrain'][terrain]['landCreatureSize'];
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

    for (let l = 0; l < this.landCreaturesNums; l++) {
      await this.addLandCreatures();
    }

    for (let m = 0; m < this.oceanCreaturesNums; m++) {
      await this.addOceanCreatures();
    }

    for (let j = 0; j < this.cityNums; j++) {
      await this.addCity();
    }

    this.disableRandomize = false;

    let str = ''
    for (let x = 0; x < this.rowLength; x++) {
      for (let y = 0; y < this.colLength; y++) {
        str += this.grid[x][y];
      }
      str += '\n';
    }
    console.log(str);
  }

  async start() {
    for (let i = 0; i < this.cycleNums; i++) {
      this.cycle++;
      await this.delay(this.delayNum);
      await this.traverseCells();

      if (i === 0) {
        this.respawnMin = 5;
      }
      if (i === 1) {
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
            this.ctx.fillStyle = this.waterColor;
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
          this.grid[l][m] = this.water;
        }
        else if (alive >= this.respawnMin) {
          this.updateCell(this.cells[l][m].x, this.cells[l][m].y, this.water);
          this.grid[l][m] = this.water;
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

    let citySizes = ['13px', '16px', '20px'];

    let name = this.generateCityName(this.cityNames[Math.floor(Math.random() * this.cityNames.length)]);
    let randomStructure = '📍';

    if (this.cells[randomRow][randomCol].value === this.land && randomCol <= 85 && randomRow > 10 && this.checkNeighbors(randomRow, randomCol)) {
      this.ctx.fillStyle = this.textColor;
      this.ctx.font = `bold ${citySizes[Math.floor(Math.random() * citySizes.length)]} ${this.font}`;
      this.ctx.textAlign = "start";
      this.ctx.fillText(`${randomStructure}${name}`, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.grid[randomRow][randomCol] = this.city;
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
      this.ctx.font = "16px Ariel";
      this.ctx.fillText(`${randomStructure}`, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.grid[randomRow][randomCol] = this.structure;
      this.updateCell(randomRow, randomCol, randomStructure);
    }
    else {
      this.addWaterStructure();
    }
  }

  addNaturalFeature() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let randomStructure = this.naturalStructures[Math.floor(Math.random() * this.naturalStructures.length)];

    if (this.cells[randomRow][randomCol].value === this.land && randomCol <= 145 && randomRow > 5) {
      this.ctx.font = `${this.structureSize} Ariel`;
      this.ctx.fillText(randomStructure, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.updateCell(randomRow, randomCol, randomStructure);
      this.grid[randomRow][randomCol] = this.structure;
    }
    else {
      this.addNaturalFeature();
    }
  }

  addLandCreatures() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let randomStructure = this.landCreatures[Math.floor(Math.random() * this.landCreatures.length)];

    if (this.cells[randomRow][randomCol].value === this.land && randomCol <= 145 && randomRow > 5) {
      this.ctx.font = `${this.landCreatureSize} Ariel`;
      this.ctx.fillText(randomStructure, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.updateCell(randomRow, randomCol, randomStructure);
      this.grid[randomRow][randomCol] = this.structure;
    }
    else {
      this.addLandCreatures();
    }
  }

  addOceanCreatures() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let randomStructure = this.oceanCreatures[Math.floor(Math.random() * this.oceanCreatures.length)];

    if (this.cells[randomRow][randomCol].value === this.water && randomCol <= 145 && randomRow > 5 && this.landCreaturesNums > 0) {
      this.ctx.font = `${this.landCreatureSize} Ariel`;
      this.ctx.fillText(randomStructure, (this.cells[randomRow][randomCol].y) * this.length, (this.cells[randomRow][randomCol].x) * this.length);
      this.updateCell(randomRow, randomCol, randomStructure);
      this.grid[randomRow][randomCol] = this.structure;
    }
    else {
      this.addOceanCreatures();
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
        switch (i.toLowerCase()) {
          case 'a':
            let randA = specialVowelsA[Math.floor(Math.random() * specialVowelsA.length)];
            if (i === i.toUpperCase()) {
              randA = randA.toUpperCase()
            }
            generatedName += randA;
            break;
          case 'e':
            let randE = specialVowelsE[Math.floor(Math.random() * specialVowelsE.length)];
            if (i === i.toUpperCase()) {
              randE = randE.toUpperCase()
            }
            generatedName += randE;
            break;
          case 'i':
            let randI = specialVowelsI[Math.floor(Math.random() * specialVowelsI.length)];
            if (i === i.toUpperCase()) {
              randI = randI.toUpperCase()
            }
            generatedName += randI;
            break;
          case 'o':
            let randO = specialVowelsO[Math.floor(Math.random() * specialVowelsO.length)];
            if (i === i.toUpperCase()) {
              randO = randO.toUpperCase()
            }
            generatedName += randO;
            break;
          case 'u':
            let randU = specialVowelsU[Math.floor(Math.random() * specialVowelsU.length)];
            if (i === i.toUpperCase()) {
              randU = randU.toUpperCase()
            }
            generatedName += randU;
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
    link.download = `${this.realmName.toLowerCase()}.png`;
    link.href = image;
    link.click();
  }

}
