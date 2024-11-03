import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 300) / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth - 300, window.innerHeight);
document.getElementById('3d-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.screenSpacePanning = false;

const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10).normalize();
scene.add(directionalLight);

const rows = 4;
const cols = 4;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedItemInfo = document.getElementById('item-info');

// Função para criar um item de estoque com dados personalizados
function createItem(color, type, quantity) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color });
  const item = new THREE.Mesh(geometry, material);

  // Adiciona dados ao item para exibir ao ser clicado
  item.userData = { isStockItem: true, type, quantity };
  return item;
}

// Função para criar uma camada de prateleira com itens
function createShelfLayer(width, height, depth, yPosition) {
  const layerGroup = new THREE.Group();
  const layerGeometry = new THREE.BoxGeometry(width, 0.1, depth);
  const layerMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
  const layer = new THREE.Mesh(layerGeometry, layerMaterial);
  layer.position.y = yPosition;
  layerGroup.add(layer);

  for (let k = -1; k <= 1; k++) {
    const quantity = Math.floor(Math.random() * 10) + 1;
    const item = createItem(0x00ff00, `Item ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`, quantity);
    item.position.set(k * 1.5, yPosition + 0.5, 0);
    layerGroup.add(item);
  }

  return layerGroup;
}

// Detecta cliques para selecionar itens
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    if (selectedObject.userData.isStockItem) {
      const { type, quantity } = selectedObject.userData;
      selectedItemInfo.innerText = `Tipo: ${type}, Quantidade: ${quantity}`;
    } else {
      selectedItemInfo.innerText = "Nenhum item selecionado";
    }
  }
}

// Adiciona evento de clique
window.addEventListener('click', onMouseClick);

// Função para criar estrutura de prateleira
function createShelfStructure() {
  const shelfGroup = new THREE.Group();
  const shelfHeight = 1.5;
  const shelfWidth = 5;
  const shelfDepth = 2;

  const supportGeometry = new THREE.BoxGeometry(0.2, shelfHeight * 6, 0.2);
  const supportMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const supportPositions = [
    [-shelfWidth / 2, shelfHeight * 1.5, -shelfDepth / 2],
    [shelfWidth / 2, shelfHeight * 1.5, -shelfDepth / 2],
    [-shelfWidth / 2, shelfHeight * 1.5, shelfDepth / 2],
    [shelfWidth / 2, shelfHeight * 1.5, shelfDepth / 2],
  ];

  supportPositions.forEach(pos => {
    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(...pos);
    shelfGroup.add(support);
  });

  for (let j = 0; j < 3; j++) {
    const shelfLayer = createShelfLayer(shelfWidth, shelfHeight, shelfDepth, j * shelfHeight * 2);
    shelfGroup.add(shelfLayer);
  }

  return shelfGroup;
}

// Função para criar o armazém com várias prateleiras
function createWarehouse() {
  const warehouseGroup = new THREE.Group();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const shelf = createShelfStructure();
      shelf.position.set(col * 8 - (cols * 4), 0, row * 12 - (rows * 6));
      warehouseGroup.add(shelf);
    }
  }
  return warehouseGroup;
}

// Criação e exibição dos armazéns
const warehouses = [];
for (let i = 0; i < 3; i++) {
  const warehouse = createWarehouse();
  warehouse.visible = i === 0;
  warehouses.push(warehouse);
  scene.add(warehouse);
}

function updateWarehouseVisibility(selectedIndex) {
  warehouses.forEach((warehouse, index) => {
    warehouse.visible = index === selectedIndex;
  });
}

document.getElementById('warehouse-select').addEventListener('change', (event) => {
  const selectedWarehouse = parseInt(event.target.value);
  updateWarehouseVisibility(selectedWarehouse);
});

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xCCCCCC, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// Adiciona paredes com janelas
function addStaticWallsWithWindows() {
  const wallHeight = 20;
  const wallWidth = 100;
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xAAAAAA });
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.5 });
  const windowGeometry = new THREE.BoxGeometry(wallWidth / 5, wallHeight / 2, 1);

  for (let zPos of [-50, 50]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMaterial);
    wall.position.set(0, wallHeight / 2, zPos);
    scene.add(wall);

    for (let i = -1; i <= 1; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(i * (wallWidth / 3), wallHeight / 2, zPos - 0.5);
      scene.add(window);
    }
  }

  for (let xPos of [-50, 50]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMaterial);
    wall.position.set(xPos, wallHeight / 2, 0);
    wall.rotation.y = Math.PI / 2;
    scene.add(wall);

    for (let i = -1; i <= 1; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(xPos - 0.5, wallHeight / 2, i * (wallWidth / 3));
      window.rotation.y = Math.PI / 2;
      scene.add(window);
    }
  }
}

addStaticWallsWithWindows();

camera.position.set(0, 10, 40);
camera.lookAt(0, 5, 0);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Indicadores de Estoque
let totalItems = rows * cols * 3;
let lowStock = 2;

document.getElementById('total-items').innerText = `Total de Itens: ${totalItems}`;
document.getElementById('low-stock').innerText = `Estoque Baixo: ${lowStock}`;

const ctx = document.getElementById('stock-chart').getContext('2d');
const stockChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Item A', 'Item B', 'Item C'],
    datasets: [{
      label: 'Quantidade em Estoque',
      data: [10, 2, 8],
      backgroundColor: ['#4caf50', '#f44336', '#2196f3']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

// Função para simular a movimentação de itens e atualização dos indicadores
function simulateStockMovement() {
  const quantities = [
    Math.floor(Math.random() * 15) + 1,
    Math.floor(Math.random() * 5) + 1,
    Math.floor(Math.random() * 10) + 1
  ];

  stockChart.data.datasets[0].data = quantities;
  stockChart.update();

  totalItems = quantities.reduce((acc, qty) => acc + qty, 0);
  lowStock = quantities.filter(qty => qty <= 3).length;

  document.getElementById('total-items').innerText = `Total de Itens: ${totalItems}`;
  document.getElementById('low-stock').innerText = `Estoque Baixo: ${lowStock}`;

  // Atualiza apenas os itens de estoque, ignorando janelas e outros elementos
  scene.traverse((object) => {
    if (object.isMesh && object.userData.isStockItem) {
      const randomQty = Math.floor(Math.random() * 15) + 1;
      object.material.color.set(randomQty <= 3 ? 0xff0000 : 0x00ff00);
      object.scale.y = randomQty / 15;
      object.userData.quantity = randomQty; // Atualiza a quantidade nos dados do item
    }
  });
}

// Simulação a cada 3 segundos
setInterval(simulateStockMovement, 3000);
