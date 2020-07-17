import { Component, ViewChild, ElementRef } from '@angular/core';

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

  all = 'mystic', 'vast', 'remote', 'hidden', 'secret', 'arcane'
  forest = 'enchanted', 'lush', 'rich', 'thriving', 'idyllic', 'heavenly', 
  desert = 'scorching', 'lonely', 'barren', 'boiling', 'sweltering', 'dusty'
  snow = 'frozen', 'frigid', 'polar', 'icy', 'snowy', 'glacial'
  hell = 'desolated', 'grim', 'stark', 'noxious', 'dark', 'dreary', 'sunless'

  Synonymns for 'LAND': lands, realm, country, kingdom, nation, empire, territory, commonwealth, republic

  */

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D;
  grid = [];
  cells = [];

  length = 5;
  rowLength = 100 // 45
  colLength = 100; // 80
  cityNums = 10;
  font = 'Optima';
  canvasDim = this.rowLength * length;

  // color1 = '🟦';
  // color2 = '🟥';
  // color3 = '🟧';
  // color4 = '🟩';
  water = '0';
  land = '1';
  structure = '@';


  cycle = 0;
  rate = 3;
  respawnMin = 6;
  cycleNums = 100;
  delayNum = 10;

  ngOnInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    // this.canvas.nativeElement.setAttribute('height', '550');
    // this.canvas.nativeElement.setAttribute('width', '550');


    this.reset();

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

    // Initialize grid
    for (let i = 0; i < this.rowLength; i++) {
      this.grid[i] = [];
      this.cells[i] = [];
      for (let j = 0; j < this.colLength; j++) {
        let obj = {
          x: i,
          y: j,
          value: this.water
        }
        this.grid[i][j] = this.water;
        this.cells[i][j] = obj;

        // this.ctx.fillStyle = 'white';

        let forest = ['#00BC00', '#00cc00', '#00DC00'];
        let desert = ['#ffe680', '#ffeb99', '#fff0b3'];
        let snow = ['#ffffff', '#f2f2f2', '#e6e6e6'];
        let mars = ['#ff8000', '#ff8c1a', '#ff9933'];
        let hell = ['#404040', '#4d4d4d', '#595959'];


        // let texture = ['#00cc00', '#00e600', '#00ff00'];
        // this.ctx.fillStyle = '#008000';

        this.ctx.fillStyle = desert[Math.floor(Math.random() * forest.length)];

        this.ctx.clearRect(i * this.length, j * this.length, this.length, this.length)
        this.ctx.fillRect(i * this.length, j * this.length, this.length, this.length);
      }
    }

    // this.randomStartingPoint(); // set cycleNum = 500
    this.randomOceans(); // set cycleNum = 200

    this.renderGrid();
  }

  renderGrid() {
    for (let i = 0; i < this.rowLength; i++) {
      for (let j = 0; j < this.colLength; j++) {
        this.grid[i][j] = this.cells[i][j].value;

        if (this.cells[i][j].value !== this.water) {
          if (this.cells[i][j].value === this.land) {
            // this.ctx.fillStyle = '#6666ff';
            // this.ctx.fillStyle = '#66c2ff';
            // this.ctx.fillStyle = '#0099ff';

            this.ctx.fillStyle = '#33d6ff';

            // this.ctx.fillStyle = '#ff6600';
          }
          // else if (this.cells[i][j].value === this.color2) {
          //   this.ctx.fillStyle = '#ff8080';
          // }
          // else if (this.cells[i][j].value === this.color3) {
          //   this.ctx.fillStyle = '#ffc266';
          //   // this.ctx.fillText('🟠', this.length, this.length);
          // }
          // else if (this.cells[i][j].value === this.color4) {
          //   this.ctx.fillStyle = '#00e600';
          // }

          this.ctx.clearRect(i * this.length, j * this.length, this.length, this.length);
          this.ctx.fillRect(i * this.length, j * this.length, this.length, this.length);
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
              (this.cells[l + i][m + j].value === this.land)) {
              alive++;
            }
          }
        }

        let randomNum = Math.random();

        if ((alive === this.rate) && randomNum > 0.5) {
          this.updateCell(this.cells[l][m].x, this.cells[l][m].y, this.land);
        }
        else if (alive >= this.respawnMin) {
          this.updateCell(this.cells[l][m].x, this.cells[l][m].y, this.land);
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

  addLandStructure() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let citySizes = ['16px'];
    let cityNames = ['Phoenix', 'New York City', 'Los Angeles', 'Malibu', 'Chicago', 'Sedona', 'Flagstaff',
      'San Diego', 'Dallas', 'San Francisco', 'Denver', 'Seattle', 'Philadelphia', 'Houston', 'Fresno',
      'Oakland', 'Pittsburgh', 'Boston', 'Memphis', 'Miami', 'Orlando', 'Boulder', 'Akron', 'San Jose',
      'Portland', 'Tucson', 'New Orleans', 'Detroit', 'Las Vegas', 'Yuma', 'Atlanta', 'Cleveland'];

    let name = this.generateCityName(cityNames[Math.floor(Math.random() * cityNames.length)]);
    let randomStructure = '📍';

    if (this.cells[randomRow][randomCol].value === this.water && randomRow <= 85) {
      this.ctx.fillStyle = 'black';
      this.ctx.font = `bold ${citySizes[Math.floor(Math.random() * citySizes.length)]} ${this.font}`;
      this.ctx.fillText(`${randomStructure}${name}`, (this.cells[randomRow][randomCol].x) * this.length, (this.cells[randomRow][randomCol].y) * this.length);
    }
    else {
      this.addLandStructure();
    }
  }

  addWaterStructure() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let waterStructures = ['🏝'];

    let randomNum = Math.floor(Math.random() * waterStructures.length);
    let randomStructure = waterStructures[randomNum];

    if (this.cells[randomRow][randomCol].value !== this.water) {
      this.ctx.fillStyle = 'black';
      this.ctx.font = "16px Ariel";
      this.ctx.fillText(`${randomStructure}`, (this.cells[randomRow][randomCol].x) * this.length, (this.cells[randomRow][randomCol].y) * this.length);
    }
    else {
      this.addWaterStructure();
    }
  }

  addNaturalFeature() {
    let randomRow = Math.floor(Math.random() * this.rowLength);
    let randomCol = Math.floor(Math.random() * this.colLength);

    let natural = ['🌵', '🌴']; // for desert
    // let natural = ['🌲', '🌳']; // for forest
    // let natural = ['🗻']; // for snow
    // let natural = ['🌋', '']; // for hell
    // let natural = ['🌸', '🌺', '🌼', '🍄', '🌲', '🌳'];

    let randomNum = Math.floor(Math.random() * natural.length);
    let randomStructure = natural[randomNum];

    if (this.cells[randomRow][randomCol].value === this.water) {
      this.ctx.fillStyle = 'black';
      this.ctx.font = '18px Ariel';
      this.ctx.fillText(randomStructure, (this.cells[randomRow][randomCol].x) * this.length, (this.cells[randomRow][randomCol].y) * this.length);
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

  randomOceans() {
    try {
      for (let i = 0; i < 6; i++) {
        let randomX = Math.floor(Math.random() * this.rowLength);
        let randomY = Math.floor(Math.random() * this.colLength);

        if (this.cells[randomX][randomY].value === this.water) {
          this.updateCell(randomX, randomY, this.land);
          this.updateCell(randomX - 1, randomY, this.land);
          this.updateCell(randomX + 1, randomY, this.land);
          this.updateCell(randomX, randomY - 1, this.land);
          this.updateCell(randomX, randomY + 1, this.land);
        }
      }
    }
    catch (ex) {
      this.randomOceans();
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
