import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let currentPage = "home";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 1, 2);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 2);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let canvas, ctx, canvasTexture;
let apps = [];
let scrollOffset = 0;

const projects = [
  {
    name: "3D Piano",
    description: "A simple 3d piano with three.js",
    technologies: "html, css, js",
    url: "https://piano-3d.vercel.app/",
  },
  {
    name: "ImgToAsciiJS",
    description: "A simple vanilla JS img converter : img => ascii img",
    technologies: "js",
    url: "https://github.com/nolanpcrd/ImgToAsciiJS",
  },
  {
    name: "Opticien Dijon",
    description: "A website for an optician in Dijon to sell items (unused but works)",
    technologies: "html, css, js - using Google Firebase",
    url: "http://opticiendijon.fr",
  },
  {
    name: "New r/place",
    description: "A copy of the famous Reddit r/place (wait 20s for the server to start then refresh)",
    technologies: "html, css, js - using Google Firebase to store the map",
    url: "https://newrplace.vercel.app",
  },
  {
    name: "Old portfolio",
    description: "My old portfolio",
    technologies: "html, css, js",
    url: "https://nolanpcrd.github.io/",
  },
];

const photos = [
  "nolan_pages1.png",
  "nolan_pages2.png",
  "nolan_pages3.png",
  "nolan_pages4.png",
  "site_edc.png",
  "cardify.png",
  "apple_vision_pro_spotify.png",
  "LE_Home.png",
  "LE_Chat.png",
  "LE_Profile.png",
  "EDC_Home.png",
  "EDC_Widgets.png"
];

class App {
  constructor(imageUrl, title, action, x, y) {
    this.imageUrl = imageUrl;
    this.title = title;
    this.action = action;
    this.x = x;
    this.y = y;
    this.size = 128;
  }

  async draw(ctx) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, this.x, this.y, this.size, this.size);
          ctx.fillStyle = "white";
          ctx.font = "32px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
              this.title,
              this.x + this.size / 2,
              this.y + this.size + 40
          );
          resolve();
        } catch (error) {
          console.error("Erreur lors du dessin:", error);
          resolve();
        }
      };
      img.onerror = () => {
        console.error("Erreur de chargement de l'image:", this.imageUrl);
        resolve();
      };
      img.src = this.imageUrl;
    });
  }

  isClicked(x, y) {
    return (
        x >= this.x &&
        x <= this.x + this.size &&
        y >= this.y &&
        y <= this.y + this.size
    );
  }
}

function addApp(imageUrl, title, action) {
  const index = apps.length;
  const row = Math.floor(index / 4);
  const col = index % 4;
  const padding = 96;
  const startX = 50;
  const startY = 100;
  const x = startX + col * (128 + padding);
  const y = startY + row * (128 + padding + 20);
  apps.push(new App(imageUrl, title, action, x, y));
}

async function refreshCanvas() {
  if (currentPage === "camera") {
    stopCameraFeed();
  }
  scrollOffset = 0;
  currentPage = "home";
  const bgImage = new Image();
  bgImage.src = "bg.webp";
  bgImage.onload = () => {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  };

  for (const app of apps) {
    await app.draw(ctx);
  }
  if (canvasTexture) {
    canvasTexture.needsUpdate = true;
  }
}

function createInteractiveCanvas() {
  canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 2048;
  ctx = canvas.getContext("2d");
  return canvas;
}

canvas = createInteractiveCanvas();
ctx = canvas.getContext("2d");

const loader = new GLTFLoader();
loader.load("phone.glb", (gltf) => {
  const phone = gltf.scene;
  const box = new THREE.Box3().setFromObject(phone);
  const size = new THREE.Vector3();
  box.getSize(size);
  phone.position.set(0, -size.y / 2, 0);
  phone.rotation.y = Math.PI;
  scene.add(phone);

  canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.flipY = false;
  canvasTexture.minFilter = THREE.LinearFilter;
  canvasTexture.magFilter = THREE.LinearFilter;
  canvasTexture.generateMipmaps = false;

  const screen = phone.getObjectByName("screen");
  if (screen) {
    if (!screen.geometry.attributes.uv) {
      console.error("Le modèle n'a pas d'UVs!");
      return;
    }
    screen.material = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      side: THREE.DoubleSide,
    });
    screen.geometry.attributes.uv.needsUpdate = true;
    screen.name = "screen";
    initializeApps();
  } else {
    console.error("Screen not found in the model");
  }
});

