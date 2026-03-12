const background = document.getElementById("background");
const room = document.querySelector(".room");
const counter = document.getElementById("counter");
const message = document.getElementById("message");
const items = [
  { x: 645.12, y: 30.72, width: 30.72, height: 46.08 },
  { x: 409.6, y: 691.2, width: 30.72, height: 46.08 },
  { x: 716.8, y: 460.8, width: 30.72, height: 46.08 },
  { x: 317.44, y: 261.12, width: 30.72, height: 46.08 },
  { x: 614.4, y: 1413.12, width: 30.72, height: 46.08 },
];
const zones = [];
let resizeObserver;

let count = 0;

function createZones() {
  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    const zone = document.createElement("button");
    zone.type = "button";
    zone.className = "zone";
    zone.dataset.index = index;
    zone.dataset.x = item.x;
    zone.dataset.y = item.y;
    zone.dataset.width = item.width;
    zone.dataset.height = item.height;
    zone.setAttribute("aria-label", `Objet cache ${index + 1}`);
    zone.addEventListener("click", () => found(zone));

    zones.push(zone);
    fragment.appendChild(zone);
  });

  room.appendChild(fragment);
}

function positionZones() {
  const naturalWidth = background.naturalWidth;
  const naturalHeight = background.naturalHeight;

  if (!naturalWidth || !naturalHeight) {
    return;
  }

  const roomWidth = room.clientWidth;
  const roomHeight = room.clientHeight;

  if (!roomWidth || !roomHeight) {
    return;
  }

  const imageRatio = naturalWidth / naturalHeight;
  const roomRatio = roomWidth / roomHeight;
  let renderedWidth = roomWidth;
  let renderedHeight = roomHeight;
  let offsetLeft = 0;
  let offsetTop = 0;

  if (roomRatio > imageRatio) {
    renderedWidth = roomHeight * imageRatio;
    offsetLeft = (roomWidth - renderedWidth) / 2;
  } else {
    renderedHeight = roomWidth / imageRatio;
    offsetTop = (roomHeight - renderedHeight) / 2;
  }

  const scaleX = renderedWidth / naturalWidth;
  const scaleY = renderedHeight / naturalHeight;
  const hitScale = getHitScale();

  zones.forEach((zone) => {
    const x = Number(zone.dataset.x);
    const y = Number(zone.dataset.y);
    const width = Number(zone.dataset.width);
    const height = Number(zone.dataset.height);
    const scaledWidth = width * scaleX;
    const scaledHeight = height * scaleY;
    const extraWidth = (scaledWidth * hitScale - scaledWidth) / 2;
    const extraHeight = (scaledHeight * hitScale - scaledHeight) / 2;

    zone.style.left = `${offsetLeft + x * scaleX - extraWidth}px`;
    zone.style.top = `${offsetTop + y * scaleY - extraHeight}px`;
    zone.style.width = `${scaledWidth * hitScale}px`;
    zone.style.height = `${scaledHeight * hitScale}px`;
  });
}

function getHitScale() {
  const shortestSide = Math.min(window.innerWidth, window.innerHeight);

  if (shortestSide <= 480) {
    return 2.2;
  }

  if (shortestSide <= 768) {
    return 1.75;
  }

  return 1;
}

function found(element) {
  if (element.classList.contains("found")) {
    return;
  }

  element.classList.add("found");
  count += 1;
  counter.innerText = count;

  if (count === zones.length) {
    message.innerText =
      "Bravo ! Vous avez trouve les 5 objets. Envoyez un screen a l'animateur.";
  }
}

createZones();

if (background.complete) {
  positionZones();
} else {
  background.addEventListener("load", positionZones);
}

window.addEventListener("resize", positionZones);
window.addEventListener("orientationchange", positionZones);

if ("ResizeObserver" in window) {
  resizeObserver = new ResizeObserver(positionZones);
  resizeObserver.observe(room);
  resizeObserver.observe(background);
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", positionZones);
}
