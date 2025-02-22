let currentScreen = 1;

function nextScreen() {
  currentScreen++;
  renderScreen();
}

function renderScreen() {
    const screen = document.getElementById('screen' + currentScreen);
    const previousScreen = document.getElementById('screen' + (currentScreen - 1));
    previousScreen.style.display = 'none';
    screen.style.display = 'flex';
}

const nextButtons = document.getElementsByClassName('next');
for (let i = 0; i < nextButtons.length; i++) {
    nextButtons[i].addEventListener('click', nextScreen);
}