import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configuração da Cena 3D com Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 300) / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth - 300, window.innerHeight);
document.getElementById('3d-container').appendChild(renderer.domElement);

// Controles de Órbita para Navegação
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.screenSpacePanning = false;

// Luzes
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10).normalize();
scene.add(directionalLight);

// Função para criar uma estrutura de prateleira
function createShelfStructure() {
  const shelfGroup = new THREE.Group();
  const shelfHeight = 1.5;
  const shelfWidth = 5;
  const shelfDepth = 2;

  // Estruturas verticais das prateleiras (simulando barras de suporte)
  const supportGeometry = new THREE.BoxGeometry(0.2, shelfHeight * 6, 0.2);
  const supportMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

  // Adicionar quatro barras verticais em cada canto da prateleira
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

  // Camadas de prateleira e itens
  for (let j = 0; j < 3; j++) {
    const shelfLayer = createShelfLayer(shelfWidth, shelfHeight, shelfDepth, j * shelfHeight * 2);
    shelfGroup.add(shelfLayer);
  }

  return shelfGroup;
}

// Função para criar uma camada de prateleira com itens
function createShelfLayer(width, height, depth, yPosition) {
  const layerGroup = new THREE.Group();
  const layerGeometry = new THREE.BoxGeometry(width, 0.1, depth);
  const layerMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
  const layer = new THREE.Mesh(layerGeometry, layerMaterial);
  layer.position.y = yPosition;
  layerGroup.add(layer);

  // Adicionar itens na prateleira
  for (let k = -1; k <= 1; k++) {
    const item = createItem(0x00ff00);
    item.position.set(k * 1.5, yPosition + 0.5, 0);
    layerGroup.add(item);
  }

  return layerGroup;
}

// Função para criar um item de estoque com uma cor específica
function createItem(color) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

// Adicionar filas de prateleiras ao cenário
const rows = 4; // Número de fileiras de prateleiras
const cols = 4; // Número de prateleiras por fileira

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const shelf = createShelfStructure();
    shelf.position.set(col * 8 - (cols * 4), 0, row * 12 - (rows * 6));
    scene.add(shelf);
  }
}

// Piso e paredes
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xCCCCCC, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

const wallGeometry = new THREE.PlaneGeometry(100, 20);
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xAAAAAA });
const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
backWall.position.set(0, 10, -rows * 6 - 6);
scene.add(backWall);

// Posicionamento da Câmera
camera.position.set(0, 10, 40);
camera.lookAt(0, 5, 0);

// Função de Animação
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Indicadores de Estoque
let totalItems = rows * cols * 3; // Total de itens, considerando cada prateleira tem 3 níveis
let lowStock = 2; // Exemplo inicial

// Atualizar indicadores
document.getElementById('total-items').innerText = `Total de Itens: ${totalItems}`;
document.getElementById('low-stock').innerText = `Estoque Baixo: ${lowStock}`;

// Configuração do Gráfico de Estoque (Chart.js)
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

  scene.traverse((object) => {
    if (object.isMesh && object.geometry.type === 'BoxGeometry' && object.material.color.getHex() !== 0x8B4513) {
      const randomQty = Math.floor(Math.random() * 15) + 1;
      object.material.color.set(randomQty <= 3 ? 0xff0000 : 0x00ff00);
      object.scale.y = randomQty / 15;
    }
  });
}

// Simulação a cada 3 segundos
setInterval(simulateStockMovement, 3000);
