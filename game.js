/*********************************************************
 * UNO MATCHO — FINAL STABLE GAME.JS
 *********************************************************/

/******************** SETTINGS ***************************/
const DEFAULT_SETTINGS = {
  inputMethod: 'leftClick',
  clickAnywhere: true,
  scanSpeed: 'medium',     // fast | medium | slow
  scanTime: 2000,
  soundEnabled: true,
  animationsEnabled: true,
  repeatTargetUntilCorrect: true,
  trainingMode: false,
  highContrast: true,
  autoFullscreen: true,
  debugMode: false,
  scoreGoal: 5
};

const SETTINGS_KEY = 'jop-neung-ku-settings';

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved
    ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    : { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyScanSpeed(settings) {
  if (settings.scanSpeed === 'fast') settings.scanTime = 1000;
  else if (settings.scanSpeed === 'slow') settings.scanTime = 3000;
  else settings.scanTime = 2000;
}

function tryFullscreen() {
  if (this.settings.autoFullscreen && !this.scale.isFullscreen) {
    this.scale.startFullscreen();
  }
}

/******************** CONSTANTS **************************/
const CONFIG = { width: 1280, height: 800 };
const CARD_WIDTH = 240;
const CARD_HEIGHT = 360;
const ACTIVE_CARD_SCALE = 1.25;
const TRAY_CARD_SCALE = .75;
const GOAL_VALUES = [1, 5, 10, 15, 20];

/******************** CARD DEFINITIONS *******************/
const COLORS = ['red', 'blue', 'yellow', 'green'];
const VALUES = ['0','1','2','3','4','5','6','7','8','9','skip','reverse','draw2'];

// const CARD_MAP = [];
// COLORS.forEach((color, row) => {
//   VALUES.forEach((value, col) => {
//     CARD_MAP.push({
//       id: `${color}-${value}`,
//       frame: row * VALUES.length + col
//     });
//   });
// });
const CARD_MAP = [
  // RED
  { id: 'red-0', frame: 0 },
  { id: 'red-1', frame: 1 },
  { id: 'red-2', frame: 2 },
  { id: 'red-3', frame: 3 },
  { id: 'red-4', frame: 4 },
  { id: 'red-5', frame: 5 },
  { id: 'red-6', frame: 6 },
  { id: 'red-7', frame: 7 },
  { id: 'red-8', frame: 8 },
  { id: 'red-9', frame: 9 },
  { id: 'red-skip', frame: 10 },
  { id: 'red-reverse', frame: 11 },
  { id: 'red-draw2', frame: 12 },

  // BLUE
  { id: 'blue-0', frame: 13 },
  { id: 'blue-1', frame: 14 },
  { id: 'blue-2', frame: 15 },
  { id: 'blue-3', frame: 16 },
  { id: 'blue-4', frame: 17 },
  { id: 'blue-5', frame: 18 },
  { id: 'blue-6', frame: 19 },
  { id: 'blue-7', frame: 20 },
  { id: 'blue-8', frame: 21 },
  { id: 'blue-9', frame: 22 },
  { id: 'blue-skip', frame: 23 },
  { id: 'blue-reverse', frame: 24 },
  { id: 'blue-draw2', frame: 25 },

  // YELLOW
  { id: 'yellow-0', frame: 26 },
  { id: 'yellow-1', frame: 27 },
  { id: 'yellow-2', frame: 28 },
  { id: 'yellow-3', frame: 29 },
  { id: 'yellow-4', frame: 30 },
  { id: 'yellow-5', frame: 31 },
  { id: 'yellow-6', frame: 32 },
  { id: 'yellow-7', frame: 33 },
  { id: 'yellow-8', frame: 34 },
  { id: 'yellow-9', frame: 35 },
  { id: 'yellow-skip', frame: 36 },
  { id: 'yellow-reverse', frame: 37 },
  { id: 'yellow-draw2', frame: 38 },

  // GREEN
  { id: 'green-0', frame: 39 },
  { id: 'green-1', frame: 40 },
  { id: 'green-2', frame: 41 },
  { id: 'green-3', frame: 42 },
  { id: 'green-4', frame: 43 },
  { id: 'green-5', frame: 44 },
  { id: 'green-6', frame: 45 },
  { id: 'green-7', frame: 46 },
  { id: 'green-8', frame: 47 },
  { id: 'green-9', frame: 48 },
  { id: 'green-skip', frame: 49 },
  { id: 'green-reverse', frame: 50 },
  { id: 'green-draw2', frame: 51 },
];

/******************** GAME SCENE *************************/
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  preload() {
    this.load.spritesheet('deck', 'assets/deck2.png', {
      frameWidth: CARD_WIDTH,
      frameHeight: CARD_HEIGHT
    });
    this.load.audio('scan', 'assets/scan.wav');
    this.load.audio('success', 'assets/success.wav');
    this.load.audio('failure', 'assets/tryagain.wav');
    this.load.audio('victory', 'assets/victory.wav');
  }

  create() {
    this.settings = loadSettings();
    applyScanSpeed(this.settings);

    this.score = 0;
    this.scanningIndex = 0;
    this.isLocked = false;
    this.scanTimer = null;

    this.scanSound = this.sound.add('scan', { volume: 0.4 });
    this.successSound = this.sound.add('success', { volume: 0.7 });
    this.failureSound = this.sound.add('failure', { volume: 0.4 });
    this.victorySound = this.sound.add('victory', { volume: 0.7 });

    this.add.rectangle(0, 0, CONFIG.width, CONFIG.height, 0x000000).setOrigin(0);

    this.scoreText = this.add.text(30, 30, 'Score: 0', {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#ffffff'
    });

    this.feedbackText = this.add.text(
      CONFIG.width / 2, CONFIG.height / 2 - 140, '',
      {
        fontSize: '72px',
        fontFamily: 'Arial Black',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10
      }
    ).setOrigin(0.5).setDepth(99);

    /* Active card */
    this.activeCardSprite = this.add.sprite(
      CONFIG.width / 2, 220, 'deck'
    ).setDisplaySize(
      CARD_WIDTH * ACTIVE_CARD_SCALE,
      CARD_HEIGHT * ACTIVE_CARD_SCALE
    );

    this.activeCardDebugText = this.add.text(
      this.activeCardSprite.x,
      this.activeCardSprite.y + (CARD_HEIGHT * ACTIVE_CARD_SCALE) / 2 + 12,
      '',
      { fontSize: '22px', fontFamily: 'Arial Black', color: '#ffff00' }
    ).setOrigin(0.5);

    this.activePulse = this.tweens.add({
      targets: this.activeCardSprite,
      scale: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    this.trayPositions = [
      CONFIG.width * 0.25,
      CONFIG.width * 0.5,
      CONFIG.width * 0.75
    ];

    this.tray = [];
    this.trayDebugText = [];
    this.scanBox = this.add.graphics();

    this.createSettingsButton();
    this.setupInput();
    this.setupHiddenSettingsAccess();
    this.startRound();
  }

  /******************** SCANNING CONTROL *****************/
  stopScanning() {
    if (this.scanTimer) {
      this.scanTimer.remove();
      this.scanTimer = null;
    }
  }

  startScanning() {
    this.stopScanning();

    this.drawScanBox(0xff3333);
    this.updateScanBox();

    this.scanTimer = this.time.addEvent({
      delay: this.settings.scanTime,
      loop: true,
      callback: () => {
        this.scanningIndex = (this.scanningIndex + 1) % this.tray.length;
        this.updateScanBox();
        if (this.settings.soundEnabled) this.scanSound.play();
      }
    });
  }

  drawScanBox(color) {
    this.scanBox.clear();
    this.scanBox.lineStyle(6, color);
    this.scanBox.strokeRoundedRect(
      0, 0,
      (CARD_WIDTH + 24) * TRAY_CARD_SCALE,
      (CARD_HEIGHT + 24) * TRAY_CARD_SCALE,
      18
    );
  }

  updateScanBox() {
    const t = this.tray[this.scanningIndex];
    this.scanBox.setPosition(
      t.x - ((CARD_WIDTH + 24) * TRAY_CARD_SCALE) / 2,
      t.y - ((CARD_HEIGHT + 24) * TRAY_CARD_SCALE) / 2
    );
  }

  /******************** ROUND ****************************/
  startRound() {
    this.stopScanning();
    this.feedbackText.setText('');
    this.isLocked = false;
    this.scanningIndex = 0;

    this.activeCard = Phaser.Utils.Array.GetRandom(CARD_MAP);
    this.activeCardSprite.setFrame(this.activeCard.frame);
    this.activeCardDebugText.setText(
      this.settings.debugMode ? this.activeCard.id : ''
    );

    const decoys = Phaser.Utils.Array.Shuffle(
      CARD_MAP.filter(c => c.id !== this.activeCard.id)
    );

    this.optionSet = Phaser.Utils.Array.Shuffle([
      this.activeCard,
      decoys[0],
      decoys[1]
    ]);

    this.tray.forEach(s => s.destroy());
    this.trayDebugText.forEach(t => t.destroy());
    this.tray = [];
    this.trayDebugText = [];

    this.optionSet.forEach((card, i) => {
      const s = this.add.sprite(
        this.trayPositions[i], 620, 'deck', card.frame
      ).setDisplaySize(CARD_WIDTH * TRAY_CARD_SCALE, CARD_HEIGHT * TRAY_CARD_SCALE);

      const t = this.add.text(
        s.x, s.y + (CARD_HEIGHT * TRAY_CARD_SCALE) / 2 + 10,
        this.settings.debugMode ? card.id : '',
        { fontSize: '20px', fontFamily: 'Arial Black', color: '#ffff00' }
      ).setOrigin(0.5);

      this.tray.push(s);
      this.trayDebugText.push(t);
    });

    this.startScanning();
  }
  

  /******************** INPUT ****************************/
  setupInput() {
    this.input.on('pointerdown', () => {
      if (!this.isLocked) this.selectCurrentCard();
        if (this.inVictory) {
            if (this.canReset) this.resetGame();
            return;
        }
    });
  }

  selectCurrentCard() {
    this.isLocked = true;
    this.stopScanning();
    this.activePulse.pause();

    const selected = this.optionSet[this.scanningIndex];
    const sprite = this.tray[this.scanningIndex];

    if (selected.id === this.activeCard.id) this.handleSuccess();
    else this.handleFailure(sprite);
  }

  handleFailure(sprite) {
    this.feedbackText.setColor('#ff3333');
    this.feedbackText.setText('TRY AGAIN');
    if (this.settings.soundEnabled) this.failureSound.play();

    this.tweens.add({
      targets: sprite,
      x: sprite.x + 12,
      duration: 60,
      yoyo: true,
      repeat: 3
    });

    this.time.delayedCall(600, () => {
      this.feedbackText.setText('');
      this.isLocked = false;
      this.activePulse.resume();
      this.startScanning();
    });
  }

//   handleSuccess() {
//     this.feedbackText.setColor('#00ff66');
//     this.feedbackText.setText('GREAT JOB!');
//     if (this.settings.soundEnabled) this.successSound.play();

//     this.time.delayedCall(1000, () => {
//       this.score++;
//       this.scoreText.setText(`Score: ${this.score}`);
//       this.activePulse.resume();
//       this.startRound();
//     });
//   }
handleSuccess() {
  this.feedbackText.setColor('#00ff66');
  this.feedbackText.setText('GREAT JOB!');
  if (this.settings.soundEnabled) this.successSound.play();

  const sprite = this.tray[this.scanningIndex];
  const debugText = this.trayDebugText[this.scanningIndex];

  // Bring to front
  sprite.setDepth(20);
  debugText.setDepth(21);

  this.tweens.add({
    targets: [sprite, debugText],
    x: this.activeCardSprite.x,
    y: this.activeCardSprite.y,
    scale: 1.15,
    duration: 450,
    ease: 'Cubic.Out'
  });

  this.time.delayedCall(900, () => {
    this.score++;
    this.scoreText.setText(`Score: ${this.score}`);

    sprite.destroy();
    debugText.destroy();

    if (this.score >= this.settings.scoreGoal) {
    this.triggerVictory();
    return;
    }

    this.activePulse.resume();
    this.startRound();
  });
}
 /******************** VICTORY TRIGGER ******************/
triggerVictory() {
  this.inVictory = true;
  this.canReset = false;
  this.isLocked = true;

  // Stop all gameplay motion
  this.stopScanning();
  this.activePulse.pause();

  // Clear tray cards
  this.scanBox.clear();
  this.tray.forEach(c => c.destroy());
  this.trayDebugText.forEach(t => t.destroy());
  this.tray = [];
  this.trayDebugText = [];


/******************** FIREWORKS ******************/

  // Fireworks particles
  this.fireworks = this.add.particles(0, 0, 'deck', {
    frame: Phaser.Utils.Array.NumberArray(0, 51), // safe frames
    x: { min: 0, max: this.scale.width },
    y: this.scale.height,
    speed: { min: 200, max: 1500 },
    angle: { min: 240, max: 300 },
    lifespan: 1400,
    gravityY: 900,
    quantity: 2,
    scale: { start: 0.4, end: 0 },
    blendMode: 'NORMAL'
  });
   //victory sound 
    if (this.settings.soundEnabled) this.victorySound.play();
  
  // Victory text
  this.victoryText = this.add.text(
    this.scale.width / 2,
    this.scale.height / 2,
    'YOU DID IT!',
    {
      fontFamily: 'Arial Black',
      fontSize: '110px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 12
    }
  ).setOrigin(0.5).setDepth(50);

  // Gentle scale-in
  this.victoryText.setScale(0.6);
  this.tweens.add({
    targets: this.victoryText,
    scale: 1,
    duration: 600,
    ease: 'Back.Out'
  });

  // Minimum display time
  this.time.delayedCall(3000, () => {
    this.canReset = true;
  });
}

createFireworks() {
  const width = this.scale.width;
  const height = this.scale.height;

  const particles = this.add.particles(0, 0, 'deck');

  // 🔑 ALL frames from deck.png
  const frames = this.textures.get('deck').getFrameNames();

  // Multiple launch zones
  for (let i = 0; i < 5; i++) {
    const launchX = Phaser.Math.Between(80, width - 80);

    particles.createEmitter({
      frame: frames,

      x: launchX,
      y: height + 50,

      speed: { min: 200, max: 400 },
      angle: { min: 240, max: 300 },
      lifespan: { min: 900, max: 1400 },

      gravityY: 900,
      quantity: 6,

      scale: { start: 0.85, end: 0 },
      rotate: { min: 0, max: 360 },

      blendMode: 'NORMAL',

      tint: [
        0xff3b3b, // red
        0x4dd0ff, // blue
        0xffe066, // yellow
        0x66ff99  // green
      ]
    });
  }

  // Subtle sparkle accent (controlled ADD)
  particles.createEmitter({
    frame: frames,

    x: { min: 120, max: width - 120 },
    y: { min: 100, max: height / 2 },

    speed: { min: 50, max: 180 },
    lifespan: 600,
    quantity: 1,
    frequency: 220,

    scale: { start: 0.35, end: 0 },
    alpha: { start: 0.6, end: 0 },

    blendMode: 'ADD',
    tint: 0xffffff
  });

  return particles;
}
// createFireworks() {
//   const width = this.scale.width;
//   const height = this.scale.height;

//   const particles = this.add.particles(0, 0, 'deck');

//   particles.createEmitter({
//     frame: [0, 1, 2, 3, 4, 5, 6, 13, 25, 37], // safe frames from deck.png
//     x: { min: 50, max: width - 50 },
//     y: height + 20,
//     speed: { min: 350, max: 700 },
//     angle: { min: 240, max: 300 },
//     lifespan: { min: 900, max: 1400 },
//     gravityY: 900,
//     quantity: 20,
//     frequency: 120,
//     scale: { start: 0.9, end: 0 },
//     rotate: { min: 0, max: 360 },
//     tint: [
//       0xff3b3b, // red
//       0xffe066, // yellow
//       0x4dd0ff, // blue
//       0x66ff99, // green
//       0xffffff  // white
//     ],
//     blendMode: 'ADD'
//   });

//   return particles;
// }

 /******************** RESET GAME ******************/

resetGame() {
  if (this.fireworks) {
    this.fireworks.destroy();
    this.fireworks = null;
  }

  if (this.victoryText) {
    this.victoryText.destroy();
    this.victoryText = null;
  }

  this.inVictory = false;
  this.canReset = false;
  this.isLocked = false;

  this.score = 0;
  this.scoreText.setText('Score: 0');

  this.activePulse.resume();
  this.startRound();
}


  /******************** SETTINGS ACCESS ******************/
  createSettingsButton() {
    this.add.text(
      CONFIG.width - 40,
      CONFIG.height - 40,
      '⚙',
      { fontSize: '48px', color: '#ffffff' }
    ).setOrigin(0.5).setInteractive()
     .on('pointerdown', () => this.openSettings());
  }

  setupHiddenSettingsAccess() {
    let taps = 0;
    let timer = null;

    this.input.on('pointerdown', () => {
      taps++;
      if (this.settings.autoFullscreen) {
        this.scale.startFullscreen();
        }
      if (taps === 1) timer = this.time.delayedCall(2500, () => taps = 0);
      if (taps >= 10) {
        taps = 0;
        if (timer) timer.remove();
        this.openSettings();
      }
    });
  }

  openSettings() {
    this.stopScanning();
    this.scene.pause();
    this.scene.launch('Settings', {
      settings: this.settings,
      onClose: updated => {
        applyScanSpeed(updated);
        this.settings = updated;
        saveSettings(updated);
        this.scene.resume();
        this.startRound();
      }
    });
  }
}

/******************** SETTINGS SCENE *********************/
class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(data) {
    this.settings = { ...data.settings };
    this.onClose = data.onClose;
    
    this.add.rectangle(0, 0, CONFIG.width, CONFIG.height, 0x000000).setOrigin(0);

    this.add.text(CONFIG.width / 2, 60, 'Caregiver Settings', {
      fontSize: '48px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5);

    let y = 140;

    this.createScoreGoalSetting(200, y);
    
    y += 90;

    /* Scan speed */
    this.add.text(200, y, 'Scan Speed:  ', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffffff'
    });

    ['fast', 'medium', 'slow'].forEach((s, i) => {
      this.add.text(
        480 + i * 160, y, s.toUpperCase(),
        {
          fontSize: '28px',
          fontFamily: 'Arial Black',
          color: this.settings.scanSpeed === s ? '#00ff66' : '#ffffff'
        }
      ).setInteractive().on('pointerdown', () => {
        this.settings.scanSpeed = s;
        this.scene.restart({ settings: this.settings, onClose: this.onClose });
      });
    });

    y += 80;

    const addToggle = (label, key) => {
      const t = this.add.text(200, y, '', {
        fontSize: '32px', fontFamily: 'Arial Black', color: '#ffffff'
      }).setInteractive();

      const refresh = () =>
        t.setText(`${label}: ${this.settings[key] ? 'ON' : 'OFF'}`);

      t.on('pointerdown', () => {
        this.settings[key] = !this.settings[key];
        refresh();
      });

      refresh();
      y += 56;
    };
    //     //CREATE GOAL SCORE MENU
    // createScoreGoalSetting(x, y) {
    // const title = this.add.text(x, y, 'Score Goal', {
    //     fontSize: '38px',
    //     fontFamily: 'Arial Black',
    //     color: '#ffffff'
    // });

    // const options = [5, 10, 15, 20];
    // this.scoreGoalButtons = [];

    // options.forEach((value, index) => {
    //     const btn = this.add.text(
    //     x + 260 + index * 100,
    //     y,
    //     value.toString(),
    //     {
    //         fontSize: '36px',
    //         fontFamily: 'Arial Black',
    //         color: value === this.settings.scoreGoal ? '#00ff66' : '#cccccc',
    //         backgroundColor: '#222222',
    //         padding: { x: 18, y: 12 }
    //     }
    //     )
    //     .setInteractive({ useHandCursor: true })
    //     .on('pointerdown', () => {
    //     this.settings.scoreGoal = value;
    //     this.refreshScoreGoalUI();
    //     });

    //     this.scoreGoalButtons.push(btn);
    // });
    // }
    addToggle('Auto Fullscreen', 'autoFullscreen');
    addToggle('Training Mode', 'trainingMode');
    addToggle('Repeat Until Correct', 'repeatTargetUntilCorrect');
    addToggle('Sound Effects', 'soundEnabled');
    addToggle('Animations', 'animationsEnabled');
    addToggle('Debug Mode', 'debugMode');


    this.add.text(
      CONFIG.width / 2,
      CONFIG.height - 80,
      'SAVE & RETURN',
      { fontSize: '42px', fontFamily: 'Arial Black', color: '#00ff66' }
    ).setOrigin(0.5).setInteractive()
     .on('pointerdown', () => {
       this.onClose(this.settings);
       this.scene.stop();
     });
    
    this.inVictory = false;
    this.canReset = false;
    this.fireworks = null;
    this.victoryText = null;
  }

createScoreGoalSetting(x, y) {
  const label = this.add.text(x, y, 'Victory Goal: ', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffffff'
    });

  const valueText = this.add.text(x + 40 + 300, y, this.settings.scoreGoal,        {
          fontSize: '28px',
          fontFamily: 'Arial Black',
          color: '#ffff00'
        }).setOrigin(0.5);

  const leftBtn = this.add.text(x + 40 + 230, y, '◀', {
    fontSize: '36px',
    color: '#ffffff'
  })
    .setOrigin(0.5)
    .setInteractive();

  const rightBtn = this.add.text(x + 40 + 370, y, '▶', {
    fontSize: '36px',
    color: '#ffffff'
  })
    .setOrigin(0.5)
    .setInteractive();

  const updateValue = () => {
    valueText.setText(this.settings.scoreGoal);
  };

  leftBtn.on('pointerdown', () => {
    const idx = GOAL_VALUES.indexOf(this.settings.scoreGoal);
    this.settings.scoreGoal =
      GOAL_VALUES[(idx - 1 + GOAL_VALUES.length) % GOAL_VALUES.length];
    updateValue();
  });

  rightBtn.on('pointerdown', () => {
    const idx = GOAL_VALUES.indexOf(this.settings.scoreGoal);
    this.settings.scoreGoal =
      GOAL_VALUES[(idx + 1) % GOAL_VALUES.length];
    updateValue();
  });
}

}

/******************** INIT *******************************/
new Phaser.Game({
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: '#000000',
  scene: [GameScene, SettingsScene]
});