function initializeApps() {
  addApp("instagram.png", "Instagram", () => window.open("https://instagram.com/nolanpcrd", "_blank"));
  addApp("photos.png", "Photos", () => openPhotosCanvas());
  addApp("github.png", "GitHub", () => openGithubCanvas());
  addApp("camera.png", "Caméra", () => openCameraCanvas());
  refreshCanvas();
}

function drawProject(project, y) {
  const projectHeight = 300;
  const padding = 40;
  if (y + projectHeight < 500 || y > canvas.height) {
    return projectHeight + padding;
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(50, y, canvas.width - 100, projectHeight);
  ctx.fillStyle = "white";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "left";
  ctx.fillText(project.name, 70, y + 80);
  ctx.font = "36px Arial";
  if (project.description.length > 40) {
    let line1 = project.description.substring(0, 40);
    let line2 = project.description.substring(40);
    ctx.fillText(line1, 70, y + 160);
    ctx.fillText(line2, 70, y + 200);
  }
  else {
    ctx.fillText(project.description, 70, y + 160);
  }
  ctx.font = "32px Arial";
  ctx.fillStyle = "#888888";
  ctx.fillText(project.technologies, 70, y + 240);
  return projectHeight + padding;
}

function isComponentClicked(x, y, projectY, projectHeight) {
  return (
      x >= 50 &&
      x <= canvas.width - 50 &&
      y >= projectY &&
      y <= projectY + projectHeight
  );
}

function drawBackButton() {
  ctx.font = "60px Arial";
  ctx.textAlign = "left";
  const text = "Back";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "black";
  ctx.strokeText(text, 50, 120);
  ctx.fillStyle = "white";
  ctx.fillText(text, 50, 120);
}

function clearCanvas() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

const preloadedPhotos = [];
function preloadPhotos(photoList) {
  return Promise.all(
      photoList.map((photoUrl) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = photoUrl;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      })
  );
}
preloadPhotos(photos).then((images) => {
  preloadedPhotos.push(...images);
});

let photosPositions = [];
function openPhotosCanvas() {
  currentPage = "Photos";
  clearCanvas();
  let currentY = 250 + scrollOffset;
  ctx.fillStyle = 'white';
  ctx.font = '72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("My mockups", canvas.width / 2, currentY);
  currentY += 50;
  const desiredWidth = canvas.width - 100;
  const padding = 40;
  photosPositions = [];
  preloadedPhotos.forEach((img) => {
    if (img) {
      const photoHeight = desiredWidth * (img.naturalHeight / img.naturalWidth);
      photosPositions.push({ y: currentY, height: photoHeight });
      ctx.drawImage(img, 50, currentY, desiredWidth, photoHeight);
      currentY += photoHeight + padding;
    }
  });
  if (canvasTexture) {
    canvasTexture.needsUpdate = true;
  }
  drawBackButton();
}

function openGithubCanvas() {
  currentPage = "github";
  const image = new Image();
  image.src = "github.png";
  image.onload = () => {
    clearCanvas();
    drawBackButton();
    const logoSize = 200;
    ctx.drawImage(
        image,
        (canvas.width - logoSize) / 2,
        160,
        logoSize,
        logoSize
    );
    ctx.fillStyle = "white";
    ctx.font = "72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("My projects", canvas.width / 2, 450);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 500, canvas.width, canvas.height - 500);
    ctx.clip();
    let currentY = 500 + scrollOffset;
    for (const project of projects) {
      currentY += drawProject(project, currentY);
    }
    if (canvasTexture) {
      canvasTexture.needsUpdate = true;
    }
    ctx.restore();
  };
}

