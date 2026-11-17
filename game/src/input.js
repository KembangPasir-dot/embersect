export const inputState = {
  selectedCultivatorType: 1, // 1: Sword Cultivator, 2: Talisman Master, 3: Formation Keeper
  hoveredTile: null,
  selectedTile: null,
  mousePos: { x: 0, y: 0 },
  clicked: false,
  rightClicked: false,
  keys: {
    space: false,
    p: false,
    r: false,
    m: false,
    esc: false,
    enter: false,
    g: false,
    f: false,
    num1: false,
    num2: false,
    num3: false
  },
  consumeClick() {
    const c = this.clicked;
    this.clicked = false;
    return c;
  },
  consumeRightClick() {
    const rc = this.rightClicked;
    this.rightClicked = false;
    return rc;
  },
  consumeKey(keyName) {
    const val = this.keys[keyName];
    this.keys[keyName] = false;
    return val;
  }
};

export function initInput(canvas) {
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    inputState.mousePos.x = e.clientX - rect.left;
    inputState.mousePos.y = e.clientY - rect.top;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    inputState.mousePos.x = e.clientX - rect.left;
    inputState.mousePos.y = e.clientY - rect.top;
    if (e.button === 0) {
      inputState.clicked = true;
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    inputState.rightClicked = true;
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit1') inputState.keys.num1 = true;
    if (e.code === 'Digit2') inputState.keys.num2 = true;
    if (e.code === 'Digit3') inputState.keys.num3 = true;
    if (e.code === 'KeyP') inputState.keys.p = true;
    if (e.code === 'KeyR') inputState.keys.r = true;
    if (e.code === 'KeyM') inputState.keys.m = true;
    if (e.code === 'KeyG') inputState.keys.g = true;
    if (e.code === 'KeyF') inputState.keys.f = true;
    if (e.code === 'Escape') inputState.keys.esc = true;
    if (e.code === 'Enter') inputState.keys.enter = true;
    if (e.code === 'Space') {
      e.preventDefault();
      inputState.keys.space = true;
    }
  });
}