let video = null;
let videoStream = null;

async function startCameraFeed() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Your browser doesn't support camera access");
    refreshCanvas();
    return;
  }
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (!video) {
      video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
    }
    video.srcObject = videoStream;
    await video.play();
  } catch (error) {
    alert(error);
  }
}

function stopCameraFeed() {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }
  if (video) {
    video.pause();
    video.srcObject = null;
  }
}

function updateCameraCanvas() {
  if (currentPage !== "camera") return;
  if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
    clearCanvas();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawBackButton();
    if (canvasTexture) {
      canvasTexture.needsUpdate = true;
    }
  }
  requestAnimationFrame(updateCameraCanvas);
}

async function openCameraCanvas() {
  currentPage = "camera";
  clearCanvas();
  await startCameraFeed();
  updateCameraCanvas();
}


window.addEventListener("wheel", (event) => {
  if (currentPage === "github") {
    const totalHeight = projects.length * 340;
    const maxScroll = -(totalHeight - 1200);
    scrollOffset -= event.deltaY * 0.5;
    scrollOffset = Math.min(0, Math.max(maxScroll, scrollOffset));
    openGithubCanvas();
  } else if (currentPage === "Photos") {
    const totalHeight = photos.length * 740;
    const maxScroll = -(totalHeight + 4500);
    scrollOffset -= event.deltaY * 0.5;
    scrollOffset = Math.min(0, Math.max(maxScroll, scrollOffset));
    openPhotosCanvas();
  }
});

let touchStartY = 0;
let touchScrollOffset = scrollOffset;
window.addEventListener("touchstart", (event) => {
  if (currentPage !== "home" && currentPage !== "camera") {
    controls.enabled = false;
  }
  touchStartY = event.touches[0].clientY;
  touchScrollOffset = scrollOffset;
});

window.addEventListener("touchmove", (event) => {
  const touchY = event.touches[0].clientY;
  const deltaY = touchY - touchStartY;
  if (currentPage === "github") {
    const totalHeight = projects.length * 340;
    const maxScroll = -(totalHeight - 1200);
    scrollOffset = touchScrollOffset + deltaY * 1.5;
    scrollOffset = Math.min(0, Math.max(maxScroll, scrollOffset));
    openGithubCanvas();
  } else if (currentPage === "Photos") {
    const totalHeight = photos.length * 740;
    const maxScroll = -(totalHeight + 4500);
    scrollOffset = touchScrollOffset + deltaY * 1.5;
    scrollOffset = Math.min(0, Math.max(maxScroll, scrollOffset));
    openPhotosCanvas();
  }
});

window.addEventListener("touchend", () => {
    controls.enabled = true;
});

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject.name === "screen") {
      const uv = intersects[0].uv;
      if (!uv) {
        console.error("UV coordinates not found!");
        return;
      }
      const x = Math.floor(uv.x * canvas.width);
      const y = Math.floor(uv.y * canvas.height);
      if (x < 200 && y < 150 && currentPage !== "home") {
        refreshCanvas();
        return;
      }
      if (currentPage === "github") {
        let currentY = 500 + scrollOffset;
        for (const project of projects) {
          if (isComponentClicked(x, y, currentY, 300)) {
            window.open(project.url, "_blank");
            return;
          }
          currentY += 340;
        }
      }
      if (currentPage === "Photos") {
        for (let i = 0; i < photosPositions.length; i++) {
          const pos = photosPositions[i];
          if (isComponentClicked(x, y, pos.y, pos.height)) {
            window.open(photos[i], "_blank");
            return;
          }
        }
      }
      if (currentPage === "home") {
        for (const app of apps) {
          if (app.isClicked(x, y)) {
            app.action();
            return;
          }
        }
      }
    }
  }
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;
controls.maxDistance = 0.19;
controls.minDistance = 0.19;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
